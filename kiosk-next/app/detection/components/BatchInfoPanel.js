"use client"

import { useState, useEffect } from "react"
import { Clock, FileText, Tag, X, BarChart2, CheckCircle, AlertTriangle } from "lucide-react"

export default function BatchInfoPanel({ batch, onClose }) {
  const [animateIn, setAnimateIn] = useState(false)

  // Calculate percentages for the visualizations
  const totalEggs = batch.total_count || 0
  const defectPercentages = {}

  Object.entries(batch.defect_counts).forEach(([type, count]) => {
    defectPercentages[type] = totalEggs > 0 ? Math.round((count / totalEggs) * 100) : 0
  })

  // Define colors for different defect types
  const defectColors = {
    good: "#10b981", // green
    dirty: "#f59e0b", // amber
    broken: "#ef4444", // red
    cracked: "#f97316", // orange
  }

  // Animation effect
  useEffect(() => {
    setAnimateIn(true)
    return () => setAnimateIn(false)
  }, [])

  return (
    <div
      className={`mt-3 pt-3 border-t border-gray-100 transition-all duration-300 ${
        animateIn ? "opacity-100 transform translate-y-0" : "opacity-0 transform -translate-y-4"
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold text-[#0e5f97]">Batch Details</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close batch details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Batch Info Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <div className="flex items-center mb-1">
            <Tag className="w-5 h-5 text-blue-500 mr-1.5" />
            <span className="text-sm font-medium text-blue-700">Batch Number</span>
          </div>
          <p className="text-base font-semibold text-blue-900">{batch.batch_number}</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
          <div className="flex items-center mb-1">
            <Clock className="w-5 h-5 text-purple-500 mr-1.5" />
            <span className="text-sm font-medium text-purple-700">Created</span>
          </div>
          <p className="text-base font-semibold text-purple-900">{new Date(batch.created_at).toLocaleString()}</p>
        </div>
      </div>

      {/* Egg Count Summary */}
      <div className="bg-gradient-to-r from-[#0e5f97]/5 to-[#0e4772]/5 rounded-lg p-4 border border-[#0e5f97]/10 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <BarChart2 className="w-5 h-5 text-[#0e5f97] mr-2" />
            <span className="text-sm font-medium text-[#0e5f97]">Total Eggs</span>
          </div>
          <span className="text-xl font-bold text-[#0e5f97]">{batch.total_count}</span>
        </div>

        {/* Progress bars for each defect type */}
        <div className="space-y-3">
          {Object.entries(batch.defect_counts).map(([type, count]) => (
            <div key={type} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: defectColors[type] }}></div>
                  <span className="text-sm capitalize text-gray-700">{type}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">{count}</span>
                  <span className="text-sm text-gray-500 ml-1">({defectPercentages[type]}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${defectPercentages[type]}%`,
                    backgroundColor: defectColors[type],
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes (if available) */}
      {batch.notes && (
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 animate-fadeIn">
          <div className="flex items-center mb-2">
            <FileText className="w-5 h-5 text-amber-500 mr-2" />
            <span className="text-sm font-medium text-amber-700">Notes</span>
          </div>
          <p className="text-base text-amber-900">{batch.notes}</p>
        </div>
      )}

      {/* Status indicator */}
      <div className="mt-4 flex justify-center">
        <div
          className={`px-4 py-1.5 rounded-full flex items-center ${
            batch.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {batch.status === "active" ? (
            <CheckCircle className="w-4 h-4 mr-2" />
          ) : (
            <AlertTriangle className="w-4 h-4 mr-2" />
          )}
          <span className="text-sm font-medium capitalize">{batch.status} Batch</span>
        </div>
      </div>
    </div>
  )
}

