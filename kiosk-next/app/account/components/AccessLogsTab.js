"use client"

import { useState, useEffect } from "react"
import { Loader2, Search, Download } from "lucide-react"

export default function AccessLogsTab() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [searchQuery, setSearchQuery] = useState("")

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
    // Simulate API call to fetch access logs
    const fetchLogs = async () => {
      try {
        // Simulated API response
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setLogs([
          {
            id: "1",
            timestamp: new Date().toISOString(),
            action: "login",
            user: "John Smith",
            status: "success",
            details: "Logged in successfully",
          },
          {
            id: "2",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            action: "pin_change",
            user: "John Smith",
            status: "success",
            details: "Changed PIN",
          },
          {
            id: "3",
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            action: "logout",
            user: "Jane Doe",
            status: "success",
            details: "Logged out",
          },
          {
            id: "4",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            action: "login",
            user: "Jane Doe",
            status: "failed",
            details: "Invalid PIN",
          },
        ])
      } catch (error) {
        console.error("Error fetching access logs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(
    (log) =>
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusColor = (status) => {
    return status === "success" ? "text-green-600" : "text-red-600"
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
      default:
        return "bg-gray-100 text-gray-800"
    }
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e5f97] focus:border-transparent"
          />
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatDateTime(log.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.user}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                    {log.action.replace("_", " ")}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${getStatusColor(log.status)}`}>{log.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

