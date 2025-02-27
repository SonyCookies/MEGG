// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\functions\src\getCleanupStatus.js

const functions = require("firebase-functions")
const admin = require("firebase-admin")

/**
 * HTTP function to get the status of the last cleanup run
 */
exports.getCleanupStatus = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Methods", "GET")
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    res.status(204).send("")
    return
  }

  try {
    const db = admin.firestore()

    const summarySnapshot = await db
      .collection("system_logs")
      .where("type", "==", "scheduled_cleanup_summary")
      .orderBy("timestamp", "desc")
      .limit(1)
      .get()

    if (summarySnapshot.empty) {
      res.status(404).json({
        success: false,
        message: "No cleanup history found",
      })
      return
    }

    const summary = summarySnapshot.docs[0].data()

    res.status(200).json({
      success: true,
      data: {
        lastRun: summary.timestamp.toDate(),
        processedMachines: summary.details.processedMachines,
        totalDeletedLogs: summary.details.totalDeletedLogs,
        errors: summary.details.errors,
      },
    })
  } catch (error) {
    console.error("Error getting cleanup status:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    })
  }
})

