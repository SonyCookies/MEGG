// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\indexedDB.tsx

import { openDB, type IDBPDatabase, type DBSchema } from "idb"

// Strongly typed DBSchema
interface EggDefectDB extends DBSchema {
  defectLogs: {
    key: number
    value: {
      id?: number
      synced: number
      timestamp: number
      imageUrl: string
      defectType: string
      [key: string]: unknown
    }
    indexes: { synced: number }
  }
  imageRecords: {
    key: number
    value: {
      id?: number
      uploaded: number
      timestamp: number
      filename: string
      imageUrl: string
      [key: string]: unknown
    }
    indexes: { uploaded: number }
  }
}

type DefectLog = EggDefectDB['defectLogs']['value']
type ImageRecord = EggDefectDB['imageRecords']['value']

const DB_NAME = "EggDefectDB"
const DB_VERSION = 1
const DEFECT_LOGS_STORE = "defectLogs"
const IMAGE_RECORDS_STORE = "imageRecords"

let dbPromise: Promise<IDBPDatabase<EggDefectDB>> | null = null

function getDB(): Promise<IDBPDatabase<EggDefectDB>> {
  if (!dbPromise) {
    dbPromise = openDB<EggDefectDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DEFECT_LOGS_STORE)) {
          const store = db.createObjectStore(DEFECT_LOGS_STORE, {
            keyPath: "id",
            autoIncrement: true,
          })
          store.createIndex("synced", "synced", { unique: false })
        }

        if (!db.objectStoreNames.contains(IMAGE_RECORDS_STORE)) {
          const store = db.createObjectStore(IMAGE_RECORDS_STORE, {
            keyPath: "id",
            autoIncrement: true,
          })
          store.createIndex("uploaded", "uploaded", { unique: false })
        }
      },
    })
  }
  return dbPromise
}

export async function addDefectLog(defectLog: DefectLog): Promise<number> {
  const db = await getDB()
  defectLog.synced = defectLog.synced ? 1 : 0
  return db.add(DEFECT_LOGS_STORE, defectLog)
}

export async function addImageRecord(imageRecord: ImageRecord): Promise<number> {
  const db = await getDB()
  imageRecord.uploaded = imageRecord.uploaded ? 1 : 0
  return db.add(IMAGE_RECORDS_STORE, imageRecord)
}

export async function getUnsyncedDefectLogs(): Promise<DefectLog[]> {
  const db = await getDB()
  const tx = db.transaction(DEFECT_LOGS_STORE, "readonly")
  const index = tx.store.index("synced")
  const logs = await index.getAll(0)
  await tx.done
  console.log(`Retrieved ${logs.length} unsynced defect logs from IndexedDB`)
  return logs
}

export async function getUnsyncedImageRecords(): Promise<ImageRecord[]> {
  const db = await getDB()
  const tx = db.transaction(IMAGE_RECORDS_STORE, "readonly")
  const index = tx.store.index("uploaded")
  const records = await index.getAll(0)
  await tx.done
  console.log(`Retrieved ${records.length} unsynced image records from IndexedDB`)
  return records
}

export async function updateDefectLogSyncStatus(id: number, synced: boolean): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(DEFECT_LOGS_STORE, "readwrite")
  const store = tx.objectStore(DEFECT_LOGS_STORE)
  const item = await store.get(id)
  if (item) {
    item.synced = synced ? 1 : 0
    await store.put(item)
  }
  await tx.done
}

export async function updateImageRecordUploadStatus(id: number, uploaded: boolean): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(IMAGE_RECORDS_STORE, "readwrite")
  const store = tx.objectStore(IMAGE_RECORDS_STORE)
  const item = await store.get(id)
  if (item) {
    item.uploaded = uploaded ? 1 : 0
    await store.put(item)
  }
  await tx.done
}

export async function deleteDefectLog(id: number): Promise<boolean> {
  console.log(`Attempting to delete defect log ${id} from IndexedDB...`)
  const db = await getDB()
  const tx = db.transaction(DEFECT_LOGS_STORE, "readwrite")
  try {
    await tx.objectStore(DEFECT_LOGS_STORE).delete(id)
    await tx.done
    console.log(`Successfully deleted defect log ${id} from IndexedDB`)
    return true
  } catch (error) {
    console.error(`Error deleting defect log ${id} from IndexedDB:`, error)
    throw error
  }
}

export async function deleteImageRecord(id: number): Promise<boolean> {
  console.log(`Attempting to delete image record ${id} from IndexedDB...`)
  const db = await getDB()
  const tx = db.transaction(IMAGE_RECORDS_STORE, "readwrite")
  try {
    await tx.objectStore(IMAGE_RECORDS_STORE).delete(id)
    await tx.done
    console.log(`Successfully deleted image record ${id} from IndexedDB`)
    return true
  } catch (error) {
    console.error(`Error deleting image record ${id} from IndexedDB:`, error)
    throw error
  }
}

export async function clearSyncedRecords(): Promise<void> {
  const db = await getDB()

  const defectTx = db.transaction(DEFECT_LOGS_STORE, "readwrite")
  const defectStore = defectTx.objectStore(DEFECT_LOGS_STORE)
  const syncedLogs = await defectStore.index("synced").getAllKeys(1)
  await Promise.all(syncedLogs.map((id) => defectStore.delete(id)))
  await defectTx.done

  const imageTx = db.transaction(IMAGE_RECORDS_STORE, "readwrite")
  const imageStore = imageTx.objectStore(IMAGE_RECORDS_STORE)
  const uploadedRecords = await imageStore.index("uploaded").getAllKeys(1)
  await Promise.all(uploadedRecords.map((id) => imageStore.delete(id)))
  await imageTx.done
}

export async function verifyNoUnsyncedRecords(): Promise<{
  defectLogsCount: number
  imageRecordsCount: number
  allSynced: boolean
}> {
  const defectLogs = await getUnsyncedDefectLogs()
  const imageRecords = await getUnsyncedImageRecords()
  return {
    defectLogsCount: defectLogs.length,
    imageRecordsCount: imageRecords.length,
    allSynced: defectLogs.length === 0 && imageRecords.length === 0,
  }
}
