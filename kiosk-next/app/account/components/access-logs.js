"use client"

import { useState } from "react"
import { Calendar, Clock, User } from "lucide-react"

export function AccessLogs({ logs = [] }) {
  const [filter, setFilter] = useState("all")

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true
    return log.type === filter
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-full text-sm ${
            filter === "all" ? "bg-[#0e5f97] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("login")}
          className={`px-3 py-1 rounded-full text-sm ${
            filter === "login" ? "bg-[#0e5f97] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setFilter("logout")}
          className={`px-3 py-1 rounded-full text-sm ${
            filter === "logout" ? "bg-[#0e5f97] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Logout
        </button>
      </div>

      <div className="space-y-2">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-2 rounded-full ${
                  log.type === "login" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}
              >
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium">{log.action}</p>
                <p className="text-sm text-gray-500">{log.user}</p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(log.timestamp).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredLogs.length === 0 && <div className="text-center py-8 text-gray-500">No access logs found</div>}
      </div>
    </div>
  )
}

