const functions = require("firebase-functions")
const admin = require("firebase-admin")

exports.scheduledAuditLogCleanup = functions.pubsub
  .schedule("0 0 * * *") // Runs daily at midnight
  .timeZone("UTC")
  .onRun(async (context) => {
    const db = admin.firestore()
    const batch = db.batch()
    let totalDeletedLogs = 0
    let processedMachines = 0
    const errors = []

    try {
      // Get all machines with audit logging enabled
      const machinesSnapshot = await db.collection("machines").where("auditEnabled", "==", true).get()

      // Process each machine
      for (const machineDoc of machinesSnapshot.docs) {
        try {
          const machineData = machineDoc.data()
          // Use configured retention period or default to 30 days
          const retentionDays = machineData.auditRetentionDays || 30

          // Calculate the cutoff date based on retention period
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

          // Query for logs older than the retention period
          const oldLogsSnapshot = await db
            .collection("access_logs")
            .where("machineId", "==", machineDoc.id)
            .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(cutoffDate))
            .get()

          // Add delete operations to batch
          oldLogsSnapshot.docs.forEach((logDoc) => {
            batch.delete(logDoc.ref)
            totalDeletedLogs++
          })

          // Log the cleanup activity
          if (oldLogsSnapshot.size > 0) {
            const cleanupLogRef = db.collection("access_logs").doc()
            batch.set(cleanupLogRef, {
              machineId: machineDoc.id,
              action: "scheduled_cleanup",
              status: "success",
              details: `Deleted ${oldLogsSnapshot.size} logs older than ${retentionDays} days`,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            })
          }

          processedMachines++

          // Commit batch every 500 operations to avoid hitting limits
          if (totalDeletedLogs >= 450) {
            await batch.commit()
            totalDeletedLogs = 0
          }
        } catch (error) {
          console.error(`Error processing machine ${machineDoc.id}:`, error)
          errors.push({
            machineId: machineDoc.id,
            error: error.message || "Unknown error",
          })
        }
      }

      // Commit any remaining operations
      if (totalDeletedLogs > 0) {
        await batch.commit()
      }

      // Log summary
      await db.collection("system_logs").add({
        type: "scheduled_cleanup_summary",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
          processedMachines,
          totalDeletedLogs,
          errors: errors.length > 0 ? errors : null,
        },
      })

      return null
    } catch (error) {
      console.error("Scheduled cleanup failed:", error)
      throw error
    }
  })