"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { db } from "../../firebaseConfig"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import {
  Loader2,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChartIcon as ChartBar,
  Filter,
  RefreshCcw,
  AlertCircle,
  Target,
  Clock,
  Info,
} from "lucide-react"
import { addAccessLog } from "../../utils/logging"

// Enhanced color palette with gradients
const COLORS = {
  good: {
    base: "#0e5f97",
    gradient: ["#0e5f97", "#0e4772"],
    light: "#e6f3ff",
  },
  dirty: {
    base: "#fb510f",
    gradient: ["#fb510f", "#d93d04"],
    light: "#fff1f0",
  },
  cracked: {
    base: "#ecb662",
    gradient: ["#ecb662", "#d69d3c"],
    light: "#fff8e7",
  },
  bloodspots: {
    base: "#fb510f",
    gradient: ["#fb510f", "#cc3000"],
    light: "#fff1f0",
  },
  default: {
    base: "#0e4772",
    gradient: ["#0e4772", "#072c4a"],
    light: "#e6f3ff",
  },
}

const getDefectColor = (defectType) => {
  const normalizedType = defectType?.toLowerCase().trim() || ""
  return COLORS[normalizedType] || COLORS.default
}

// Format date for display
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

// Time Period Selector
const TimePeriodSelector = ({ period, onChange }) => (
  <div className="flex gap-2">
    {["7d", "14d", "30d", "90d"].map((p) => (
      <button
        key={p}
        onClick={() => onChange(p)}
        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors
          ${period === p ? "bg-[#0e5f97] text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
      >
        {p}
      </button>
    ))}
  </div>
)

// Enhanced Stat Card Component
const StatCard = ({ icon: Icon, label, value, trend, color, description }) => (
  <div className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all duration-300 group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <h4 className="text-2xl font-semibold" style={{ color }}>
          {value}
        </h4>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div
        className="p-2 rounded-lg group-hover:scale-110 transition-transform duration-300"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
    </div>
    {trend && (
      <div className="mt-2 flex items-center gap-1 text-sm">
        {trend.direction === "up" ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
        <span className={trend.direction === "up" ? "text-green-600" : "text-red-600"}>{trend.value}</span>
      </div>
    )}
  </div>
)

// Enhanced Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null

  const date = new Date(label)
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const totalDefects = payload.reduce((sum, entry) => sum + (entry.value || 0), 0)

  return (
    <div className="bg-white/95 backdrop-blur-sm border-2 rounded-xl shadow-lg p-4">
      <div className="space-y-3">
        <div className="border-b pb-2">
          <p className="font-medium text-[#0e4772]">{formattedDate}</p>
          <p className="text-sm text-gray-500">Total Defects: {totalDefects}</p>
        </div>
        <div className="space-y-2">
          {payload.map((entry) => {
            const color = getDefectColor(entry.name)
            return (
              <div key={entry.name} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.base }} />
                  <span className="capitalize text-gray-600">{entry.name}</span>
                </div>
                <span className="font-medium" style={{ color: color.base }}>
                  {entry.value}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function DailySummaryTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [defectLogs, setDefectLogs] = useState([])
  const [timePeriod, setTimePeriod] = useState("7d")
  const [chartType, setChartType] = useState("area")

  // Fetch defect logs
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const q = query(collection(db, "defect_logs"), orderBy("timestamp", "desc"))
      const snapshot = await getDocs(q)
      const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      setDefectLogs(logs)

      // Log successful fetch
      await addAccessLog({
        action: "view_daily_summary",
        status: "success",
        details: `Fetched ${logs.length} records`,
      })
    } catch (err) {
      console.error("Error fetching defect logs:", err)
      setError("Failed to load data. Please try again.")

      // Log error
      await addAccessLog({
        action: "view_daily_summary",
        status: "error",
        details: "Failed to fetch daily summary",
        error: err.message,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Process data for visualization
  const { dailyStats, chartData, trends, periodStats } = useMemo(() => {
    if (!defectLogs.length) return { dailyStats: {}, chartData: [], trends: {}, periodStats: {} }

    // Get date range based on time period
    const now = new Date()
    const periodDays = Number.parseInt(timePeriod)
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

    // Filter logs for selected period
    const periodLogs = defectLogs.filter((log) => new Date(log.timestamp) >= startDate)

    // Group by date and defect type
    const dailyStats = periodLogs.reduce((acc, log) => {
      const date = new Date(log.timestamp).toISOString().split("T")[0]
      const type = log.defect_type || "unknown"

      if (!acc[date]) {
        acc[date] = {}
      }
      acc[date][type] = (acc[date][type] || 0) + 1
      return acc
    }, {})

    // Prepare data for chart
    const chartData = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate period statistics
    const periodStats = {
      total: periodLogs.length,
      byType: periodLogs.reduce((acc, log) => {
        const type = log.defect_type || "unknown"
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {}),
    }

    // Calculate trends
    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

    const todayTotal = Object.values(dailyStats[today] || {}).reduce((sum, count) => sum + count, 0)
    const yesterdayTotal = Object.values(dailyStats[yesterday] || {}).reduce((sum, count) => sum + count, 0)

    const trends = {
      change: todayTotal - yesterdayTotal,
      percentage: yesterdayTotal ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0,
      direction: todayTotal >= yesterdayTotal ? "up" : "down",
      value: `${Math.abs(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100).toFixed(1)}% from yesterday`,
    }

    return { dailyStats, chartData, trends, periodStats }
  }, [defectLogs, timePeriod])

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Error loading daily summary</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0e5f97]" />
      </div>
    )
  }

  if (!chartData.length) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">Start inspecting items to see daily statistics</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Daily Summary
          </h2>
          <p className="text-gray-500">Track defect patterns over time</p>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh data">
          <RefreshCcw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <TimePeriodSelector period={timePeriod} onChange={setTimePeriod} />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            Chart Type:
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setChartType("area")}
              className={`p-2 rounded-lg transition-colors ${
                chartType === "area"
                  ? "bg-[#0e5f97] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <ChartBar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`p-2 rounded-lg transition-colors ${
                chartType === "bar"
                  ? "bg-[#0e5f97] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <ChartBar className="w-4 h-4 rotate-90" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Target}
          label="Period Total"
          value={periodStats.total}
          trend={trends}
          color="#0e5f97"
          description={`Last ${timePeriod} defects`}
        />
        <StatCard
          icon={Calendar}
          label="Daily Average"
          value={(periodStats.total / Number.parseInt(timePeriod)).toFixed(1)}
          color="#ecb662"
          description="Defects per day"
        />
        <StatCard icon={Clock} label="Peak Time" value="2-4 PM" color="#fb510f" description="Highest activity period" />
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-[#0e4772]">Defect Trends</h3>
            <p className="text-sm text-gray-500">Daily defect distribution over time</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Info className="w-4 h-4" />
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fill: "#0e4772" }}
                />
                <YAxis tick={{ fill: "#0e4772" }} />
                <Tooltip content={<CustomTooltip />} />
                {Object.keys(chartData[0] || {})
                  .filter((key) => key !== "date")
                  .map((defectType) => {
                    const color = getDefectColor(defectType)
                    return (
                      <Area
                        key={defectType}
                        type="monotone"
                        dataKey={defectType}
                        name={defectType}
                        stroke={color.base}
                        fill={`url(#gradient-${defectType})`}
                        stackId="1"
                      />
                    )
                  })}
                <defs>
                  {Object.keys(chartData[0] || {})
                    .filter((key) => key !== "date")
                    .map((defectType) => {
                      const color = getDefectColor(defectType)
                      return (
                        <linearGradient key={defectType} id={`gradient-${defectType}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color.gradient[0]} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={color.gradient[1]} stopOpacity={0.1} />
                        </linearGradient>
                      )
                    })}
                </defs>
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fill: "#0e4772" }}
                />
                <YAxis tick={{ fill: "#0e4772" }} />
                <Tooltip content={<CustomTooltip />} />
                {Object.keys(chartData[0] || {})
                  .filter((key) => key !== "date")
                  .map((defectType) => {
                    const color = getDefectColor(defectType)
                    return (
                      <Bar
                        key={defectType}
                        dataKey={defectType}
                        name={defectType}
                        fill={color.base}
                        stackId="a"
                        radius={[4, 4, 0, 0]}
                      />
                    )
                  })}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center mt-6">
          {Object.keys(chartData[0] || {})
            .filter((key) => key !== "date")
            .map((defectType) => {
              const color = getDefectColor(defectType)
              return (
                <div
                  key={defectType}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                  style={{ borderColor: color.base, backgroundColor: color.light }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.base }} />
                  <span className="text-sm font-medium capitalize" style={{ color: color.base }}>
                    {defectType}
                  </span>
                  <span className="text-sm text-gray-500">({periodStats.byType[defectType] || 0})</span>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

