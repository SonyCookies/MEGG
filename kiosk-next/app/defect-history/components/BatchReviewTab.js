"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { db } from "../../firebaseConfig"
import { collection, query, orderBy, getDocs, where, doc, getDoc } from "firebase/firestore"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Loader2, Package, AlertCircle, Timer, RefreshCcw, Info } from "lucide-react"

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
  const batchNumber = stats.batch_number || `Batch ${batch.substring(0, 6)}`

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
          <h4 className="font-medium text-[#0e4772]">{batchNumber}</h4>
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
  const [chartType, setChartType] = useState("pie")
  const [timePeriod, setTimePeriod] = useState("24h")
  const [machineId, setMachineId] = useState(null)
  const [batchCache, setBatchCache] = useState({}) // Cache for batch data

  // Fetch machine ID from session
  useEffect(() => {
    const fetchMachineId = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session")
        const sessionData = await sessionResponse.json()

        if (!sessionResponse.ok) {
          throw new Error(sessionData.error || "Session invalid")
        }

        if (!sessionData.machineId) {
          throw new Error("Machine ID not found in session")
        }

        setMachineId(sessionData.machineId)
        console.log("Machine ID set for batch review:", sessionData.machineId)
      } catch (err) {
        console.error("Error fetching session:", err)
        setError("Failed to authenticate session: " + err.message)
      }
    }

    fetchMachineId()
  }, [])

  // Function to fetch batch data
  const fetchBatchData = useCallback(
    async (batchId) => {
      // Check if we already have this batch in cache
      if (batchCache[batchId]) {
        return batchCache[batchId]
      }

      try {
        const batchRef = doc(db, "batches", batchId)
        const batchSnap = await getDoc(batchRef)

        if (batchSnap.exists()) {
          const batchData = batchSnap.data()
          // Update cache
          setBatchCache((prev) => ({
            ...prev,
            [batchId]: { id: batchId, ...batchData },
          }))
          return { id: batchId, ...batchData }
        } else {
          console.log(`No batch found with ID: ${batchId}`)
          return { id: batchId, batch_number: "Unknown" }
        }
      } catch (err) {
        console.error(`Error fetching batch ${batchId}:`, err)
        return { id: batchId, batch_number: "Error" }
      }
    },
    [batchCache],
  )

  // Process batch data
  const { batchStats, batchList } = useMemo(() => {
    if (!defectLogs.length) {
      console.log("No defect logs available, defectLogs length:", defectLogs.length)
      return { batchStats: {}, batchList: [] }
    }

    // Filter logs based on selected time period
    const now = new Date()
    const periodInHours = Number.parseInt(timePeriod.replace(/[^0-9]/g, "")) * (timePeriod.includes("d") ? 24 : 1)
    const periodStart = new Date(now.getTime() - periodInHours * 60 * 60 * 1000)

    console.log("Time period filtering details:")
    console.log("- Selected period:", timePeriod)
    console.log("- Period in hours:", periodInHours)
    console.log("- Current time:", now.toISOString())
    console.log("- Period start:", periodStart.toISOString())

    const filteredLogs = defectLogs.filter((log) => {
      const logDate = new Date(log.timestamp)
      return logDate >= periodStart
    })

    console.log(`Filtering results:
- Original logs: ${defectLogs.length}
- Filtered logs: ${filteredLogs.length}`)

    // Group by batch_id instead of batch_number
    const stats = filteredLogs.reduce((acc, log) => {
      const batchId = log.batch_id
      if (!batchId) {
        console.warn("Log missing batch_id:", log)
        return acc
      }

      if (!acc[batchId]) {
        acc[batchId] = {
          defects: [],
          byType: {},
          startTime: log.timestamp,
          endTime: log.timestamp,
          batch_id: batchId,
          batch_number: log.batch_number || "Loading...", // Will be updated with batch data
        }
      }

      acc[batchId].defects.push(log)
      acc[batchId].byType[log.defect_type] = (acc[batchId].byType[log.defect_type] || 0) + 1

      // Update start and end times
      const logTime = new Date(log.timestamp).getTime()
      const startTime = new Date(acc[batchId].startTime).getTime()
      const endTime = new Date(acc[batchId].endTime).getTime()

      if (logTime < startTime) {
        acc[batchId].startTime = log.timestamp
      }
      if (logTime > endTime) {
        acc[batchId].endTime = log.timestamp
      }

      return acc
    }, {})

    console.log("Processed batch stats:", stats)

    // Sort batch list by most recent first
    const sortedBatches = Object.keys(stats).sort((a, b) => {
      return new Date(stats[b].endTime).getTime() - new Date(stats[a].endTime).getTime()
    })

    console.log("Sorted batches:", sortedBatches)

    return {
      batchStats: stats,
      batchList: sortedBatches,
    }
  }, [defectLogs, timePeriod])

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

  // Fetch defect logs
  const fetchData = useCallback(async () => {
    if (!machineId) {
      console.log("Machine ID not available yet, waiting...")
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log(`Fetching batch review data for machine ID: ${machineId}`)

      // Update query to filter by machine_id
      const q = query(collection(db, "defect_logs"), where("machine_id", "==", machineId), orderBy("timestamp", "desc"))

      const snapshot = await getDocs(q)

      console.log(`Fetched ${snapshot.size} documents for machine ${machineId}`)

      const logs = snapshot.docs.map((doc) => {
        const data = doc.data()

        // Handle different timestamp formats
        let timestamp = data.timestamp
        if (timestamp?.toDate) {
          // Firestore Timestamp
          timestamp = timestamp.toDate()
        } else if (typeof timestamp === "string") {
          // ISO string
          timestamp = new Date(timestamp)
        } else if (typeof timestamp === "number") {
          // Unix timestamp
          timestamp = new Date(timestamp)
        }

        return {
          id: doc.id,
          ...data,
          timestamp: timestamp,
          batch_id: data.batch_id, // Make sure we capture batch_id
        }
      })

      console.log(`Processed ${logs.length} logs for machine ${machineId}`)
      setDefectLogs(logs)
    } catch (err) {
      console.error("Error fetching defect logs:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [machineId])

  // Add this effect to fetch batch information
  useEffect(() => {
    const fetchBatchInfo = async () => {
      if (!batchList.length) return

      const batchesToFetch = batchList.filter(
        (batchId) => !batchCache[batchId] || batchCache[batchId]?.batch_number === "Loading...",
      )

      if (batchesToFetch.length === 0) return

      console.log(`Fetching information for ${batchesToFetch.length} batches`)

      for (const batchId of batchesToFetch) {
        try {
          const batchRef = doc(db, "batches", batchId)
          const batchSnap = await getDoc(batchRef)

          if (batchSnap.exists()) {
            const batchData = batchSnap.data()
            setBatchCache((prev) => ({
              ...prev,
              [batchId]: {
                batch_number: batchData.batch_number || `Batch ${batchId.substring(0, 6)}`,
                ...batchData,
              },
            }))

            // Update the batch stats with the batch number
            batchStats[batchId].batch_number = batchData.batch_number || `Batch ${batchId.substring(0, 6)}`
          } else {
            console.log(`No batch found with ID: ${batchId}`)
            setBatchCache((prev) => ({
              ...prev,
              [batchId]: { batch_number: `Batch ${batchId.substring(0, 6)}` },
            }))

            // Update with a fallback batch number
            batchStats[batchId].batch_number = `Batch ${batchId.substring(0, 6)}`
          }
        } catch (err) {
          console.error(`Error fetching batch ${batchId}:`, err)
          setBatchCache((prev) => ({
            ...prev,
            [batchId]: { batch_number: `Batch ${batchId.substring(0, 6)}` },
          }))
        }
      }
    }

    fetchBatchInfo()
  }, [batchList, batchStats, batchCache])

  // Initial fetch
  useEffect(() => {
    if (machineId) {
      fetchData()
    }
  }, [fetchData, machineId])

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Error loading batch review</p>
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

  if (!batchList.length) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No batch data available</h3>
        <p className="mt-1 text-sm text-gray-500">Start inspecting items to see batch statistics</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
            <Package className="w-6 h-6" />
            Batch Review
          </h2>
          <p className="text-gray-500">Analyze defects by production batch</p>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh data">
          <RefreshCcw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Controls */}

      {/* Batch Summary Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-[#0e4772]">All Batches</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {batchList.map((batch) => (
            <BatchSummaryCard
              key={batch}
              batch={batch}
              stats={batchStats[batch]}
              onClick={() => setSelectedBatch(selectedBatch === batch ? null : batch)}
              isSelected={selectedBatch === batch}
            />
          ))}
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
            <div className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-[#0e4772]">Defect Distribution</h3>
                  <p className="text-sm text-gray-500">Breakdown of defect types</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Info className="w-4 h-4" />
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "pie" ? (
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
                  ) : (
                    <BarChart
                      data={selectedBatchDetails.chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{ fill: "#0e4772" }} />
                      <YAxis tick={{ fill: "#0e4772" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill={getDefectColor("default").base} radius={[4, 4, 0, 0]}>
                        {selectedBatchDetails.chartData.map((entry) => (
                          <Cell key={entry.name} fill={getDefectColor(entry.name).base} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
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

