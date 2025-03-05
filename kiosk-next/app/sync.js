// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\sync.js

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
} from "./indexedDB"

// Global sync lock
let isSyncing = false

export async function syncData() {
  if (isSyncing) {
    console.log("Sync already in progress, skipping")
    return
  }

  try {
    isSyncing = true
    console.log("Starting data sync...")

    // First sync defect logs
    await syncDefectLogs()

    // Verify defect logs are synced before proceeding
    const defectVerification = await verifyNoUnsyncedRecords()
    if (defectVerification.defectLogsCount > 0) {
      console.warn(`Warning: Still found ${defectVerification.defectLogsCount} unsynced defect logs after sync`)
    }

    // Then sync image records
    await syncImageRecords()

    // Final verification
    const finalVerification = await verifyNoUnsyncedRecords()
    if (!finalVerification.allSynced) {
      console.warn(
        `Warning: After sync completion, found ${finalVerification.defectLogsCount} unsynced defect logs and ${finalVerification.imageRecordsCount} unsynced image records`,
      )
    } else {
      console.log("Sync verification successful: All records synced")
    }

    console.log("Data sync completed.")
  } catch (error) {
    console.error("Error during sync:", error)
  } finally {
    isSyncing = false
  }
}

async function syncDefectLogs() {
  console.log("Syncing defect logs...")
  const unsyncedLogs = await getUnsyncedDefectLogs()
  console.log(`Found ${unsyncedLogs.length} unsynced defect logs.`)

  if (unsyncedLogs.length === 0) {
    return
  }

  // Process logs in batches to avoid overwhelming Firebase
  const batchSize = 5
  for (let i = 0; i < unsyncedLogs.length; i += batchSize) {
    const batch = unsyncedLogs.slice(i, i + batchSize)
    console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(unsyncedLogs.length / batchSize)}`)

    // Process each log in the batch sequentially
    for (const log of batch) {
      try {
        console.log(`Processing defect log ${log.id}...`)

        // Check if this log already exists in Firebase
        const existingLogsQuery = query(
          collection(db, "defect_logs"),
          where("timestamp", "==", log.timestamp),
          where("machine_id", "==", log.machine_id || "unknown"), // Handle missing machine_id
          where("batch_number", "==", log.batch_number),
        )

        const existingLogs = await getDocs(existingLogsQuery)

        if (!existingLogs.empty) {
          console.log(`Defect log ${log.id} already exists in Firebase, skipping upload`)
          // Mark as synced and delete from IndexedDB
          await updateDefectLogSyncStatus(log.id, true)
          await deleteDefectLog(log.id)
          continue
        }

        const logToSync = { ...log }
        delete logToSync.id // Remove IndexedDB id before sending to Firebase
        logToSync.synced = true // Convert to boolean for Firebase

        // Upload to Firebase
        await addDoc(collection(db, "defect_logs"), logToSync)
        console.log(`Uploaded defect log ${log.id} to Firebase`)

        // Mark as synced and delete from IndexedDB in a single transaction if possible
        await updateDefectLogSyncStatus(log.id, true)
        await deleteDefectLog(log.id)
        console.log(`Updated sync status and deleted defect log ${log.id}`)

        // Verify deletion
        const verifyLogs = await getUnsyncedDefectLogs()
        const stillExists = verifyLogs.some((l) => l.id === log.id)
        if (stillExists) {
          console.warn(`Warning: Defect log ${log.id} still exists in IndexedDB after deletion`)
        }
      } catch (error) {
        console.error(`Error processing defect log ${log.id}:`, error)
      }
    }

    // Small delay between batches to allow IndexedDB to settle
    if (i + batchSize < unsyncedLogs.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
}

async function syncImageRecords() {
  console.log("Syncing image records...")
  const unsyncedRecords = await getUnsyncedImageRecords()
  console.log(`Found ${unsyncedRecords.length} unsynced image records.`)

  if (unsyncedRecords.length === 0) {
    return
  }

  // Process records in batches
  const batchSize = 3
  for (let i = 0; i < unsyncedRecords.length; i += batchSize) {
    const batch = unsyncedRecords.slice(i, i + batchSize)
    console.log(`Processing image batch ${i / batchSize + 1} of ${Math.ceil(unsyncedRecords.length / batchSize)}`)

    // Process each record in the batch sequentially
    for (const record of batch) {
      try {
        console.log(`Processing image record ${record.id}...`)

        // Check if this image record already exists in Firebase
        const existingRecordsQuery = query(
          collection(db, "image_records"),
          where("storage_path", "==", record.storage_path),
          where("timestamp", "==", record.timestamp),
        )

        const existingRecords = await getDocs(existingRecordsQuery)

        if (!existingRecords.empty) {
          console.log(`Image record ${record.id} already exists in Firebase, skipping upload`)
          // Mark as uploaded and delete from IndexedDB
          await updateImageRecordUploadStatus(record.id, true)
          await deleteImageRecord(record.id)
          continue
        }

        const recordToSync = { ...record }
        delete recordToSync.id // Remove IndexedDB id before sending to Firebase
        recordToSync.uploaded = true // Convert to boolean for Firebase

        // Upload to Storage
        const storageRef = ref(storage, record.storage_path)
        await uploadString(storageRef, record.imageData, "data_url")
        console.log(`Uploaded image ${record.id} to Storage`)

        // Upload to Firestore
        delete recordToSync.imageData
        await addDoc(collection(db, "image_records"), recordToSync)
        console.log(`Uploaded image record ${record.id} to Firestore`)

        // Mark as uploaded and delete from IndexedDB
        await updateImageRecordUploadStatus(record.id, true)
        await deleteImageRecord(record.id)
        console.log(`Updated upload status and deleted image record ${record.id}`)

        // Verify deletion
        const verifyRecords = await getUnsyncedImageRecords()
        const stillExists = verifyRecords.some((r) => r.id === record.id)
        if (stillExists) {
          console.warn(`Warning: Image record ${record.id} still exists in IndexedDB after deletion`)
        }
      } catch (error) {
        console.error(`Error processing image record ${record.id}:`, error)
      }
    }

    // Small delay between batches
    if (i + batchSize < unsyncedRecords.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
}

