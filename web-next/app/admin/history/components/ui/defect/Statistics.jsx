"use client"

import { useState, useEffect } from "react"
import { BarChart2, Clock, RefreshCw, Target, AlertCircle, TrendingUp, ArrowUpRight } from "lucide-react"
import { calculateStatistics } from "../../../../../lib/history/Statistics"

export default function Statistics() {
  const [timeFilter, setTimeFilter] = useState("24h")
  const [chartType, setChartType] = useState("bar")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalInspections: 0,
    defectCounts: {},
    defectPercentages: {},
    mostCommonDefect: null,
    inspectionRate: 0,
    inspectionTrend: 0,
    lastUpdated: "",
  })

  // Fetch statistics when component mounts or time filter changes
  useEffect(() => {
    console.log("Fetching statistics with time filter:", timeFilter)
    fetchStatistics()
  }, [timeFilter])

  const fetchStatistics = async () => {
    setLoading(true)
    try {
      console.log("Calculating statistics...")
      const data = await calculateStatistics(timeFilter)
      console.log("Statistics calculated:", data)
      setStats(data)
    } catch (error) {
      console.error("Error fetching statistics:", error)
      // Set default values in case of error
      setStats({
        totalInspections: 0,
        defectCounts: {},
        defectPercentages: {},
        mostCommonDefect: null,
        inspectionRate: 0,
        inspectionTrend: 0,
        lastUpdated: new Date().toLocaleTimeString(),
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle time filter change
  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter)
  }

  // Handle refresh button click
  const handleRefresh = () => {
    fetchStatistics()
  }

  // Get defect types for chart
  const defectTypes = Object.keys(stats.defectCounts || {}).filter((type) => type !== "none")

  // Calculate chart heights based on percentages
  const getChartHeight = (defectType) => {
    const percentage = stats.defectPercentages[defectType] || 0
    return `${Math.max(percentage, 5)}%` // Minimum 5% height for visibility
  }

  return (
    <div className="flex flex-col gap-6 bg-white border p-6 rounded-2xl shadow relative flex-1">
      {/* Header */}
      <div className="flex justify-between items-center ">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-medium">Statistics & Analytics</h3>

          <p className="text-gray-500 text-sm">View and analyze defect detection patterns</p>
        </div>
        <button
          className="text-gray-500 hover:text-gray-700 absolute right-6 top-6"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Time filters */}
      <div className="flex flex-col md:flex-row gap-6 justify-between ">
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-md ${timeFilter === "24h" ? "bg-blue-500 text-white" : "text-gray-500 border"} text-sm transition-colors duration-150 hover:bg-blue-600 hover:text-white`}
            onClick={() => handleTimeFilterChange("24h")}
          >
            24h
          </button>
          <button
            className={`px-4 py-2 rounded-md ${timeFilter === "7d" ? "bg-blue-500 text-white" : "text-gray-500 border"} text-sm transition-colors duration-150 hover:bg-blue-600 hover:text-white`}
            onClick={() => handleTimeFilterChange("7d")}
          >
            7d
          </button>
          <button
            className={`px-4 py-2 rounded-md ${timeFilter === "30d" ? "bg-blue-500 text-white" : "text-gray-500 border"} text-sm transition-colors duration-150 hover:bg-blue-600 hover:text-white`}
            onClick={() => handleTimeFilterChange("30d")}
          >
            30d
          </button>
          <button
            className={`px-4 py-2 rounded-md ${timeFilter === "90d" ? "bg-blue-500 text-white" : "text-gray-500 border"} text-sm transition-colors duration-150 hover:bg-blue-600 hover:text-white`}
            onClick={() => handleTimeFilterChange("90d")}
          >
            90d
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
          <span className="text-sm text-gray-500">Chart Type:</span>
          <div className="flex items-center gap-2">
            <button
              className={`p-1 rounded ${chartType === "bar" ? "bg-blue-500 text-white" : "text-gray-400 border"} transition-colors duration-150 hover:bg-blue-600 hover:text-white`}
              onClick={() => setChartType("bar")}
            >
              <BarChart2 className="w-5 h-5" />
            </button>
            {/* <button
              className={`p-1 rounded ${chartType === "time" ? "bg-blue-500 text-white" : "text-gray-400 border"} transition-colors duration-150 hover:bg-blue-600 hover:text-white`}
              onClick={() => setChartType("time")}
            >
              <Clock className="w-5 h-5" />
            </button> */}
          </div>
        </div>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Inspections */}
        <div className="border rounded-lg p-4 flex">
          <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-gray-500 text-sm mb-">Total Inspections</h3>
            <p className="text-4xl font-bold text-blue-500">{stats.totalInspections}</p>

            <div className="flex flex-col gap-1">
              <div className="flex items-center text-xs mt-">
                <p className="text-gray-500">Total items inspected</p>
              </div>
              <div className="flex items-center text-xs text-green-500">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>{stats.inspectionTrend}% from previous period</span>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Most Common Defect */}
        <div className="border rounded-lg p-4 flex">
          <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-gray-500 text-sm mb-">Most Common Defect</h3>
            <p className="text-4xl font-bold text-orange-500">
              {stats.mostCommonDefect ? stats.mostCommonDefect.type : "N/A"}
            </p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center text-xs mt-">
                <p className="text-gray-500">Highest occurring defect type</p>
              </div>
              <div className="flex items-center text-xs mt- text-green-500">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                <span>
                  {stats.mostCommonDefect && stats.totalInspections > 0
                    ? `${stats.defectPercentages[stats.mostCommonDefect.type]}% of total`
                    : "0% of total"}
                </span>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Inspection Rate */}
        <div className="border rounded-lg p-4 flex">
          <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-gray-500 text-sm mb-">Inspection Rate</h3>
            <p className="text-4xl font-bold text-yellow-500">{stats.inspectionRate} /hr</p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center text-xs mt-">
                <p className="text-gray-500">Average items per hour</p>
              </div>
              <div className="flex items-center text-xs mt- opacity-0">
                <span>placeholder</span>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Defect Distribution */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center ">
          <div className="flex flex-col gap-1">
            <h3 className="font-medium text-gray-800">Defect Distribution</h3>
            <p className="text-sm text-gray-500">Breakdown of defect types and their frequencies</p>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Last updated: {stats.lastUpdated}
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 border rounded-lg">
          <div className="flex h-full items-end">
            {defectTypes.length > 0 ? (
              defectTypes.map((type, index) => {
                // Define colors based on defect type
                let bgColor = "bg-gray-500"
                if (type === "dirty") bgColor = "bg-orange-500"
                else if (type === "cracked") bgColor = "bg-yellow-400"
                else if (type === "good") bgColor = "bg-blue-500"

                return (
                  <div key={type} className="flex flex-col items-center justify-end h-full flex-1">
                    <div className={`w-16 ${bgColor} rounded-t-md`} style={{ height: getChartHeight(type) }}></div>
                    <div className="mt-2 text-xs text-gray-500 -rotate-45 origin-top-left">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-400">No data available</div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          {defectTypes.map((type) => {
            // Define colors based on defect type
            let bgColor = "bg-gray-500"
            if (type === "dirty") bgColor = "bg-orange-500"
            else if (type === "cracked") bgColor = "bg-yellow-400"
            else if (type === "good") bgColor = "bg-blue-500"

            return (
              <div key={type} className="flex items-center gap-2 px-4 py-2 border rounded-full">
                <span className={`w-3 h-3 rounded-full ${bgColor}`}></span>
                <div className="flex items-center justify-between text-sm w-full gap-1">
                  <span className="">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  <span>({stats.defectPercentages[type]}%)</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

