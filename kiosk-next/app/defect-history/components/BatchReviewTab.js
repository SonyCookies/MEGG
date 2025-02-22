"use client"

import { useState, useEffect, useMemo } from "react"
import { db } from "../../firebaseConfig"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Loader2, Package, AlertCircle, Timer } from "lucide-react"

// Color palette
const COLORS = {
  good: {
    base: "#0e5f97",
    light: "#e6f3ff",
    gradient: ["#0e5f97", "#0e4772"],
  },
  dirty: {
    base: "#fb510f",
    light: "#fff1f0",
    gradient: ["#fb510f", "#d93d04"],
  },
  cracked: {
    base: "#ecb662",
    light: "#fff8e7",
    gradient: ["#ecb662", "#d69d3c"],
  },
  bloodspots: {
    base: "#fb510f",
    light: "#fff1f0",
    gradient: ["#fb510f", "#cc3000"],
  },
  default: {
    base: "#0e4772",
    light: "#e6f3ff",
    gradient: ["#0e4772", "#072c4a"],
  },
}

const getDefectColor = (defectType) => {
  const normalizedType = defectType?.toLowerCase().trim() || ""
  return COLORS[normalizedType] || COLORS.default
}

const formatPercentage = (value) => `${(value * 100).toFixed(1)}%`

// Helper function to safely parse timestamps
const parseTimestamp = (timestamp) => {
  try {
    // If it's a Firestore timestamp with seconds and nanoseconds
    if (timestamp && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000)
    }
    // If it's a number (Unix timestamp)
    if (typeof timestamp === "number") {
      return new Date(timestamp)
    }
    // If it's a string (ISO format)
    if (typeof timestamp === "string") {
      return new Date(timestamp)
    }
    // If it's already a Date object
    if (timestamp instanceof Date) {
      return timestamp
    }
    // Fallback
    console.warn("Invalid timestamp format:", timestamp)
    return new Date()
  } catch (error) {
    console.error("Error parsing timestamp:", error)
    return new Date()
  }
}

const formatDateTime = (timestamp) => {
  const date = parseTimestamp(timestamp)
  return date.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  const color = getDefectColor(data.name || data.defect_type)

  return (
    <div className="bg-white/95 backdrop-blur-sm border-2 rounded-xl shadow-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color.light }}>
          <div className="w-6 h-6 rounded-md" style={{ backgroundColor: color.base }} />
        </div>
        <div>
          <p className="font-semibold capitalize" style={{ color: color.base }}>
            {data.name || data.defect_type}
          </p>
          <p className="text-sm text-gray-500">{data.batch_number ? `Batch ${data.batch_number}` : "Defect Type"}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Count</span>
          <span className="font-semibold text-gray-900">{data.value || data.count}</span>
        </div>
        {data.percentage && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Percentage</span>
            <span className="font-semibold text-gray-900">{formatPercentage(data.percentage)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to group defects by time intervals (5 minutes)
const groupDefectsByTimeInterval = (defects, intervalMinutes = 5) => {
  const groups = defects.reduce((acc, defect) => {
    // Create a time slot by rounding to the nearest interval
    const timestamp = new Date(defect.timestamp)
    const minutes = timestamp.getMinutes()
    const roundedMinutes = Math.floor(minutes / intervalMinutes) * intervalMinutes
    timestamp.setMinutes(roundedMinutes)
    timestamp.setSeconds(0)
    timestamp.setMilliseconds(0)

    const timeKey = timestamp.getTime()

    if (!acc[timeKey]) {
      acc[timeKey] = {
        timestamp,
        defects: [],
        byType: {},
      }
    }

    acc[timeKey].defects.push(defect)
    acc[timeKey].byType[defect.defect_type] = (acc[timeKey].byType[defect.defect_type] || 0) + 1

    return acc
  }, {})

  // Convert to array and sort by timestamp
  return Object.values(groups).sort((a, b) => a.timestamp - b.timestamp)
}

// Enhanced tooltip for timeline
const TimelineTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  const totalDefects = Object.values(data.byType).reduce((sum, count) => sum + count, 0)

  return (
    <div className="bg-white/95 backdrop-blur-sm border-2 rounded-xl shadow-lg p-4">
      <div className="mb-2">
        <p className="font-medium text-[#0e4772]">
          {new Date(data.timestamp).toLocaleString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
        <p className="text-sm text-gray-500">{totalDefects} defects in this interval</p>
      </div>
      <div className="space-y-1.5">
        {Object.entries(data.byType).map(([type, count]) => {
          const color = getDefectColor(type)
          return (
            <div key={type} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color.base }} />
                <span className="text-sm capitalize text-gray-600">{type}</span>
              </div>
              <span className="text-sm font-medium" style={{ color: color.base }}>
                {count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Updated BatchSummaryCard Component
const BatchSummaryCard = ({ batch, stats, onClick, isSelected }) => {
  const mainDefectColor = getDefectColor("default") // Using default color for consistency

  // Format date with time
  const formatDateWithTime = (timestamp) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border p-3 cursor-pointer transition-all duration-300 ${
        isSelected ? "ring-2 ring-[#0e5f97] shadow-md" : "hover:shadow-md hover:border-[#0e5f97]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="font-medium text-[#0e4772]">Batch {batch}</h4>
          <div className="space-y-0.5">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              {formatDateWithTime(stats.startTime)}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              {formatDateWithTime(stats.endTime)}
            </p>
          </div>
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: mainDefectColor.light }}>
          <Package className="w-4 h-4" style={{ color: mainDefectColor.base }} />
        </div>
      </div>
    </div>
  )
}

export default function BatchReviewTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [defectLogs, setDefectLogs] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)

  // Fetch defect logs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const q = query(collection(db, "defect_logs"), orderBy("timestamp", "desc"))
        const snapshot = await getDocs(q)
        console.log(
          "Raw Firestore data:",
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        )

        const logs = snapshot.docs.map((doc) => {
          const data = doc.data()
          const rawTimestamp = data.timestamp
          const parsedTimestamp = parseTimestamp(rawTimestamp)

          console.log("Processing log:", {
            id: doc.id,
            rawTimestamp,
            parsedTimestamp: parsedTimestamp.toLocaleString(),
            batch: data.batch_number,
          })

          return {
            id: doc.id,
            ...data,
            timestamp: parsedTimestamp,
          }
        })

        console.log("Processed logs:", logs)
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

  // Process batch data
  const { batchStats, batchList } = useMemo(() => {
    if (!defectLogs.length) {
      console.log("No defect logs available")
      return { batchStats: {}, batchList: [] }
    }

    console.log("Processing all logs:", defectLogs.length)

    const stats = defectLogs.reduce((acc, log) => {
      const batch = log.batch_number
      if (!acc[batch]) {
        acc[batch] = {
          defects: [],
          byType: {},
          startTime: log.timestamp,
          endTime: log.timestamp,
        }
      }

      acc[batch].defects.push(log)
      acc[batch].byType[log.defect_type] = (acc[batch].byType[log.defect_type] || 0) + 1

      // Update start and end times
      if (log.timestamp < acc[batch].startTime) acc[batch].startTime = log.timestamp
      if (log.timestamp > acc[batch].endTime) acc[batch].endTime = log.timestamp

      return acc
    }, {})

    // Sort defect types by count for each batch
    Object.keys(stats).forEach((batch) => {
      stats[batch].byType = Object.entries(stats[batch].byType)
        .sort(([, a], [, b]) => b - a)
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {})
    })

    return {
      batchStats: stats,
      batchList: Object.keys(stats).sort((a, b) => stats[b].startTime.getTime() - stats[a].startTime.getTime()),
    }
  }, [defectLogs])

  // Selected batch details
  const selectedBatchDetails = useMemo(() => {
    if (!selectedBatch || !batchStats[selectedBatch]) return null

    const stats = batchStats[selectedBatch]
    const total = stats.defects.length

    // Prepare pie chart data
    const defectsByType = Object.entries(stats.byType).map(([name, value]) => ({
      name,
      value,
      percentage: value / total,
    }))

    // Prepare timeline data with grouped intervals
    const timelineData = groupDefectsByTimeInterval(stats.defects)

    return {
      stats,
      chartData: defectsByType,
      timeline: timelineData,
    }
  }, [selectedBatch, batchStats])

  if (error) {
    return <div className="text-red-500 text-center p-4">Error loading batch review: {error}</div>
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0e5f97]" />
      </div>
    )
  }

  if (!batchList.length) {
    return <div className="text-gray-500 text-center p-4">No batch data available</div>
  }

  return (
    <div className="space-y-8">
      {/* Batch Summary Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-[#0e4772]">All Batches</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {batchList.length > 0 ? (
            batchList.map((batch) => (
              <BatchSummaryCard
                key={batch}
                batch={batch}
                stats={batchStats[batch]}
                onClick={() => setSelectedBatch(selectedBatch === batch ? null : batch)}
                isSelected={selectedBatch === batch}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">No batches found</div>
          )}
        </div>
      </div>

      {/* Selected Batch Details */}
      {selectedBatchDetails && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-[#0e5f97]/10">
                  <Package className="w-5 h-5 text-[#0e5f97]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Defects</p>
                  <p className="font-semibold text-[#0e4772]">{selectedBatchDetails.stats.defects.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-[#fb510f]/10">
                  <AlertCircle className="w-5 h-5 text-[#fb510f]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unique Defect Types</p>
                  <p className="font-semibold text-[#0e4772]">
                    {Object.keys(selectedBatchDetails.stats.byType).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-[#ecb662]/10">
                  <Timer className="w-5 h-5 text-[#ecb662]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time Range</p>
                  <p className="font-semibold text-[#0e4772]">
                    {formatDateTime(selectedBatchDetails.stats.startTime)} -{" "}
                    {formatDateTime(selectedBatchDetails.stats.endTime)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Defect Distribution */}
            <div className="bg-white rounded-xl border p-6">
              <h4 className="text-lg font-semibold mb-6 text-[#0e4772]">Defect Distribution</h4>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={selectedBatchDetails.chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {selectedBatchDetails.chartData.map((entry) => (
                        <Cell key={entry.name} fill={getDefectColor(entry.name).base} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border p-6">
              <h4 className="text-lg font-semibold mb-6 text-[#0e4772]">Defect Timeline</h4>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedBatchDetails.timeline} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => {
                        return new Date(value).toLocaleString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval="preserveStartEnd"
                      minTickGap={50}
                    />
                    <YAxis
                      label={{
                        value: "Defects",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: "#64748b" },
                      }}
                    />
                    <Tooltip content={<TimelineTooltip />} />
                    {Object.keys(COLORS).map((defectType) => (
                      <Bar
                        key={defectType}
                        dataKey={(entry) => entry.byType[defectType] || 0}
                        stackId="defects"
                        fill={getDefectColor(defectType).base}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 justify-center">
                {Object.keys(COLORS).map((defectType) => {
                  const color = getDefectColor(defectType)
                  return (
                    <div key={defectType} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.base }} />
                      <span className="text-sm capitalize text-gray-600">{defectType}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

