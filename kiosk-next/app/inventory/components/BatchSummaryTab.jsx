"use client"

import { useState, useEffect } from "react"
import { BarChart3, Clock, ArrowUpRight, ArrowDownRight, Calendar, Users, Package } from "lucide-react"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "../../firebaseConfig"

export default function BatchSummaryTab({ selectedBatch, loading, recentUpdates }) {
  const [batchHistory, setBatchHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Fetch batch history for comparison
  useEffect(() => {
    if (!selectedBatch) return

    const fetchBatchHistory = async () => {
      setLoadingHistory(true)
      try {
        const historyQuery = query(
          collection(db, "batches"),
          where("machine_id", "==", selectedBatch.machine_id),
          where("status", "==", "completed"),
          orderBy("created_at", "desc"),
          limit(5),
        )

        const snapshot = await getDocs(historyQuery)
        const history = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setBatchHistory(history)
      } catch (err) {
        console.error("Error fetching batch history:", err)
      } finally {
        setLoadingHistory(false)
      }
    }

    fetchBatchHistory()
  }, [selectedBatch])

  if (!selectedBatch) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 gap-4">
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  // Calculate average counts from history
  const calculateAverages = () => {
    if (batchHistory.length === 0) return null

    const totalCounts = batchHistory.reduce(
      (acc, batch) => {
        // Sum up size counts
        if (batch.size_counts) {
          Object.entries(batch.size_counts).forEach(([size, count]) => {
            acc.sizes[size] = (acc.sizes[size] || 0) + count
          })
        }

        // Sum up total count
        acc.total += batch.total_count || 0

        return acc
      },
      { sizes: {}, total: 0 },
    )

    // Calculate averages
    const averages = {
      sizes: {},
      total: totalCounts.total / batchHistory.length,
    }

    Object.entries(totalCounts.sizes).forEach(([size, count]) => {
      averages.sizes[size] = count / batchHistory.length
    })

    return averages
  }

  const averages = calculateAverages()

  // Calculate trends compared to average
  const calculateTrend = (current, average) => {
    if (!average) return null

    const diff = current - average
    const percentage = average > 0 ? (diff / average) * 100 : 0

    return {
      value: `${Math.abs(percentage).toFixed(1)}%`,
      direction: percentage >= 0 ? "up" : "down",
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  // Calculate total eggs
  const totalEggs =
    selectedBatch.total_count ||
    (selectedBatch.size_counts ? Object.values(selectedBatch.size_counts).reduce((sum, count) => sum + count, 0) : 0)

  // Calculate trends
  const totalTrend = averages ? calculateTrend(totalEggs, averages.total) : null

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#0e5f97] flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Batch Summary: {selectedBatch.batch_number}
          </h2>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <StatCard icon={Package} label="Total Eggs" value={totalEggs} trend={totalTrend} color="blue" />

          <StatCard
            icon={Calendar}
            label="Created Date"
            value={formatDate(selectedBatch.created_at)}
            subtext={`Status: ${selectedBatch.status || "Unknown"}`}
            color="green"
          />

          <StatCard
            icon={Users}
            label="Machine ID"
            value={selectedBatch.machine_id || "Unknown"}
            subtext="Processing machine"
            color="purple"
          />
        </div>
      </div>

      {/* Size Distribution */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-[#0e5f97] mb-4">Egg Size Distribution</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {selectedBatch.size_counts ? (
            Object.entries(selectedBatch.size_counts).map(([size, count]) => {
              const sizeTrend = averages && averages.sizes[size] ? calculateTrend(count, averages.sizes[size]) : null

              return <SizeCard key={size} size={size} count={count} total={totalEggs} trend={sizeTrend} />
            })
          ) : (
            <div className="col-span-full text-center py-6 text-gray-500">No size data available for this batch</div>
          )}
        </div>
      </div>

      {/* Batch Notes */}
      {selectedBatch.notes && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-[#0e5f97] mb-2">Batch Notes</h3>
          <p className="text-gray-700">{selectedBatch.notes}</p>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, trend, subtext, color }) {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: "text-blue-500",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      icon: "text-green-500",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
      icon: "text-purple-500",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: "text-amber-500",
    },
  }

  const classes = colorClasses[color] || colorClasses.blue

  return (
    <div className={`${classes.bg} rounded-lg border ${classes.border} p-4`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className={`text-2xl font-bold ${classes.text} mt-1`}>{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-2 rounded-full ${classes.bg}`}>
          <Icon className={`w-5 h-5 ${classes.icon}`} />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center text-xs">
          {trend.direction === "up" ? (
            <ArrowUpRight className={`w-3 h-3 mr-1 ${trend.direction === "up" ? "text-green-500" : "text-red-500"}`} />
          ) : (
            <ArrowDownRight
              className={`w-3 h-3 mr-1 ${trend.direction === "up" ? "text-green-500" : "text-red-500"}`}
            />
          )}
          <span className={trend.direction === "up" ? "text-green-600" : "text-red-600"}>
            {trend.value} from average
          </span>
        </div>
      )}
    </div>
  )
}

function SizeCard({ size, count, total, trend }) {
  // Define colors and labels for different egg sizes
  const sizeConfig = {
    small: {
      label: "Small",
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    medium: {
      label: "Medium",
      color: "bg-green-500",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    large: {
      label: "Large",
      color: "bg-amber-500",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
    xlarge: {
      label: "Extra Large",
      color: "bg-purple-500",
      textColor: "text-purple-700",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    jumbo: {
      label: "Jumbo",
      color: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
  }

  // Default config for unknown sizes
  const config = sizeConfig[size.toLowerCase()] || {
    label: size,
    color: "bg-gray-500",
    textColor: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  }

  // Calculate percentage
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className={`font-medium ${config.textColor}`}>{config.label}</h4>
        <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${config.color}`}>
          {percentage.toFixed(1)}%
        </div>
      </div>

      <div className="text-2xl font-bold mb-2">{count}</div>

      <div className="w-full bg-white rounded-full h-2 mb-2">
        <div className={`h-2 rounded-full ${config.color}`} style={{ width: `${percentage}%` }}></div>
      </div>

      {trend && (
        <div className="flex items-center text-xs">
          {trend.direction === "up" ? (
            <ArrowUpRight className={`w-3 h-3 mr-1 ${trend.direction === "up" ? "text-green-500" : "text-red-500"}`} />
          ) : (
            <ArrowDownRight
              className={`w-3 h-3 mr-1 ${trend.direction === "up" ? "text-green-500" : "text-red-500"}`}
            />
          )}
          <span className={trend.direction === "up" ? "text-green-600" : "text-red-600"}>
            {trend.value} from average
          </span>
        </div>
      )}
    </div>
  )
}

