// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\functions\index.js

const admin = require("firebase-admin")
const { cleanupUncompletedMachines } = require("./src/cleanupMachines")
const { getCleanupStatus } = require("./src/getCleanupStatus")
const { scheduledAuditLogCleanup } = require("./src/scheduleAuditLogCleanup")
const { manualAuditLogCleanup } = require("./src/manualAuditLogCleanup")

if (!admin.apps.length) {
  admin.initializeApp()
}

exports.cleanupUncompletedMachines = cleanupUncompletedMachines
exports.getCleanupStatus = getCleanupStatus
exports.scheduledAuditLogCleanup = scheduledAuditLogCleanup
exports.manualAuditLogCleanup = manualAuditLogCleanup

