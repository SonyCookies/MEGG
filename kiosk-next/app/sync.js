import { db, storage } from "./firebaseConfig"
import { collection, addDoc } from "firebase/firestore"
import { ref, uploadString } from "firebase/storage"
import {
  getUnsyncedDefectLogs,
  getUnsyncedImageRecords,
  updateDefectLogSyncStatus,
  updateImageRecordUploadStatus,
  deleteDefectLog,
  deleteImageRecord,
} from "./indexedDB"

export async function syncData() {
  console.log("Starting data sync...")
  await syncDefectLogs()
  await syncImageRecords()
  console.log("Data sync completed.")
}

async function syncDefectLogs() {
  console.log("Syncing defect logs...")
  const unsyncedLogs = await getUnsyncedDefectLogs()
  console.log(`Found ${unsyncedLogs.length} unsynced defect logs.`)

  for (const log of unsyncedLogs) {
    try {
      console.log(`Processing defect log ${log.id}...`)

      const logToSync = { ...log }
      delete logToSync.id // Remove IndexedDB id before sending to Firebase
      logToSync.synced = true // Convert to boolean for Firebase

      // Upload to Firebase
      await addDoc(collection(db, "defect_logs"), logToSync)
      console.log(`Uploaded defect log ${log.id} to Firebase`)

      // Update sync status
      await updateDefectLogSyncStatus(log.id, true)
      console.log(`Updated sync status for defect log ${log.id}`)

      // Delete from IndexedDB
      try {
        await deleteDefectLog(log.id)
        console.log(`Successfully deleted defect log ${log.id} from IndexedDB`)
      } catch (deleteError) {
        console.error(`Failed to delete defect log ${log.id} from IndexedDB:`, deleteError)
        // Try to delete again after a short delay
        setTimeout(async () => {
          try {
            await deleteDefectLog(log.id)
            console.log(`Retry successful: deleted defect log ${log.id} from IndexedDB`)
          } catch (retryError) {
            console.error(`Retry failed: could not delete defect log ${log.id}:`, retryError)
          }
        }, 100)
      }
    } catch (error) {
      console.error(`Error processing defect log ${log.id}:`, error)
    }
  }
}

async function syncImageRecords() {
  console.log("Syncing image records...")
  const unsyncedRecords = await getUnsyncedImageRecords()
  console.log(`Found ${unsyncedRecords.length} unsynced image records.`)

  for (const record of unsyncedRecords) {
    try {
      console.log(`Processing image record ${record.id}...`)

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

      // Update upload status
      await updateImageRecordUploadStatus(record.id, true)
      console.log(`Updated upload status for image record ${record.id}`)

      // Delete from IndexedDB
      try {
        await deleteImageRecord(record.id)
        console.log(`Successfully deleted image record ${record.id} from IndexedDB`)
      } catch (deleteError) {
        console.error(`Failed to delete image record ${record.id} from IndexedDB:`, deleteError)
        // Try to delete again after a short delay
        setTimeout(async () => {
          try {
            await deleteImageRecord(record.id)
            console.log(`Retry successful: deleted image record ${record.id} from IndexedDB`)
          } catch (retryError) {
            console.error(`Retry failed: could not delete image record ${record.id}:`, retryError)
          }
        }, 100)
      }
    } catch (error) {
      console.error(`Error processing image record ${record.id}:`, error)
    }
  }
}

