"use client"

import { useState, useEffect } from "react"
import {
  getTodayDefects,
  getPreviousDayDefects,
  getWeekDefects,
  calculateDailyAverage,
  findPeakTime,
  getHourlyDistribution,
  getDefectCounts,
  calculatePercentageChange,
} from "../../lib/history/DailySummarry"

export function useDefectData() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({
    todayDefects: [],
    previousDayDefects: [],
    periodTotal: 0,
    dailyAverage: 0,
    peakTime: "N/A",
    percentageChange: 0,
    hourlyDistribution: [],
    defectCounts: { dirty: 0, cracked: 0, good: 0 },
    lastUpdated: null,
  })

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

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

        setData({
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
      } catch (err) {
        console.error("Error fetching defect data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Function to refresh data
  const refreshData = async () => {
    try {
      setLoading(true)

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

      setData({
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
    } catch (err) {
      console.error("Error refreshing defect data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { ...data, loading, error, refreshData }
}

