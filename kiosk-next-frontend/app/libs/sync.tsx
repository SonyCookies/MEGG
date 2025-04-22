// D:\4THYEAR\CAPSTONE\MEGG\kiosk-next-frontend\app\libs\sync.tsx

import { db, storage } from "./firebaseConfig"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
import { ref, uploadString } from "firebase/storage"
import {
  getUnsyncedDefectLogs,
  getUnsyncedImageRecords,
  updateDefectLogSyncStatus,
  updateImageRecordUploadStatus,
  deleteDefectLog,
  deleteImageRecord,
  verifyNoUnsyncedRecords,
} from "../indexedDB"

// ==========================================
// Types
// ==========================================
interface DefectLog {
  id: number
  timestamp: number
  machine_id?: string
  batch_number?: string
  synced: boolean
  imageUrl?: string
  defectType?: string
  [key: string]: unknown
}

interface ImageRecord {
  id: number
  timestamp: number
  storage_path?: string
  imageData: string
  uploaded: boolean
  [key: string]: unknown
}

// ==========================================
// Constants
// ==========================================
const DEFECT_LOG_BATCH_SIZE = 5
const IMAGE_RECORD_BATCH_SIZE = 3
const BATCH_DELAY_MS = 500

// ==========================================
// Sync Lock
// ==========================================
let isSyncing = false

// ==========================================
// Logger Setup
// ==========================================
const logger = {
  log: (message: string) => console.log(`[Sync] ${message}`),
  warn: (message: string) => console.warn(`[Sync] ${message}`),
  error: (message: string, error?: unknown) => console.error(`[Sync] ${message}`, error || ""),
}

// ==========================================
// Helper Functions
// ==========================================
/**
 * Ensures the ID is a number
 */
function ensureNumericId(id: string | number): number {
  return typeof id === "string" ? Number.parseInt(id, 10) : id
}

/**
 * Creates a clean object for Firebase by excluding specified properties
 */
function createCleanObject<T extends Record<string, unknown>>(
  source: T,
  excludeProps: string[] = [],
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  Object.keys(source).forEach((key) => {
    if (!excludeProps.includes(key)) {
      result[key] = source[key]
    }
  })

  return result
}

/**
 * Delay execution for a specified time
 */
async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ==========================================
// Main Sync Function
// ==========================================
export async function syncData(): Promise<void> {
  if (isSyncing) {
    logger.log("Sync already in progress, skipping")
    return
  }

  try {
    isSyncing = true
    logger.log("Starting data sync...")

    // First sync defect logs
    await syncDefectLogs()

    // Verify defect logs are synced before proceeding
    const defectVerification = await verifyNoUnsyncedRecords()
    if (defectVerification.defectLogsCount > 0) {
      logger.warn(`Still found ${defectVerification.defectLogsCount} unsynced defect logs after sync`)
    }

    // Then sync image records
    await syncImageRecords()

    // Final verification
    const finalVerification = await verifyNoUnsyncedRecords()
    if (!finalVerification.allSynced) {
      logger.warn(
        `After sync completion, found ${finalVerification.defectLogsCount} unsynced defect logs and ${finalVerification.imageRecordsCount} unsynced image records`,
      )
    } else {
      logger.log("Sync verification successful: All records synced")
    }

    logger.log("Data sync completed.")
  } catch (error) {
    logger.error("Error during sync:", error)
  } finally {
    isSyncing = false
  }
}

// ==========================================
// Defect Logs Sync
// ==========================================
async function syncDefectLogs(): Promise<void> {
  logger.log("Syncing defect logs...")
  const unsyncedLogs = (await getUnsyncedDefectLogs()) as unknown as DefectLog[]
  logger.log(`Found ${unsyncedLogs.length} unsynced defect logs.`)

  if (unsyncedLogs.length === 0) {
    return
  }

  // Process logs in batches
  for (let i = 0; i < unsyncedLogs.length; i += DEFECT_LOG_BATCH_SIZE) {
    const batch = unsyncedLogs.slice(i, i + DEFECT_LOG_BATCH_SIZE)
    const batchNumber = Math.floor(i / DEFECT_LOG_BATCH_SIZE) + 1
    const totalBatches = Math.ceil(unsyncedLogs.length / DEFECT_LOG_BATCH_SIZE)

    logger.log(`Processing batch ${batchNumber} of ${totalBatches}`)

    // Process each log in the batch sequentially
    for (const log of batch) {
      await processDefectLog(log)
    }

    // Small delay between batches to allow IndexedDB to settle
    if (i + DEFECT_LOG_BATCH_SIZE < unsyncedLogs.length) {
      await delay(BATCH_DELAY_MS)
    }
  }
}

/**
 * Process a single defect log
 */
async function processDefectLog(log: DefectLog): Promise<void> {
  try {
    logger.log(`Processing defect log ${log.id}...`)

    // Check if this log already exists in Firebase
    const existingLogsQuery = query(
      collection(db, "defect_logs"),
      where("timestamp", "==", log.timestamp),
      where("machine_id", "==", typeof log.machine_id === "string" ? log.machine_id : "unknown"),
      where("batch_number", "==", typeof log.batch_number === "string" ? log.batch_number : ""),
    )

    const existingLogs = await getDocs(existingLogsQuery)

    if (!existingLogs.empty) {
      logger.log(`Defect log ${log.id} already exists in Firebase, skipping upload`)
      const logId = ensureNumericId(log.id)
      await updateDefectLogSyncStatus(logId, true)
      await deleteDefectLog(logId)
      return
    }

    // Create a clean object for Firebase
    const logToSync = createCleanObject(log, ["id"])

    // Ensure required fields have proper values
    logToSync.machine_id = typeof log.machine_id === "string" ? log.machine_id : "unknown"
    logToSync.batch_number = typeof log.batch_number === "string" ? log.batch_number : ""
    logToSync.synced = true

    // Upload to Firebase
    await addDoc(collection(db, "defect_logs"), logToSync)
    logger.log(`Uploaded defect log ${log.id} to Firebase`)

    // Update status and delete from IndexedDB
    const logId = ensureNumericId(log.id)
    await updateDefectLogSyncStatus(logId, true)
    await deleteDefectLog(logId)
    logger.log(`Updated sync status and deleted defect log ${log.id}`)

    // Verify deletion
    const verifyLogs = (await getUnsyncedDefectLogs()) as unknown as DefectLog[]
    const stillExists = verifyLogs.some((l) => l.id === log.id)
    if (stillExists) {
      logger.warn(`Defect log ${log.id} still exists in IndexedDB after deletion`)
    }
  } catch (error) {
    logger.error(`Error processing defect log ${log.id}:`, error)
  }
}

// ==========================================
// Image Records Sync
// ==========================================
async function syncImageRecords(): Promise<void> {
  logger.log("Syncing image records...")
  const unsyncedRecords = (await getUnsyncedImageRecords()) as unknown as ImageRecord[]
  logger.log(`Found ${unsyncedRecords.length} unsynced image records.`)

  if (unsyncedRecords.length === 0) {
    return
  }

  // Process records in batches
  for (let i = 0; i < unsyncedRecords.length; i += IMAGE_RECORD_BATCH_SIZE) {
    const batch = unsyncedRecords.slice(i, i + IMAGE_RECORD_BATCH_SIZE)
    const batchNumber = Math.floor(i / IMAGE_RECORD_BATCH_SIZE) + 1
    const totalBatches = Math.ceil(unsyncedRecords.length / IMAGE_RECORD_BATCH_SIZE)

    logger.log(`Processing image batch ${batchNumber} of ${totalBatches}`)

    // Process each record in the batch sequentially
    for (const record of batch) {
      await processImageRecord(record)
    }

    // Small delay between batches
    if (i + IMAGE_RECORD_BATCH_SIZE < unsyncedRecords.length) {
      await delay(BATCH_DELAY_MS)
    }
  }
}

/**
 * Process a single image record
 */
async function processImageRecord(record: ImageRecord): Promise<void> {
  try {
    logger.log(`Processing image record ${record.id}...`)

    // Generate a default storage path if none exists or if it's not a string
    const storagePath =
      typeof record.storage_path === "string" && record.storage_path.trim() !== ""
        ? record.storage_path
        : `images/${Date.now()}-${record.id}`

    // Check if this image record already exists in Firebase
    const existingRecordsQuery = query(
      collection(db, "image_records"),
      where("storage_path", "==", storagePath),
      where("timestamp", "==", record.timestamp),
    )

    const existingRecords = await getDocs(existingRecordsQuery)

    if (!existingRecords.empty) {
      logger.log(`Image record ${record.id} already exists in Firebase, skipping upload`)
      const recordId = ensureNumericId(record.id)
      await updateImageRecordUploadStatus(recordId, true)
      await deleteImageRecord(recordId)
      return
    }

    // Create a clean object for Firebase
    const recordToSync = createCleanObject(record, ["id", "imageData"])

    // Ensure storage_path is a valid string
    recordToSync.storage_path = storagePath
    recordToSync.uploaded = true

    // Upload to Storage
    const storageRef = ref(storage, storagePath)

    // Make sure imageData is a string before uploading
    if (typeof record.imageData === "string") {
      await uploadString(storageRef, record.imageData, "data_url")
      logger.log(`Uploaded image ${record.id} to Storage at path: ${storagePath}`)
    } else {
      throw new Error(`Image data for record ${record.id} is not a valid string`)
    }

    // Upload to Firestore
    await addDoc(collection(db, "image_records"), recordToSync)
    logger.log(`Uploaded image record ${record.id} to Firestore`)

    // Update status and delete from IndexedDB
    const recordId = ensureNumericId(record.id)
    await updateImageRecordUploadStatus(recordId, true)
    await deleteImageRecord(recordId)
    logger.log(`Updated upload status and deleted image record ${record.id}`)

    // Verify deletion
    const verifyRecords = (await getUnsyncedImageRecords()) as unknown as ImageRecord[]
    const stillExists = verifyRecords.some((r) => r.id === record.id)
    if (stillExists) {
      logger.warn(`Image record ${record.id} still exists in IndexedDB after deletion`)
    }
  } catch (error) {
    logger.error(`Error processing image record ${record.id}:`, error)
  }
}
