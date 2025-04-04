import {
  getTodayDefects,
  getPreviousDayDefects,
  getWeekDefects,
  calculateDailyAverage,
  findPeakTime,
  getHourlyDistribution,
  getDefectCounts,
  calculatePercentageChange,
} from "../../../lib/history/DailySummarry"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    // Fetch defect data
    const [todayDefects, previousDayDefects, weekDefects] = await Promise.all([
      getTodayDefects(),
      getPreviousDayDefects(),
      getWeekDefects(),
    ])

    // Calculate metrics
    const periodTotal = todayDefects.length
    const dailyAverage = calculateDailyAverage(weekDefects)
    const peakTime = findPeakTime(weekDefects)
    const percentageChange = calculatePercentageChange(todayDefects.length, previousDayDefects.length)
    const hourlyDistribution = getHourlyDistribution(weekDefects)
    const defectCounts = getDefectCounts(weekDefects)

    // Get last updated time
    const lastUpdated = new Date()

    res.status(200).json({
      todayDefects,
      previousDayDefects,
      weekDefects,
      periodTotal,
      dailyAverage,
      peakTime,
      percentageChange,
      hourlyDistribution,
      defectCounts,
      lastUpdated,
    })
  } catch (error) {
    console.error("Error fetching defect data:", error)
    res.status(500).json({ message: "Error fetching defect data", error: error.message })
  }
}

