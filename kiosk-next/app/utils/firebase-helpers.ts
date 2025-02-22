// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\utils\firebase-helpers.ts

import { storage, db } from "../firebaseConfig"
import { ref, uploadBytes } from "firebase/storage"
import { collection, addDoc, doc, serverTimestamp, increment, setDoc, updateDoc } from "firebase/firestore"
import { addImage, addDetectionData, getUnsynced, markAsSynced, clearDatabase } from "./indexedDB"

// Save image to Firebase Storage
export async function saveImageToStorage(imageBlob: Blob, batchNumber: string): Promise<string> {
  const timestamp = Date.now()
  const storageRef = ref(storage, `images/${batchNumber}/${timestamp}.jpg`)
  await uploadBytes(storageRef, imageBlob)
  return storageRef.fullPath
}

// Save defect detection record
export async function saveDefectLog(data: {
  batchNumber: string
  confidence: number
  defectType: string
  deviceId: string
  imageBlob?: Blob
}) {
  const timestamp = serverTimestamp()
  const isOnline = navigator.onLine

  if (isOnline) {
    let imageId = null
    if (data.imageBlob) {
      const storagePath = await saveImageToStorage(data.imageBlob, data.batchNumber)
      const imageRecord = await addDoc(collection(db, "image_records"), {
        batch_number: data.batchNumber,
        timestamp,
        storage_path: storagePath,
        uploaded: true,
      })
      imageId = imageRecord.id
    }

    await addDoc(collection(db, "detection_logs"), {
      batch_number: data.batchNumber,
      timestamp,
      confidence_score: data.confidence,
      defect_type: data.defectType,
      image_id: imageId,
      synced: true,
      device_id: data.deviceId,
    })

    // Update daily_defect_summary
    const today = new Date().toISOString().split("T")[0]
    const dailyRef = doc(db, "daily_defect_summary", today)
    await setDoc(
      dailyRef,
      {
        total_eggs: increment(1),
        [`defect_counts.${data.defectType}`]: increment(1),
        batch_summary: increment(1),
      },
      { merge: true },
    )

    // Update batch_reviews
    const batchRef = doc(db, "batch_reviews", data.batchNumber)
    await setDoc(
      batchRef,
      {
        processed_count: increment(1),
        [`defect_counts.${data.defectType}`]: increment(1),
        timestamp,
        synced: true,
      },
      { merge: true },
    )
  } else {
    // Store in IndexedDB when offline
    if (data.imageBlob) {
      await addImage(data.imageBlob, { batchNumber: data.batchNumber })
    }
    await addDetectionData({
      batch_number: data.batchNumber,
      timestamp: Date.now(),
      confidence_score: data.confidence,
      defect_type: data.defectType,
      device_id: data.deviceId,
      synced: false,
    })
  }
}

export async function syncOfflineData() {
  if (typeof window === "undefined") return

  console.log("Starting offline data sync...")
  try {
    const { images, detectionData } = await getUnsynced()
    console.log(`Found ${images.length} unsynced images and ${detectionData.length} unsynced detection records`)

    let syncedImages = 0
    let syncedDetectionData = 0

    for (const image of images) {
      try {
        console.log(`Uploading image for batch ${image.metadata.batchNumber}...`)
        const storagePath = await saveImageToStorage(image.blob, image.metadata.batchNumber)

        const imageRecord = await addDoc(collection(db, "image_records"), {
          batch_number: image.metadata.batchNumber,
          timestamp: image.timestamp,
          storage_path: storagePath,
          uploaded: true,
        })

        await markAsSynced("images", image.id)
        console.log(`Image uploaded successfully: ${storagePath}`)
        syncedImages++

        // Update related detection data with image_id
        const relatedData = detectionData.find((d) => d.timestamp === image.timestamp)
        if (relatedData) {
          relatedData.image_id = imageRecord.id
        }
      } catch (error) {
        console.error("Failed to sync image:", error)
      }
    }

    for (const data of detectionData) {
      try {
        console.log(`Syncing detection data for batch ${data.batch_number}...`)
        await addDoc(collection(db, "detection_logs"), {
          ...data,
          synced: true,
        })
        await markAsSynced("detectionData", data.id)
        console.log(`Detection data synced successfully for batch ${data.batch_number}`)
        syncedDetectionData++

        // Update daily_defect_summary and batch_reviews
        const today = new Date(data.timestamp).toISOString().split("T")[0]
        const dailyRef = doc(db, "daily_defect_summary", today)
        const batchRef = doc(db, "batch_reviews", data.batch_number)

        await updateDoc(dailyRef, {
          total_eggs: increment(1),
          [`defect_counts.${data.defect_type}`]: increment(1),
          batch_summary: increment(1),
        })

        await updateDoc(batchRef, {
          processed_count: increment(1),
          [`defect_counts.${data.defect_type}`]: increment(1),
          timestamp: data.timestamp,
          synced: true,
        })
      } catch (error) {
        console.error("Failed to sync detection data:", error)
      }
    }

    console.log(
      `Offline data sync completed. Synced ${syncedImages}/${images.length} images and ${syncedDetectionData}/${detectionData.length} detection records.`,
    )

    if (syncedImages === images.length && syncedDetectionData === detectionData.length) {
      await clearDatabase()
      console.log("All data synced successfully. IndexedDB cleared.")
    } else {
      console.log("Some items could not be synced. IndexedDB was not cleared.")
    }
  } catch (error) {
    console.error("Error during offline data sync:", error)
    // Don't throw the error, just log it
  }
}

// Add a function to check internet connection
export function checkInternetConnection() {
  return typeof window !== "undefined" ? window.navigator.onLine : false
}

// Initialize all necessary documents for a new batch
export async function initializeBatch(batchNumber: string) {
  const timestamp = serverTimestamp()
  const today = new Date().toISOString().split("T")[0]

  try {
    // Initialize batch_reviews
    await setDoc(
      doc(db, "batch_reviews", batchNumber),
      {
        batch_number: batchNumber,
        processed_count: 0,
        defect_counts: {},
        timestamp,
        synced: true,
      },
      { merge: true },
    )

    // Initialize daily_defect_summary if not exists
    await setDoc(
      doc(db, "daily_defect_summary", today),
      {
        date: today,
        total_eggs: 0,
        defect_counts: {},
        batch_summary: [],
      },
      { merge: true },
    )

    return true
  } catch (error) {
    console.error("Error initializing batch:", error)
    return false
  }
}

