"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { db } from "../../firebaseConfig"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts"
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  BarChartIcon as ChartBar,
  PieChartIcon,
  Calendar,
  Info,
  RefreshCcw,
  Filter,
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

const formatPercentage = (value) => `${(value * 100).toFixed(1)}%`

// Enhanced Tooltip Component
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  const color = getDefectColor(data.name)

  return (
    <div
      className="bg-white/95 backdrop-blur-sm border-2 rounded-xl shadow-lg p-4 transition-all duration-300"
      style={{ borderColor: color.base }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color.light }}>
          <div className="w-6 h-6 rounded-md" style={{ backgroundColor: color.base }} />
        </div>
        <div>
          <p className="font-semibold capitalize text-lg" style={{ color: color.base }}>
            {data.name}
          </p>
          <p className="text-sm text-gray-500">Defect Type</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Count</span>
          <span className="font-semibold text-gray-900">{data.value}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Percentage</span>
          <span className="font-semibold text-gray-900">{formatPercentage(data.percentage)}</span>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
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

// Time Period Selector
const TimePeriodSelector = ({ period, onChange }) => (
  <div className="flex gap-2">
    {["24h", "7d", "30d", "90d"].map((p) => (
      <button
        key={p}
        onClick={() => onChange(p)}
        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors
          ${
            period === p ? "bg-[#0e5f97] text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
      >
        {p}
      </button>
    ))}
  </div>
)

export default function StatisticsTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [defectLogs, setDefectLogs] = useState([])
  const [hoveredBar, setHoveredBar] = useState(null)
  const [timePeriod, setTimePeriod] = useState("24h")
  const [chartType, setChartType] = useState("bar")

  // Fetch defect logs
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const q = query(collection(db, "defect_logs"), orderBy("timestamp", "desc"))
      const snapshot = await getDocs(q)
      const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      setDefectLogs(logs)

      // Log successful data fetch
      await addAccessLog({
        action: "statistics_view",
        status: "success",
        details: `Statistics data fetched successfully - ${logs.length} records`,
      })
    } catch (err) {
      console.error("Error fetching defect logs:", err)
      setError("Failed to load statistics. Please try again.")

      // Log error
      await addAccessLog({
        action: "statistics_view",
        status: "error",
        details: "Failed to fetch statistics data",
        error: err.message,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculate statistics
  const stats = useMemo(() => {
    if (!defectLogs.length) return null

    const total = defectLogs.length
    const byType = defectLogs.reduce((acc, log) => {
      const type = log.defect_type || "unknown"
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const chartData = Object.entries(byType).map(([name, value]) => ({
      name,
      value,
      percentage: value / total,
    }))

    chartData.sort((a, b) => b.value - a.value)

    // Calculate trends
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const todayCount = defectLogs.filter((log) => new Date(log.timestamp) > dayAgo).length
    const yesterdayCount = defectLogs.filter(
      (log) => new Date(log.timestamp) > weekAgo && new Date(log.timestamp) <= dayAgo,
    ).length

    const trend = {
      direction: todayCount >= yesterdayCount ? "up" : "down",
      value: `${Math.abs(((todayCount - yesterdayCount) / yesterdayCount) * 100).toFixed(1)}% from yesterday`,
    }

    return {
      total,
      byType: chartData,
      trend,
    }
  }, [defectLogs])

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Error loading statistics</p>
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

  if (!stats || stats.total === 0) {
    return (
      <div className="text-center py-12">
        <ChartBar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No statistics available</h3>
        <p className="mt-1 text-sm text-gray-500">Start inspecting items to see statistics here</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
            <ChartBar className="w-6 h-6" />
            Statistics & Analytics
          </h2>
          <p className="text-gray-500">View and analyze defect detection patterns</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh statistics"
        >
          <RefreshCcw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Time Period and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <TimePeriodSelector period={timePeriod} onChange={setTimePeriod} />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            Chart Type:
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setChartType("bar")}
              className={`p-2 rounded-lg transition-colors ${
                chartType === "bar"
                  ? "bg-[#0e5f97] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <ChartBar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType("pie")}
              className={`p-2 rounded-lg transition-colors ${
                chartType === "pie"
                  ? "bg-[#0e5f97] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Target}
          label="Total Inspections"
          value={stats.total}
          trend={stats.trend}
          color="#0e5f97"
          description="Total items inspected"
        />
        <StatCard
          icon={AlertCircle}
          label="Most Common Defect"
          value={stats.byType[0]?.name}
          trend={{
            direction: "up",
            value: `${formatPercentage(stats.byType[0]?.percentage)} of total`,
          }}
          color="#fb510f"
          description="Highest occurring defect type"
        />
        <StatCard
          icon={Calendar}
          label="Inspection Rate"
          value={`${Math.round(stats.total / 24)} /hr`}
          color="#ecb662"
          description="Average items per hour"
        />
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-[#0e4772]">Defect Distribution</h3>
              <p className="text-sm text-gray-500">Breakdown of defect types and their frequencies</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Info className="w-4 h-4" />
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart
                  data={stats.byType}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  barSize={50}
                  onMouseMove={(state) => {
                    if (state?.activeTooltipIndex !== undefined) {
                      setHoveredBar(state.activeTooltipIndex)
                    }
                  }}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <defs>
                    {stats.byType.map((entry) => (
                      <linearGradient key={entry.name} id={`gradient-${entry.name}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={getDefectColor(entry.name).gradient[0]} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={getDefectColor(entry.name).gradient[1]} stopOpacity={1} />
                      </linearGradient>
                    ))}
                    {stats.byType.map((entry) => (
                      <pattern
                        key={`pattern-${entry.name}`}
                        id={`pattern-${entry.name}`}
                        patternUnits="userSpaceOnUse"
                        width="10"
                        height="10"
                        patternTransform="rotate(45)"
                      >
                        <line x1="0" y="0" x2="0" y2="10" stroke={getDefectColor(entry.name).base} strokeWidth="8" />
                      </pattern>
                    ))}
                  </defs>
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: "#0e4772" }}
                  />
                  <YAxis tick={{ fill: "#0e4772" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={{ stroke: "#e5e7eb" }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                  <Bar dataKey="value" animationBegin={0} animationDuration={1200} radius={[8, 8, 0, 0]}>
                    {stats.byType.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={hoveredBar === index ? `url(#pattern-${entry.name})` : `url(#gradient-${entry.name})`}
                        className="transition-all duration-300"
                        style={{
                          filter: hoveredBar === index ? "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" : "none",
                          transform: hoveredBar === index ? "translateY(-4px)" : "none",
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={stats.byType}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    innerRadius={80}
                    paddingAngle={2}
                    label={({ name, percentage }) => `${name} (${formatPercentage(percentage)})`}
                  >
                    {stats.byType.map((entry) => (
                      <Cell key={entry.name} fill={getDefectColor(entry.name).base} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center">
          {stats.byType.map((entry) => {
            const color = getDefectColor(entry.name)
            return (
              <div
                key={entry.name}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                style={{ borderColor: color.base, backgroundColor: color.light }}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.base }} />
                <span className="text-sm font-medium capitalize" style={{ color: color.base }}>
                  {entry.name}
                </span>
                <span className="text-sm text-gray-500">({formatPercentage(entry.percentage)})</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

