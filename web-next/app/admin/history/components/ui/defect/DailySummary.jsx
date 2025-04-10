"use client"

import { useState } from "react"
import { BarChart2, Clock, RefreshCw, Target, Calendar, TrendingUp, LineChart } from "lucide-react"
import { useDefectData } from "../../../../../hooks/history/DailySummarry"
import { DefectChart } from "./DailySummarryChart"

export default function DailySummary() {
  const [chartType, setChartType] = useState("bar")
  const {
    periodTotal,
    dailyAverage,
    peakTime,
    percentageChange,
    hourlyDistribution,
    defectCounts,
    lastUpdated,
    loading,
    error,
    refreshData,
  } = useDefectData()

  // Format the last updated time
  const formattedLastUpdated = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
    : ""

  // Handle refresh button click
  const handleRefresh = () => {
    refreshData()
  }

  // Handle chart type change
  const handleChartTypeChange = (type) => {
    setChartType(type)
  }

  return (
    <div className="flex flex-col gap-6 bg-white border p-6 rounded-2xl shadow relative flex-1">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-medium text-gray-800">Daily Summary</h3>
          <p className="text-gray-500 text-sm">Track defect patterns over time</p>
        </div>
        <button
          className="text-gray-500 hover:text-gray-700 absolute top-6 right-6"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Chart Type Selection */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">Chart Type:</span>
        <div className="flex items-center gap-2">
          <button
            className={`p-2 rounded ${chartType === "line" ? "bg-blue-500 text-white" : "text-gray-400 border hover:bg-gray-100"}`}
            onClick={() => handleChartTypeChange("line")}
          >
            <LineChart className="w-4 h-4" />
          </button>
          <button
            className={`p-2 rounded ${chartType === "bar" ? "bg-blue-500 text-white" : "text-gray-400 border hover:bg-gray-100"}`}
            onClick={() => handleChartTypeChange("bar")}
          >
            <BarChart2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Period Total */}
        <div className="border rounded-lg p-4 flex">
          <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-gray-500 text-sm">Period Total</h3>
            <p className="text-4xl font-bold text-blue-600">{loading ? "..." : periodTotal}</p>

            <div className="flex flex-col gap-1">
              <div className="flex items-center text-xs">
                <p className="text-gray-500">Today's defects</p>
              </div>
              <div className="flex items-center text-xs text-green-500">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>{loading ? "..." : `${percentageChange}% from previous 12h`}</span>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Daily Average */}
        <div className="border rounded-lg p-4 flex">
          <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-gray-500 text-sm">Daily Average</h3>
            <p className="text-4xl font-bold text-orange-500">{loading ? "..." : dailyAverage.toFixed(1)}</p>

            <div className="flex flex-col gap-1">
              <div className="flex items-center text-xs">
                <p className="text-gray-500">Defects per day</p>
              </div>
              <div className="flex items-center text-xs opacity-0">
                <span>placeholder</span>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Peak Time */}
        <div className="border rounded-lg p-4 flex">
          <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-gray-500 text-sm">Peak Time</h3>
            <p className="text-4xl font-bold text-red-500">{loading ? "..." : peakTime}</p>

            <div className="flex flex-col gap-1">
              <div className="flex items-center text-xs">
                <p className="text-gray-500">Highest activity period</p>
              </div>
              <div className="flex items-center text-xs opacity-0">
                <span>placeholder</span>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Defect Trends Chart */}
      <div className="border flex flex-col gap-6 rounded-lg p-6">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium text-gray-800">Defect Trends</h3>
          <p className="text-sm text-gray-500">Daily defect distribution over time</p>
        </div>

        {/* Chart */}
        <div className="flex flex-col gap-2">
          <div className="h-64 border rounded-lg">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center text-red-500">Error loading chart data</div>
            ) : (
              <DefectChart hourlyDistribution={hourlyDistribution} chartType={chartType} />
            )}
          </div>

          <div className="text-xs text-gray-500 flex items-center justify-end gap-2">
            <Clock className="w-4 h-4" />
            Last updated: {formattedLastUpdated}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <div className="flex items-center gap-2 px-4 py-2 border rounded-full">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <div className="flex items-center justify-between text-sm w-full gap-1">
              <span className="">Dirty </span>
              <span>({loading ? "..." : defectCounts.dirty})</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border rounded-full">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <div className="flex items-center justify-between text-sm w-full gap-1">
              <span className="">Cracked</span>
              <span>({loading ? "..." : defectCounts.cracked})</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border rounded-full">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <div className="flex items-center justify-between text-sm w-full gap-1">
              <span className="">Good</span>
              <span>({loading ? "..." : defectCounts.good})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

