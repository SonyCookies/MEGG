import { collection, getDocs } from "firebase/firestore"
import { db } from "../../config/firebaseConfig"

// Replace the getDateRange function with this updated version
const getDateRange = (filter) => {
  const now = new Date()
  const end = now
  let start

  switch (filter) {
    case "24h":
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case "7d":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case "30d":
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case "90d":
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    default:
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

// Replace the getDefectLogs function with this updated version
export const getDefectLogs = async (timeFilter = "24h") => {
  try {
    const { start, end } = getDateRange(timeFilter)

    // Get all documents from the defect_logs collection
    const querySnapshot = await getDocs(collection(db, "defect_logs"))
    const logs = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // Parse the timestamp string to a Date object
      const timestamp = data.timestamp ? new Date(data.timestamp) : new Date()

      // Only include logs within the time range
      if (timestamp >= new Date(start) && timestamp <= new Date(end)) {
        logs.push({
          id: doc.id,
          ...data,
          timestamp: timestamp,
        })
      }
    })

    return logs
  } catch (error) {
    console.error("Error fetching defect logs:", error)
    return []
  }
}

// Update the calculateStatistics function
export const calculateStatistics = async (timeFilter = "24h") => {
  try {
    const logs = await getDefectLogs(timeFilter)
    console.log("Fetched logs:", logs.length, logs) // Debug log

    // Total inspections
    const totalInspections = logs.length

    // Count defect types
    const defectCounts = logs.reduce((acc, log) => {
      const defectType = log.defect_type || "unknown"
      acc[defectType] = (acc[defectType] || 0) + 1
      return acc
    }, {})

    console.log("Defect counts:", defectCounts) // Debug log

    // Calculate percentages
    const defectPercentages = {}
    Object.keys(defectCounts).forEach((type) => {
      defectPercentages[type] = totalInspections > 0 ? ((defectCounts[type] / totalInspections) * 100).toFixed(1) : 0
    })

    // Find most common defect
    let mostCommonDefect = { type: "none", count: 0 }
    Object.keys(defectCounts).forEach((type) => {
      if (type !== "good" && defectCounts[type] > mostCommonDefect.count) {
        mostCommonDefect = { type, count: defectCounts[type] }
      }
    })

    // If no defects other than "good" are found, use the most frequent type
    if (mostCommonDefect.type === "none" && Object.keys(defectCounts).length > 0) {
      Object.keys(defectCounts).forEach((type) => {
        if (defectCounts[type] > mostCommonDefect.count) {
          mostCommonDefect = { type, count: defectCounts[type] }
        }
      })
    }

    // Calculate inspection rate (per hour)
    let inspectionRate = 0
    if (logs.length > 0) {
      const { start, end } = getDateRange(timeFilter)
      const hoursDiff = (new Date(end) - new Date(start)) / (1000 * 60 * 60)
      inspectionRate = hoursDiff > 0 ? Math.round(totalInspections / hoursDiff) : 0
    }

    // Calculate trend (compared to previous period)
    const previousPeriod = await getPreviousPeriodData(timeFilter)
    const inspectionTrend =
      previousPeriod.totalInspections > 0
        ? ((totalInspections - previousPeriod.totalInspections) / previousPeriod.totalInspections) * 100
        : totalInspections > 0
          ? 100
          : 0

    return {
      totalInspections,
      defectCounts,
      defectPercentages,
      mostCommonDefect: mostCommonDefect.type !== "none" ? mostCommonDefect : null,
      inspectionRate,
      inspectionTrend: inspectionTrend.toFixed(1),
      lastUpdated: new Date().toLocaleTimeString(),
    }
  } catch (error) {
    console.error("Error calculating statistics:", error)
    return {
      totalInspections: 0,
      defectCounts: {},
      defectPercentages: {},
      mostCommonDefect: null,
      inspectionRate: 0,
      inspectionTrend: 0,
      lastUpdated: new Date().toLocaleTimeString(),
    }
  }
}

// Update the getPreviousPeriodData function
const getPreviousPeriodData = async (timeFilter) => {
  try {
    const { start, end } = getDateRange(timeFilter)
    const periodDuration = new Date(end) - new Date(start)

    const previousStart = new Date(new Date(start).getTime() - periodDuration)
    const previousEnd = new Date(new Date(end).getTime() - periodDuration)

    // Get all documents from the defect_logs collection
    const querySnapshot = await getDocs(collection(db, "defect_logs"))
    let totalInspections = 0

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const timestamp = data.timestamp ? new Date(data.timestamp) : new Date()

      // Only count logs within the previous time range
      if (timestamp >= previousStart && timestamp <= previousEnd) {
        totalInspections++
      }
    })

    return { totalInspections }
  } catch (error) {
    console.error("Error fetching previous period data:", error)
    return { totalInspections: 0 }
  }
}

