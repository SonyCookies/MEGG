"use client"

import { useState, useEffect } from "react"
import { Loader2, Search, Download, History, Filter, ArrowUpDown, ChevronDown, Shield, AlertCircle } from "lucide-react"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "../../firebaseConfig"

export default function AccessLogsTab() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterAction, setFilterAction] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [sortOrder, setSortOrder] = useState("desc")

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

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        const machineId = localStorage.getItem("machineId")
        if (!machineId) {
          throw new Error("Machine ID not found")
        }

        const logsRef = collection(db, "access_logs")
        const q = query(
          logsRef,
          orderBy("timestamp", "desc"),
          limit(100), // Limit to last 100 logs
        )

        const snapshot = await getDocs(q)
        const fetchedLogs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setLogs(fetchedLogs)
      } catch (error) {
        console.error("Error fetching access logs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-50 border-green-200"
      case "failed":
        return "text-red-600 bg-red-50 border-red-200"
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case "login":
        return "bg-green-100 text-green-800"
      case "logout":
        return "bg-blue-100 text-blue-800"
      case "pin_change":
        return "bg-yellow-100 text-yellow-800"
      case "lock":
        return "bg-red-100 text-red-800"
      case "machine_update":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getActionIcon = (action) => {
    switch (action) {
      case "login":
      case "logout":
        return <Shield className="w-4 h-4" />
      case "pin_change":
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const filteredLogs = logs
    .filter((log) => {
      const matchesSearch =
        log.user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = filterStatus === "all" || log.status === filterStatus
      const matchesAction = filterAction === "all" || log.action === filterAction

      return matchesSearch && matchesStatus && matchesAction
    })
    .sort((a, b) => {
      const dateA = new Date(a.timestamp)
      const dateB = new Date(b.timestamp)
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })

  const handleExport = () => {
    const csvContent = [
      ["Timestamp", "User", "Action", "Status", "Details"],
      ...filteredLogs.map((log) => [
        formatDateTime(log.timestamp),
        log.user || "System",
        log.action,
        log.status,
        log.details,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `access-logs-${new Date().toISOString()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0e5f97]" />
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

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e5f97] focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0e5f97]"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0e5f97]"
              >
                <option value="all">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="pin_change">PIN Change</option>
                <option value="lock">Lock</option>
                <option value="machine_update">Machine Update</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <button
                onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
              >
                <span className="text-sm">{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
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
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No logs found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}
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
      </div>
    </div>
  )
}

