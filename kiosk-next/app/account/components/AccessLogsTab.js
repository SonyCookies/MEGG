"use client"

import { useState, useEffect, useCallback } from "react"
import { History, Shield, AlertCircle, Filter, ChevronDown, Download, X } from "lucide-react"
import { collection, query, where, orderBy, limit, getDocs, startAfter } from "firebase/firestore"
import { db } from "../../firebaseConfig"

const ACTION_TYPES = [
  { value: "all", label: "All Actions" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "pin_change", label: "PIN Change" },
  { value: "pin_verify", label: "PIN Verify" },
  { value: "machine_update", label: "Machine Update" },
  { value: "machine_lock", label: "Machine Lock" },
  { value: "machine_unlink", label: "Machine Unlink" },
]

const STATUS_TYPES = [
  { value: "all", label: "All Statuses" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "error", label: "Error" },
  { value: "pending", label: "Pending" },
  { value: "locked", label: "Locked" },
]

const SORT_OPTIONS = [
  { value: "desc", label: "Newest First" },
  { value: "asc", label: "Oldest First" },
]

export default function AccessLogsTab() {
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [logs, setLogs] = useState([])
  const [error, setError] = useState("")
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [machineId, setMachineId] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  // Unified filter state (removed search)
  const [filters, setFilters] = useState({
    status: "all",
    action: "all",
    sortOrder: "desc",
  })

  const LOGS_PER_PAGE = 10

  // Format date for display
  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  }

  const fetchLogs = useCallback(
    async (lastDoc = null) => {
      try {
        if (!lastDoc) {
          setLoading(true)
          setLogs([]) // Clear existing logs when applying new filters
        } else {
          setLoadingMore(true)
        }
        setError("")

        let currentMachineId = machineId

        // Get machineId from session if not already stored
        if (!currentMachineId) {
          const sessionResponse = await fetch("/api/auth/session")
          const sessionData = await sessionResponse.json()

          if (!sessionResponse.ok) {
            throw new Error(sessionData.error || "Failed to verify session")
          }

          if (!sessionData.machineId) {
            throw new Error("Machine ID not found in session")
          }

          currentMachineId = sessionData.machineId
          setMachineId(currentMachineId)
        }

        // Build base query
        const logsRef = collection(db, "access_logs")
        const queryConstraints = [where("machineId", "==", currentMachineId), orderBy("timestamp", filters.sortOrder)]

        // Add status filter
        if (filters.status !== "all") {
          queryConstraints.push(where("status", "==", filters.status))
        }

        // Add action filter
        if (filters.action !== "all") {
          queryConstraints.push(where("action", "==", filters.action))
        }

        // Add pagination
        queryConstraints.push(limit(LOGS_PER_PAGE))
        if (lastDoc) {
          queryConstraints.push(startAfter(lastDoc))
        }

        const q = query(logsRef, ...queryConstraints)
        const snapshot = await getDocs(q)

        // Check if there are more logs to load
        setHasMore(snapshot.docs.length === LOGS_PER_PAGE)

        // Store the last visible document for next pagination
        setLastVisible(snapshot.docs[snapshot.docs.length - 1])

        const fetchedLogs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Append or set logs based on whether we're loading more
        setLogs((prevLogs) => (lastDoc ? [...prevLogs, ...fetchedLogs] : fetchedLogs))
      } catch (error) {
        console.error("Error fetching access logs:", error)
        setError(error.message || "Failed to load access logs")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [machineId, filters],
  )

  // Fetch logs when filters change
  useEffect(() => {
    fetchLogs()
    // Reset pagination when filters change
    setLastVisible(null)
    setHasMore(true)
  }, [fetchLogs])

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchLogs(lastVisible)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleResetFilters = () => {
    setFilters({
      status: "all",
      action: "all",
      sortOrder: "desc",
    })
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    alert("Export functionality not implemented yet.")
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "sortOrder") return false // Don't count sort order as a filter
    return value !== "all"
  }).length

  // Helper functions remain the same...
  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "border-green-500 text-green-500"
      case "failed":
        return "border-red-500 text-red-500"
      case "error":
        return "border-red-500 text-red-500"
      case "pending":
        return "border-yellow-500 text-yellow-500"
      case "locked":
        return "border-orange-500 text-orange-500"
      default:
        return "border-gray-500 text-gray-500"
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case "login":
        return "bg-green-50 text-green-700"
      case "logout":
        return "bg-red-50 text-red-700"
      case "pin_change":
        return "bg-teal-50 text-teal-700"
      case "pin_verify":
        return "bg-indigo-50 text-indigo-700"
      case "machine_update":
        return "bg-yellow-50 text-yellow-700"
      case "machine_lock":
        return "bg-gray-50 text-gray-700"
      case "machine_unlink":
        return "bg-red-200 text-red-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  const getActionIcon = (action) => {
    return <Shield className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
              <History className="w-6 h-6" />
              Access Logs
            </h2>
            <p className="text-gray-500">View machine access and security events</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex justify-end">
          <div className="flex gap-2">
            <div className="h-10 w-24 animate-shimmer rounded-lg" />
            <div className="h-10 w-24 animate-shimmer rounded-lg" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <div className="h-4 w-32 animate-shimmer rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-24 animate-shimmer rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-20 animate-shimmer rounded-lg" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-full animate-shimmer rounded" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p className="text-lg font-medium">Error Loading Logs</p>
        </div>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
            <History className="w-6 h-6" />
            Access Logs
          </h2>
          <p className="text-gray-500">View machine access and security events</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 relative"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#0e5f97] text-white text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50"
            >
              Reset
            </button>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0e5f97]"
              >
                {STATUS_TYPES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              {filters.status !== "all" && (
                <button
                  onClick={() => handleFilterChange("status", "all")}
                  className="text-xs text-[#0e5f97] mt-1 hover:underline"
                >
                  Clear status filter
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0e5f97]"
              >
                {ACTION_TYPES.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
              {filters.action !== "all" && (
                <button
                  onClick={() => handleFilterChange("action", "all")}
                  className="text-xs text-[#0e5f97] mt-1 hover:underline"
                >
                  Clear action filter
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0e5f97]"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {filters.status !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#0e5f97]/10 text-[#0e5f97] text-sm">
                Status: {STATUS_TYPES.find((s) => s.value === filters.status)?.label}
                <button onClick={() => handleFilterChange("status", "all")} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.action !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#0e5f97]/10 text-[#0e5f97] text-sm">
                Action: {ACTION_TYPES.find((a) => a.value === filters.action)?.label}
                <button onClick={() => handleFilterChange("action", "all")} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No logs found matching your criteria
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(
                          log.action,
                        )}`}
                      >
                        {getActionIcon(log.action)}
                        {log.action.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(log.status)}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
        {hasMore && logs.length > 0 && (
          <div className="px-6 py-4 border-t">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#0e5f97] bg-white border border-[#0e5f97] rounded-lg hover:bg-[#0e5f97]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? <div className="h-4 w-24 animate-shimmer rounded" /> : "See More"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

