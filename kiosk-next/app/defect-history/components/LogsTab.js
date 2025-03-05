"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Clock,
  Package2,
  AlertTriangle,
  Target,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  History,
  RefreshCcw,
  ChevronDown,
} from "lucide-react"
import { collection, query, where, orderBy, limit, startAfter, getDocs, getCountFromServer } from "firebase/firestore"
import { db } from "../../firebaseConfig"
// import { addAccessLog } from "../../utils/logging"

// Constants
const ITEMS_PER_PAGE = 10

// Utility function for defect badge colors
const getDefectStyle = (type) => {
  switch (type.toLowerCase()) {
    case "good":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        badge: "bg-emerald-500",
        icon: "✓",
      }
    case "dirty":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        badge: "bg-amber-500",
        icon: "!",
      }
    case "cracked":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        badge: "bg-red-500",
        icon: "⚠",
      }
    case "bloodspots":
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        badge: "bg-rose-500",
        icon: "⚠",
      }
    default:
      return {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
        badge: "bg-gray-500",
        icon: "?",
      }
  }
}

export default function LogsTab() {
  // State
  const [machineId, setMachineId] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [success, setSuccess] = useState("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMore, setHasMore] = useState(true)

  // Update state to handle multiple filters
  const [filters, setFilters] = useState({
    defectType: "all",
    date: "",
    batchNumber: "",
    sortBy: "newest",
  })

  // Fetch session data to get machineId
  useEffect(() => {
    const fetchSession = async () => {
      try {
        // First verify session
        const sessionResponse = await fetch("/api/auth/session")
        const sessionData = await sessionResponse.json()

        if (!sessionResponse.ok) {
          throw new Error(sessionData.error || "Session invalid")
        }

        if (!sessionData.machineId) {
          throw new Error("Machine ID not found in session")
        }

        setMachineId(sessionData.machineId)
        console.log("Machine ID set:", sessionData.machineId)
      } catch (err) {
        console.error("Error fetching session:", err)
        setError("Failed to authenticate session: " + err.message)
      }
    }

    fetchSession()
  }, [])

  // Fetch total count
  useEffect(() => {
    const fetchTotalCount = async () => {
      if (!machineId) return

      try {
        const logsRef = collection(db, "defect_logs")
        // Add where clause to filter by machine_id
        const q = query(logsRef, where("machine_id", "==", machineId))
        const snapshot = await getCountFromServer(q)
        setTotalItems(snapshot.data().count)
        console.log(`Found ${snapshot.data().count} logs for machine ${machineId}`)
      } catch (err) {
        console.error("Error fetching total count:", err)
        setError("Failed to count logs: " + err.message)
      }
    }

    if (machineId) {
      fetchTotalCount()
    }
  }, [machineId])

  // Fetch logs
  const fetchLogs = useCallback(
    async (pageNumber, lastDoc = null) => {
      if (!machineId) {
        setError("No machine ID found")
        return
      }

      try {
        setLoading(true)
        setError(null)
        console.log("Fetching logs for page:", pageNumber, "for machine:", machineId)

        const logsRef = collection(db, "defect_logs")
        let q

        if (lastDoc && pageNumber > 1) {
          q = query(
            logsRef,
            where("machine_id", "==", machineId),
            orderBy("timestamp", "desc"),
            startAfter(lastDoc),
            limit(ITEMS_PER_PAGE),
          )
        } else {
          q = query(logsRef, where("machine_id", "==", machineId), orderBy("timestamp", "desc"), limit(ITEMS_PER_PAGE))
        }

        const querySnapshot = await getDocs(q)
        const fetchedLogs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Update last visible document for next pagination
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]
        setLastVisible(lastVisible)

        // Check if we have more pages
        setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE)

        setLogs(fetchedLogs)
        console.log(`Fetched ${fetchedLogs.length} logs for machine ${machineId}`)

        // Log successful fetch
        // await addAccessLog(
        //   {
        //     action: "view_logs",
        //     status: "success",
        //     details: `Fetched ${fetchedLogs.length} logs`,
        //   },
        //   machineId,
        // )

        setSuccess("Logs loaded successfully")
      } catch (err) {
        console.error("Error fetching logs:", err)
        setError("Failed to load logs: " + err.message)

        // Log error
        // await addAccessLog(
        //   {
        //     action: "view_logs",
        //     status: "error",
        //     details: "Failed to fetch logs",
        //     error: err.message,
        //   },
        //   machineId,
        // )
      } finally {
        setLoading(false)
      }
    },
    [machineId],
  )

  // Initial fetch
  useEffect(() => {
    if (machineId) {
      fetchLogs(1)
    }
  }, [fetchLogs, machineId])

  // Handle page changes
  const handlePageChange = async (newPage) => {
    if (newPage < 1 || (newPage > currentPage && !hasMore)) return

    setCurrentPage(newPage)
    if (newPage === 1) {
      fetchLogs(1)
    } else {
      fetchLogs(newPage, lastVisible)
    }
  }

  // Update the filteredLogs logic to use all filters
  const filteredLogs = logs
    .filter((log) => {
      const matchesSearch =
        searchQuery === "" ||
        log.batch_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.defect_type.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType =
        filters.defectType === "all" || log.defect_type.toLowerCase() === filters.defectType.toLowerCase()

      const matchesDate = !filters.date || new Date(log.timestamp).toISOString().split("T")[0] === filters.date

      const matchesBatch = !filters.batchNumber || log.batch_number === filters.batchNumber

      return matchesSearch && matchesType && matchesDate && matchesBatch
    })
    .sort((a, b) => {
      if (filters.sortBy === "newest") {
        return new Date(b.timestamp) - new Date(a.timestamp)
      }
      return new Date(a.timestamp) - new Date(b.timestamp)
    })

  // Export to CSV
  const handleExport = async () => {
    if (!machineId) {
      setError("No machine ID found")
      return
    }

    try {
      const csvContent = [
        ["Timestamp", "Batch Number", "Defect Type", "Confidence Score"],
        ...filteredLogs.map((log) => [
          new Date(log.timestamp).toLocaleString(),
          log.batch_number,
          log.defect_type,
          (log.confidence_score * 100).toFixed(1) + "%",
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `defect-logs-${new Date().toISOString()}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Log export
      // await addAccessLog(
      //   {
      //     action: "export_logs",
      //     status: "success",
      //     details: `Exported ${filteredLogs.length} logs`,
      //   },
      //   machineId,
      // )

      setSuccess("Logs exported successfully")
    } catch (err) {
      console.error("Error exporting logs:", err)
      setError("Failed to export logs")

      // Log error
      // await addAccessLog(
      //   {
      //     action: "export_logs",
      //     status: "error",
      //     details: "Failed to export logs",
      //     error: err.message,
      //   },
      //   machineId,
      // )
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
            <History className="w-6 h-6" />
            Defect Logs
          </h2>
          <p className="text-gray-500">View and analyze inspection results</p>
        </div>
        <button
          onClick={() => fetchLogs(currentPage)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh logs"
        >
          <RefreshCcw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by batch number or defect type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e5f97]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Defect Type</label>
              <select
                value={filters.defectType}
                onChange={(e) => setFilters((prev) => ({ ...prev, defectType: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Types</option>
                <option value="good">Good</option>
                <option value="dirty">Dirty</option>
                <option value="cracked">Cracked</option>
                <option value="bloodspots">Bloodspots</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
              <select
                value={filters.batchNumber}
                onChange={(e) => setFilters((prev) => ({ ...prev, batchNumber: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Batches</option>
                {[...new Set(logs.map((log) => log.batch_number))].map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Clock className="w-4 h-4" />
                    Timestamp
                  </div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Package2 className="w-4 h-4" />
                    Batch Number
                  </div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <AlertTriangle className="w-4 h-4" />
                    Defect Type
                  </div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Target className="w-4 h-4" />
                    Confidence
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 border-2 border-[#0e5f97] border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-500">Loading logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No logs found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const style = getDefectStyle(log.defect_type)
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 text-xs font-medium">
                          {log.batch_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium capitalize
                            ${style.bg} ${style.text} ${style.border}`}
                        >
                          <span>{style.icon}</span>
                          {log.defect_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${log.confidence_score * 100}%`,
                                backgroundColor:
                                  log.defect_type.toLowerCase() === "good"
                                    ? "#10b981"
                                    : log.confidence_score >= 0.9
                                      ? "#10b981"
                                      : log.confidence_score >= 0.7
                                        ? "#f59e0b"
                                        : "#ef4444",
                              }}
                            />
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              log.defect_type.toLowerCase() === "good"
                                ? "text-emerald-600"
                                : log.confidence_score >= 0.9
                                  ? "text-emerald-600"
                                  : log.confidence_score >= 0.7
                                    ? "text-amber-600"
                                    : "text-red-600"
                            }`}
                          >
                            {(log.confidence_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-gray-500">
          Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)}-
          {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} entries
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className={`p-2 rounded-lg border transition-colors
              ${
                currentPage === 1 || loading
                  ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, Math.ceil(totalItems / ITEMS_PER_PAGE)) }, (_, i) => {
              const pageNumber = i + 1
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={loading}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors
                    ${currentPage === pageNumber ? "bg-[#0e5f97] text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {pageNumber}
                </button>
              )
            })}
            {totalItems / ITEMS_PER_PAGE > 5 && <span className="px-2">...</span>}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasMore || loading}
            className={`p-2 rounded-lg border transition-colors
              ${
                !hasMore || loading
                  ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

