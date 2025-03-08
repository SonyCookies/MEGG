"use client"

import { useState } from "react"
import { CheckCircle, Archive, ChevronDown, Plus } from "lucide-react"

export default function BatchSelector({ batches, selectedBatch, onSelectBatch, loading }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelectBatch = (batch) => {
    onSelectBatch(batch)
    setIsOpen(false)
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="h-10 bg-gray-100 rounded"></div>
      </div>
    )
  }

  // Group batches by status
  const activeBatches = batches.filter((batch) => batch.status === "active")
  const completedBatches = batches.filter((batch) => batch.status === "completed")
  const archivedBatches = batches.filter((batch) => batch.status !== "active" && batch.status !== "completed")

  // Calculate total eggs for each batch
  const getBatchEggCount = (batch) => {
    if (batch.total_count) return batch.total_count

    if (batch.size_counts) {
      return Object.values(batch.size_counts).reduce((sum, count) => sum + count, 0)
    }

    return 0
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-[#0e5f97] mb-4">Current Batch</h3>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 border rounded-lg hover:border-[#0e5f97] transition-colors"
        >
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                selectedBatch?.status === "active"
                  ? "bg-green-500"
                  : selectedBatch?.status === "completed"
                    ? "bg-blue-500"
                    : "bg-gray-500"
              }`}
            ></div>
            <span className="font-medium truncate">
              {selectedBatch ? selectedBatch.batch_number : "Select a batch"}
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-2 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {activeBatches.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" /> Active Batches
                </div>
                {activeBatches.map((batch) => (
                  <div
                    key={batch.id}
                    onClick={() => handleSelectBatch(batch)}
                    className={`p-2 rounded-lg cursor-pointer transition-all ${
                      selectedBatch?.id === batch.id
                        ? "bg-[#0e5f97]/10 border-[#0e5f97] border"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="font-medium">{batch.batch_number}</span>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        {getBatchEggCount(batch)} eggs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {completedBatches.length > 0 && (
              <div className="p-2 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                  <Archive className="w-3 h-3 mr-1" /> Completed
                </div>
                {completedBatches.slice(0, 3).map((batch) => (
                  <div
                    key={batch.id}
                    onClick={() => handleSelectBatch(batch)}
                    className={`p-2 rounded-lg cursor-pointer transition-all ${
                      selectedBatch?.id === batch.id
                        ? "bg-[#0e5f97]/10 border-[#0e5f97] border"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                        <span className="font-medium">{batch.batch_number}</span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {getBatchEggCount(batch)}
                      </span>
                    </div>
                  </div>
                ))}
                {completedBatches.length > 3 && (
                  <div className="text-xs text-center text-gray-500 mt-1">
                    +{completedBatches.length - 3} more completed batches
                  </div>
                )}
              </div>
            )}

            <div className="p-2 border-t border-gray-100">
              <button className="w-full py-2 flex items-center justify-center gap-2 bg-[#0e5f97]/10 text-[#0e5f97] rounded-lg hover:bg-[#0e5f97]/20 transition-colors">
                <Plus className="w-4 h-4" />
                <span>Create New Batch</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Batch Quick Stats */}
      {selectedBatch && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total Eggs:</span>
              <span className="font-medium">{getBatchEggCount(selectedBatch)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Status:</span>
              <span
                className={`font-medium ${
                  selectedBatch.status === "active"
                    ? "text-green-600"
                    : selectedBatch.status === "completed"
                      ? "text-blue-600"
                      : "text-gray-600"
                }`}
              >
                {selectedBatch.status || "Unknown"}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Created:</span>
              <span className="font-medium">
                {selectedBatch.created_at ? new Date(selectedBatch.created_at).toLocaleDateString() : "Unknown"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

