import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  onSnapshot,
} from "firebase/firestore"
import { db } from "../../config/firebaseConfig"

// Format date for display
const formatDate = (timestamp) => {
  if (!timestamp) return ""

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)

  // Format date as MM/DD/YYYY
  const shortDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`

  // Format time as HH:MM:SS AM/PM
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  const ampm = hours >= 12 ? "PM" : "AM"
  const formattedHours = hours % 12 || 12
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds
  const time = `${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`

  // Format full date for display
  const fullDate = `${new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date)} ${time}`

  return {
    shortDate,
    time,
    fullDate,
  }
}

// Get all batches with pagination
export const getBatches = async (pageSize = 6, lastVisible = null) => {
  try {
    let batchesQuery

    if (lastVisible) {
      batchesQuery = query(
        collection(db, "batches"),
        orderBy("created_at", "desc"),
        startAfter(lastVisible),
        limit(pageSize),
      )
    } else {
      batchesQuery = query(collection(db, "batches"), orderBy("created_at", "desc"), limit(pageSize))
    }

    const batchesSnapshot = await getDocs(batchesQuery)
    const lastVisibleDoc = batchesSnapshot.docs[batchesSnapshot.docs.length - 1]

    const batches = batchesSnapshot.docs.map((doc) => {
      const data = doc.data()
      const created = formatDate(data.created_at)
      const updated = formatDate(data.updated_at)

      // Calculate the primary defect type
      const defectCounts = data.defect_counts || {}
      let primaryDefectType = "None"
      let maxCount = 0

      Object.entries(defectCounts).forEach(([type, count]) => {
        if (type !== "good" && count > maxCount) {
          maxCount = count
          primaryDefectType = type.charAt(0).toUpperCase() + type.slice(1)
        }
      })

      // Calculate confidence (mock calculation - adjust as needed)
      const totalDefects = Object.values(defectCounts).reduce((sum, count) => sum + count, 0)
      const confidence = totalDefects > 0 ? Math.round((maxCount / totalDefects) * 100 * 10) / 10 : 0

      return {
        id: doc.id,
        batchNumber: data.batch_number,
        timestamp: created.shortDate,
        time: created.time,
        defectType: primaryDefectType,
        confidence: confidence,
        totalDefects: data.total_count || 0,
        uniqueDefectTypes: Object.keys(defectCounts).filter((key) => key !== "good" && defectCounts[key] > 0).length,
        timeRange: `${created.time} - ${updated.time}`,
        fromDate: created.fullDate,
        toDate: updated.fullDate,
        machineId: data.machine_id,
        status: data.status,
        defectCounts: data.defect_counts,
        rawData: data,
      }
    })

    return { batches, lastVisibleDoc }
  } catch (error) {
    console.error("Error getting batches:", error)
    return { batches: [], lastVisibleDoc: null }
  }
}

// Get total number of batches (for pagination)
export const getTotalBatchesCount = async () => {
  try {
    const batchesSnapshot = await getDocs(collection(db, "batches"))
    return batchesSnapshot.size
  } catch (error) {
    console.error("Error getting total batches count:", error)
    return 0
  }
}

// Get a single batch by ID
export const getBatchById = async (batchId) => {
  try {
    const batchDoc = await getDoc(doc(db, "batches", batchId))

    if (!batchDoc.exists()) {
      return null
    }

    const data = batchDoc.data()
    const created = formatDate(data.created_at)
    const updated = formatDate(data.updated_at)

    return {
      id: batchDoc.id,
      batchNumber: data.batch_number,
      timestamp: created.shortDate,
      time: created.time,
      defectCounts: data.defect_counts,
      totalDefects: data.total_count || 0,
      uniqueDefectTypes: Object.keys(data.defect_counts || {}).filter(
        (key) => key !== "good" && data.defect_counts[key] > 0,
      ).length,
      timeRange: `${created.time} - ${updated.time}`,
      fromDate: created.fullDate,
      toDate: updated.fullDate,
      machineId: data.machine_id,
      status: data.status,
      rawData: data,
    }
  } catch (error) {
    console.error("Error getting batch:", error)
    return null
  }
}

// Get a single batch by batch number
export const getBatchByNumber = async (batchNumber) => {
  try {
    const batchesQuery = query(collection(db, "batches"), where("batch_number", "==", batchNumber), limit(1))

    const batchesSnapshot = await getDocs(batchesQuery)

    if (batchesSnapshot.empty) {
      return null
    }

    const batchDoc = batchesSnapshot.docs[0]
    const data = batchDoc.data()
    const created = formatDate(data.created_at)
    const updated = formatDate(data.updated_at)

    // Calculate the primary defect type
    const defectCounts = data.defect_counts || {}
    let primaryDefectType = "None"
    let maxCount = 0

    Object.entries(defectCounts).forEach(([type, count]) => {
      if (type !== "good" && count > maxCount) {
        maxCount = count
        primaryDefectType = type.charAt(0).toUpperCase() + type.slice(1)
      }
    })

    // Calculate confidence (mock calculation - adjust as needed)
    const totalDefects = Object.values(defectCounts).reduce((sum, count) => sum + count, 0)
    const confidence = totalDefects > 0 ? Math.round((maxCount / totalDefects) * 100 * 10) / 10 : 0

    return {
      id: batchDoc.id,
      batchNumber: data.batch_number,
      timestamp: created.shortDate,
      time: created.time,
      defectType: primaryDefectType,
      confidence: confidence,
      totalDefects: data.total_count || 0,
      uniqueDefectTypes: Object.keys(defectCounts).filter((key) => key !== "good" && defectCounts[key] > 0).length,
      timeRange: `${created.time} - ${updated.time}`,
      fromDate: created.fullDate,
      toDate: updated.fullDate,
      machineId: data.machine_id,
      status: data.status,
      defectCounts: data.defect_counts,
      rawData: data,
    }
  } catch (error) {
    console.error("Error getting batch by number:", error)
    return null
  }
}

// Set up real-time listener for batches
export const subscribeToBatches = (pageSize = 6, callback) => {
  try {
    const batchesQuery = query(collection(db, "batches"), orderBy("created_at", "desc"), limit(pageSize))

    return onSnapshot(batchesQuery, (snapshot) => {
      const batches = snapshot.docs.map((doc) => {
        const data = doc.data()
        const created = formatDate(data.created_at)
        const updated = formatDate(data.updated_at)

        // Calculate the primary defect type
        const defectCounts = data.defect_counts || {}
        let primaryDefectType = "None"
        let maxCount = 0

        Object.entries(defectCounts).forEach(([type, count]) => {
          if (type !== "good" && count > maxCount) {
            maxCount = count
            primaryDefectType = type.charAt(0).toUpperCase() + type.slice(1)
          }
        })

        // Calculate confidence (mock calculation - adjust as needed)
        const totalDefects = Object.values(defectCounts).reduce((sum, count) => sum + count, 0)
        const confidence = totalDefects > 0 ? Math.round((maxCount / totalDefects) * 100 * 10) / 10 : 0

        return {
          id: doc.id,
          batchNumber: data.batch_number,
          timestamp: created.shortDate,
          time: created.time,
          defectType: primaryDefectType,
          confidence: confidence,
          totalDefects: data.total_count || 0,
          uniqueDefectTypes: Object.keys(defectCounts).filter((key) => key !== "good" && defectCounts[key] > 0).length,
          timeRange: `${created.time} - ${updated.time}`,
          fromDate: created.fullDate,
          toDate: updated.fullDate,
          machineId: data.machine_id,
          status: data.status,
          defectCounts: data.defect_counts,
          rawData: data,
        }
      })

      callback(batches)
    })
  } catch (error) {
    console.error("Error setting up batches subscription:", error)
    return () => {} // Return empty unsubscribe function
  }
}

// Get overview data for all batches
export const getBatchesOverview = async () => {
  try {
    const batchesSnapshot = await getDocs(collection(db, "batches"))

    let totalDefects = 0
    const defectTypes = new Set()
    let earliestTime = null
    let latestTime = null

    batchesSnapshot.docs.forEach((doc) => {
      const data = doc.data()

      // Count total defects
      totalDefects += data.total_count || 0

      // Count unique defect types
      const defectCounts = data.defect_counts || {}
      Object.entries(defectCounts).forEach(([type, count]) => {
        if (type !== "good" && count > 0) {
          defectTypes.add(type)
        }
      })

      // Track time range
      const createdAt = data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at)

      if (!earliestTime || createdAt < earliestTime) {
        earliestTime = createdAt
      }

      if (!latestTime || createdAt > latestTime) {
        latestTime = createdAt
      }
    })

    // Format time range
    let timeRange = "N/A"
    if (earliestTime && latestTime) {
      const formatTime = (date) => {
        const hours = date.getHours()
        const minutes = date.getMinutes()
        const seconds = date.getSeconds()
        const ampm = hours >= 12 ? "PM" : "AM"
        const formattedHours = hours % 12 || 12
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
        const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds
        return `${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`
      }

      timeRange = `${formatTime(earliestTime)} - ${formatTime(latestTime)}`
    }

    return {
      totalDefects,
      uniqueDefectTypes: defectTypes.size,
      timeRange,
    }
  } catch (error) {
    console.error("Error getting batches overview:", error)
    return {
      totalDefects: 0,
      uniqueDefectTypes: 0,
      timeRange: "N/A",
    }
  }
}

