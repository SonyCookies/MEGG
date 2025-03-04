const functions = require("firebase-functions")
const admin = require("firebase-admin")
const { jwtVerify } = require("jose")

const JWT_SECRET = functions.config().jwt.secret

exports.manualAuditLogCleanup = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Methods", "POST")
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    res.status(204).send("")
    return
  }

  try {
    if (req.method !== "POST") {
      throw new Error("Method not allowed")
    }

    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("No authorization header found")
      return res.status(401).json({
        success: false,
        message: "No authorization token provided",
      })
    }

    const token = authHeader.split("Bearer ")[1]

    try {
      // Verify the JWT token
      const secret = new TextEncoder().encode(JWT_SECRET)
      const { payload } = await jwtVerify(token, secret)
    
      // Verify machine ID matches
      const { machineId } = req.body
      if (!machineId) {
        return res.status(400).json({
          success: false,
          message: "Machine ID is required",
        })
      }
    
      if (payload.machineId !== machineId) {
        return res.status(403).json({
          success: false,
          message: "Machine ID mismatch",
        })
      }
    
      const db = admin.firestore()
    
      // Get machine settings to check retention period
      const machineDoc = await db.collection("machines").doc(machineId).get()
    
      if (!machineDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Machine not found",
        })
      }
    
      const machineData = machineDoc.data()
    
      // Check if audit logging is enabled
      if (!machineData.auditEnabled) {
        return res.status(400).json({
          success: false,
          message: "Audit logging is disabled for this machine",
        })
      }
    
      // Use configured retention period or default to 30 days
      const retentionDays = machineData.auditRetentionDays || 30
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
    
      const logsRef = db.collection("access_logs")
      const oldLogs = await logsRef
        .where("machineId", "==", machineId)
        .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(cutoffDate))
        .get()
    
      if (oldLogs.empty) {
        return res.status(200).json({
          success: true,
          message: `No logs found older than ${retentionDays} days`,
          deletedCount: 0,
          retentionDays,
        })
      }
    
      const batch = db.batch()
      oldLogs.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })
      await batch.commit()
    
      // Log the cleanup action
      await logsRef.add({
        machineId,
        action: "manual_cleanup",
        status: "success",
        details: `Manually deleted ${oldLogs.size} logs older than ${retentionDays} days`,
        timestamp: new Date().toISOString(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    
      return res.status(200).json({
        success: true,
        message: `Successfully deleted ${oldLogs.size} logs older than ${retentionDays} days`,
        deletedCount: oldLogs.size,
        retentionDays,
      })
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError)
      return res.status(401).json({
        success: false,
        message: "Invalid authorization token",
      })
    }
  } catch (error) {
    console.error("Cleanup error:", error)
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    })
  }
})