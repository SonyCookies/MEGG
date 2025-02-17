import { openDB } from "idb"

const DB_NAME = "EggDetectionDB"
const DB_VERSION = 6 // Increment the version number

let dbPromise

if (typeof window !== "undefined") {
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading IndexedDB from version ${oldVersion} to ${newVersion}`)

      if (!db.objectStoreNames.contains("images")) {
        const imageStore = db.createObjectStore("images", { keyPath: "id", autoIncrement: true })
        imageStore.createIndex("timestamp", "timestamp")
        imageStore.createIndex("batchNumber", "metadata.batchNumber")
        imageStore.createIndex("synced", "synced")
        console.log("Created 'images' object store with indexes")
      }

      if (!db.objectStoreNames.contains("detectionData")) {
        const detectionDataStore = db.createObjectStore("detectionData", { keyPath: "id", autoIncrement: true })
        detectionDataStore.createIndex("timestamp", "timestamp")
        detectionDataStore.createIndex("synced", "synced")
        detectionDataStore.createIndex("batchNumber", "batch_number")
        console.log("Created 'detectionData' object store with indexes")
      }

      // Ensure all indexes exist for both stores
      const ensureIndex = (store, indexName, keyPath) => {
        if (!store.indexNames.contains(indexName)) {
          store.createIndex(indexName, keyPath)
          console.log(`Created index '${indexName}' for store '${store.name}'`)
        }
      }

      const imageStore = transaction.objectStore("images")
      ensureIndex(imageStore, "timestamp", "timestamp")
      ensureIndex(imageStore, "batchNumber", "metadata.batchNumber")
      ensureIndex(imageStore, "synced", "synced")

      const detectionDataStore = transaction.objectStore("detectionData")
      ensureIndex(detectionDataStore, "timestamp", "timestamp")
      ensureIndex(detectionDataStore, "synced", "synced")
      ensureIndex(detectionDataStore, "batchNumber", "batch_number")

      // Ensure 'synced' field is always a number (0 or 1)
      detectionDataStore.openCursor().then(function cursorIterate(cursor) {
        if (!cursor) return
        const value = cursor.value
        if (typeof value.synced !== "number") {
          value.synced = value.synced ? 1 : 0 // Convert to number
          cursor.update(value)
          console.log(`Updated 'synced' field for detection data with ID ${value.id}`)
        }
        return cursor.continue().then(cursorIterate)
      })

      imageStore.openCursor().then(function cursorIterate(cursor) {
        if (!cursor) return
        const value = cursor.value
        if (typeof value.synced !== "number") {
          value.synced = value.synced ? 1 : 0 // Convert to number
          cursor.update(value)
          console.log(`Updated 'synced' field for image with ID ${value.id}`)
        }
        return cursor.continue().then(cursorIterate)
      })
    },
  })
}

export async function addImage(imageBlob, metadata) {
  if (!dbPromise) return
  const db = await dbPromise
  const tx = db.transaction("images", "readwrite")
  const id = await tx.store.add({
    blob: imageBlob,
    metadata: metadata,
    timestamp: Date.now(),
    synced: 0, // Ensure we're setting synced to 0 (false) when adding
  })
  await tx.done
  console.log(`Added image with ID ${id} to IndexedDB`)
  return id
}

export async function addDetectionData(data) {
  if (!dbPromise) return
  const db = await dbPromise
  const tx = db.transaction("detectionData", "readwrite")
  const id = await tx.store.add({
    ...data,
    timestamp: Date.now(),
    synced: 0, // Ensure we're setting synced to 0 (false) when adding
  })
  await tx.done
  console.log(`Added detection data with ID ${id} to IndexedDB`)
  return id
}

export async function getUnsynced() {
  if (!dbPromise) return { images: [], detectionData: [] }
  const db = await dbPromise
  const tx = db.transaction(["images", "detectionData"], "readonly")
  const images = await tx.objectStore("images").index("synced").getAll(IDBKeyRange.only(0))
  const detectionData = await tx.objectStore("detectionData").index("synced").getAll(IDBKeyRange.only(0))
  await tx.done
  console.log(`Found ${images.length} unsynced images and ${detectionData.length} unsynced detection records`)
  return { images, detectionData }
}

export async function markAsSynced(type, id) {
  if (!dbPromise) return
  const db = await dbPromise
  const tx = db.transaction(type, "readwrite")
  const item = await tx.store.get(id)
  if (item) {
    item.synced = 1 // Use number instead of boolean
    await tx.store.put(item)
    console.log(`Marked ${type} with ID ${id} as synced`)
  } else {
    console.error(`Failed to mark as synced: ${type} with ID ${id} not found`)
  }
  await tx.done
}

export async function clearDatabase() {
  if (!dbPromise) return
  const db = await dbPromise
  const tx = db.transaction(["images", "detectionData"], "readwrite")
  await tx.objectStore("images").clear()
  await tx.objectStore("detectionData").clear()
  await tx.done
  console.log("IndexedDB cleared successfully")
}

