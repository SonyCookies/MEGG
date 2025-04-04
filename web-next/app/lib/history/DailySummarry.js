import { collection, query, getDocs, where, orderBy, Timestamp } from "firebase/firestore"
import { db } from "../../config/firebaseConfig"

// Get defects for the current day
export async function getTodayDefects() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const startTimestamp = Timestamp.fromDate(today)
  const endTimestamp = Timestamp.fromDate(tomorrow)

  const q = query(
    collection(db, "defect_logs"),
    where("timestamp", ">=", startTimestamp),
    where("timestamp", "<", endTimestamp),
    orderBy("timestamp"),
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate(),
  }))
}

// Get defects for the previous day
export async function getPreviousDayDefects() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const startTimestamp = Timestamp.fromDate(yesterday)
  const endTimestamp = Timestamp.fromDate(today)

  const q = query(
    collection(db, "defect_logs"),
    where("timestamp", ">=", startTimestamp),
    where("timestamp", "<", endTimestamp),
    orderBy("timestamp"),
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate(),
  }))
}

// Get defects for the last 7 days
export async function getWeekDefects() {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  weekAgo.setHours(0, 0, 0, 0)

  const startTimestamp = Timestamp.fromDate(weekAgo)
  const endTimestamp = Timestamp.fromDate(today)

  const q = query(
    collection(db, "defect_logs"),
    where("timestamp", ">=", startTimestamp),
    where("timestamp", "<=", endTimestamp),
    orderBy("timestamp"),
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate(),
  }))
}

// Calculate daily average
export function calculateDailyAverage(defects) {
  if (!defects.length) return 0

  // Group defects by day
  const defectsByDay = {}
  defects.forEach((defect) => {
    const date = defect.timestamp.toDateString()
    if (!defectsByDay[date]) {
      defectsByDay[date] = []
    }
    defectsByDay[date].push(defect)
  })

  // Calculate average
  const totalDays = Object.keys(defectsByDay).length
  const totalDefects = defects.length

  return totalDefects / totalDays
}

// Find peak time
export function findPeakTime(defects) {
  if (!defects.length) return "N/A"

  // Group defects by hour
  const defectsByHour = {}
  for (let i = 0; i < 24; i++) {
    defectsByHour[i] = 0
  }

  defects.forEach((defect) => {
    const hour = defect.timestamp.getHours()
    defectsByHour[hour]++
  })

  // Find peak hour
  let peakHour = 0
  let maxDefects = 0

  for (let hour = 0; hour < 24; hour++) {
    if (defectsByHour[hour] > maxDefects) {
      maxDefects = defectsByHour[hour]
      peakHour = hour
    }
  }

  // Format peak time
  const peakHourEnd = (peakHour + 2) % 24
  const formatHour = (h) => {
    const period = h >= 12 ? "PM" : "AM"
    const hour = h % 12 || 12
    return `${hour} ${period}`
  }

  return `${formatHour(peakHour)}-${formatHour(peakHourEnd)}`
}

// Get hourly distribution for chart
export function getHourlyDistribution(defects) {
  // Initialize hours
  const hourlyData = {}
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = { hour: i, total: 0, dirty: 0, cracked: 0, good: 0 }
  }

  // Count defects by hour and type
  defects.forEach((defect) => {
    const hour = defect.timestamp.getHours()
    hourlyData[hour].total++

    if (defect.defect_type === "dirty") {
      hourlyData[hour].dirty++
    } else if (defect.defect_type === "cracked") {
      hourlyData[hour].cracked++
    } else if (defect.defect_type === "good") {
      hourlyData[hour].good++
    }
  })

  // Convert to array and format for chart
  return Object.values(hourlyData).map((hourData) => {
    const formattedHour = new Date(2023, 0, 1, hourData.hour).toLocaleTimeString([], {
      hour: "numeric",
      hour12: true,
    })

    return {
      hour: formattedHour,
      total: hourData.total,
      dirty: hourData.dirty,
      cracked: hourData.cracked,
      good: hourData.good,
    }
  })
}

// Get defect counts by type
export function getDefectCounts(defects) {
  const counts = {
    dirty: 0,
    cracked: 0,
    good: 0,
  }

  defects.forEach((defect) => {
    if (defect.defect_type === "dirty") {
      counts.dirty++
    } else if (defect.defect_type === "cracked") {
      counts.cracked++
    } else if (defect.defect_type === "good") {
      counts.good++
    }
  })

  return counts
}

// Calculate percentage change
export function calculatePercentageChange(current, previous) {
  if (previous === 0) return "Infinity"
  return (((current - previous) / previous) * 100).toFixed(1)
}

