"use client"

import { useState, useEffect, useMemo } from "react"
import { db } from "../../firebaseConfig"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Loader2, Calendar, TrendingUp, TrendingDown, ArrowRight } from "lucide-react"

// Color palette
const COLORS = {
  good: "#0e5f97",
  dirty: "#fb510f",
  cracked: "#ecb662",
  bloodspots: "#fb510f",
  default: "#0e4772",
  background: {
    good: "#0e5f9720",
    dirty: "#fb510f20",
    cracked: "#ecb66220",
    bloodspots: "#fb510f20",
    default: "#0e477220",
  },
}

const getDefectColor = (defectType) => {
  const normalizedType = defectType?.toLowerCase().trim() || ""
  return {
    main: COLORS[normalizedType] || COLORS.default,
    background: COLORS.background[normalizedType] || COLORS.background.default,
  }
}

// Format date for display
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null

  const date = new Date(label)
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="bg-white/95 backdrop-blur-sm border rounded-xl shadow-lg p-4">
      <p className="font-medium text-[#0e4772] mb-2">{formattedDate}</p>
      <div className="space-y-2">
        {payload.map((entry) => {
          const color = getDefectColor(entry.name)
          return (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.main }} />
                <span className="capitalize text-gray-600">{entry.name}</span>
              </div>
              <span className="font-medium" style={{ color: color.main }}>
                {entry.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Daily Summary Card Component
const DailySummaryCard = ({ date, stats }) => {
  const totalDefects = Object.values(stats).reduce((sum, count) => sum + count, 0)
  const mainDefectType = Object.entries(stats).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
  const mainDefectCount = stats[mainDefectType]
  const mainDefectColor = getDefectColor(mainDefectType)

  return (
    <div className="bg-white rounded-xl border p-4 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-gray-500">{formatDate(date)}</p>
          <h4 className="font-medium text-[#0e4772]">
            {totalDefects} {totalDefects === 1 ? "Defect" : "Defects"}
          </h4>
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: mainDefectColor.background }}>
          <Calendar className="w-5 h-5" style={{ color: mainDefectColor.main }} />
        </div>
      </div>
      <div className="space-y-2">
        {Object.entries(stats).map(([type, count]) => {
          const color = getDefectColor(type)
          return (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color.main }} />
                <span className="text-sm capitalize text-gray-600">{type}</span>
              </div>
              <span className="text-sm font-medium" style={{ color: color.main }}>
                {count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DailySummaryTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [defectLogs, setDefectLogs] = useState([])

  // Fetch defect logs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const q = query(collection(db, "defect_logs"), orderBy("timestamp", "desc"))
        const snapshot = await getDocs(q)
        const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setDefectLogs(logs)
      } catch (err) {
        console.error("Error fetching defect logs:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Process data for visualization
  const { dailyStats, chartData, trends } = useMemo(() => {
    if (!defectLogs.length) return { dailyStats: {}, chartData: [], trends: {} }

    // Group by date and defect type
    const dailyStats = defectLogs.reduce((acc, log) => {
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

    // Calculate trends
    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

    const todayTotal = Object.values(dailyStats[today] || {}).reduce((sum, count) => sum + count, 0)
    const yesterdayTotal = Object.values(dailyStats[yesterday] || {}).reduce((sum, count) => sum + count, 0)

    const trends = {
      change: todayTotal - yesterdayTotal,
      percentage: yesterdayTotal ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0,
    }

    return { dailyStats, chartData, trends }
  }, [defectLogs])

  if (error) {
    return <div className="text-red-500 text-center p-4">Error loading daily summary: {error}</div>
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0e5f97]" />
      </div>
    )
  }

  if (!chartData.length) {
    return <div className="text-gray-500 text-center p-4">No data available</div>
  }

  return (
    <div className="space-y-8">
      {/* Trend Card */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#0e4772]">Daily Trend</h3>
            <p className="text-sm text-gray-500">Comparison with previous day</p>
          </div>
          <div className={`flex items-center gap-2 ${trends.change > 0 ? "text-red-500" : "text-green-500"}`}>
            {trends.change > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <span className="font-medium">{Math.abs(trends.percentage).toFixed(1)}%</span>
          </div>
        </div>

        {/* Area Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: "#0e4772" }} />
              <YAxis tick={{ fill: "#0e4772" }} />
              <Tooltip content={<CustomTooltip />} />
              {Object.keys(chartData[0] || {})
                .filter((key) => key !== "date")
                .map((defectType) => (
                  <Area
                    key={defectType}
                    type="monotone"
                    dataKey={defectType}
                    name={defectType}
                    stroke={getDefectColor(defectType).main}
                    fill={getDefectColor(defectType).background}
                    stackId="1"
                  />
                ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#0e4772]">Daily Breakdown</h3>
          <button className="text-sm text-[#0e5f97] hover:text-[#0e4772] transition-colors flex items-center gap-1">
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(dailyStats)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 6)
            .map(([date, stats]) => (
              <DailySummaryCard key={date} date={date} stats={stats} />
            ))}
        </div>
      </div>
    </div>
  )
}

