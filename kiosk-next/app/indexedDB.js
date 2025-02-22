import { openDB } from "idb"

const DB_NAME = "EggDefectDB"
const DB_VERSION = 1
const DEFECT_LOGS_STORE = "defectLogs"
const IMAGE_RECORDS_STORE = "imageRecords"

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(DEFECT_LOGS_STORE)) {
        const defectLogsStore = db.createObjectStore(DEFECT_LOGS_STORE, { keyPath: "id", autoIncrement: true })
        defectLogsStore.createIndex("synced", "synced", { unique: false })
      }
      if (!db.objectStoreNames.contains(IMAGE_RECORDS_STORE)) {
        const imageRecordsStore = db.createObjectStore(IMAGE_RECORDS_STORE, { keyPath: "id", autoIncrement: true })
        imageRecordsStore.createIndex("uploaded", "uploaded", { unique: false })
      }
    },
  })
}

export async function addDefectLog(defectLog) {
  const db = await initDB()
  defectLog.synced = defectLog.synced ? 1 : 0 // Ensure a valid key
  return db.add(DEFECT_LOGS_STORE, defectLog)
}

export async function addImageRecord(imageRecord) {
  const db = await initDB()
  imageRecord.uploaded = imageRecord.uploaded ? 1 : 0 // Ensure a valid key
  return db.add(IMAGE_RECORDS_STORE, imageRecord)
}

export async function getUnsyncedDefectLogs() {
  const db = await initDB()
  return db.getAllFromIndex(DEFECT_LOGS_STORE, "synced", 0)
}

export async function getUnsyncedImageRecords() {
  const db = await initDB()
  return db.getAllFromIndex(IMAGE_RECORDS_STORE, "uploaded", 0)
}

export async function updateDefectLogSyncStatus(id, synced) {
  const db = await initDB()
  const tx = db.transaction(DEFECT_LOGS_STORE, "readwrite")
  const store = tx.objectStore(DEFECT_LOGS_STORE)
  const item = await store.get(id)
  if (item) {
    item.synced = synced ? 1 : 0 // Store as 1 or 0
    await store.put(item)
  }
  await tx.done
}

export async function updateImageRecordUploadStatus(id, uploaded) {
  const db = await initDB()
  const tx = db.transaction(IMAGE_RECORDS_STORE, "readwrite")
  const store = tx.objectStore(IMAGE_RECORDS_STORE)
  const item = await store.get(id)
  if (item) {
    item.uploaded = uploaded ? 1 : 0 // Store as 1 or 0
    await store.put(item)
  }
  await tx.done
}

export async function deleteDefectLog(id) {
  console.log(`Attempting to delete defect log ${id} from IndexedDB...`)
  const db = await initDB()
  try {
    await db.delete(DEFECT_LOGS_STORE, id)
    console.log(`Successfully deleted defect log ${id} from IndexedDB`)
    return true
  } catch (error) {
    console.error(`Error deleting defect log ${id} from IndexedDB:`, error)
    throw error
  }
}

export async function deleteImageRecord(id) {
  console.log(`Attempting to delete image record ${id} from IndexedDB...`)
  const db = await initDB()
  try {
    await db.delete(IMAGE_RECORDS_STORE, id)
    console.log(`Successfully deleted image record ${id} from IndexedDB`)
    return true
  } catch (error) {
    console.error(`Error deleting image record ${id} from IndexedDB:`, error)
    throw error
  }
}

export async function clearSyncedRecords() {
  const db = await initDB()

  // Clear synced defect logs
  const defectTx = db.transaction(DEFECT_LOGS_STORE, "readwrite")
  const defectStore = defectTx.objectStore(DEFECT_LOGS_STORE)
  const syncedLogs = await defectStore.index("synced").getAllKeys(1) // Use 1 instead of true
  await Promise.all(syncedLogs.map((id) => defectStore.delete(id)))
  await defectTx.done

  // Clear uploaded image records
  const imageTx = db.transaction(IMAGE_RECORDS_STORE, "readwrite")
  const imageStore = imageTx.objectStore(IMAGE_RECORDS_STORE)
  const uploadedRecords = await imageStore.index("uploaded").getAllKeys(1) // Use 1 instead of true
  await Promise.all(uploadedRecords.map((id) => imageStore.delete(id)))
  await imageTx.done
}

