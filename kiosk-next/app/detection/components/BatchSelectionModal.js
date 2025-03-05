"use client"

import { useState } from "react"
import { Clock, Plus, CheckCircle, Archive, BarChart2, Layers } from "lucide-react"

export default function BatchSelectionModal({
  isOpen,
  batches,
  onCreateBatch,
  onSelectBatch,
  isLoading,
  currentBatch,
}) {
  const [selectedBatchId, setSelectedBatchId] = useState("")
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("select") // "select" or "create"

  const handleCreateBatch = () => {
    console.log("Creating new batch")
    // Notes are no longer required, so we pass an empty string
    onCreateBatch("")
  }

  const handleSelectBatch = () => {
    if (!selectedBatchId) {
      setError("Please select a batch")
      return
    }
    setError("")
    console.log("Selecting batch with ID:", selectedBatchId)
    onSelectBatch(selectedBatchId)
    setSelectedBatchId("")
  }

  // Group batches by status
  const activeBatches = batches.filter((batch) => batch.status === "active")
  const completedBatches = batches.filter((batch) => batch.status === "completed")
  const archivedBatches = batches.filter((batch) => batch.status !== "active" && batch.status !== "completed")

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "completed":
        return <Archive className="w-4 h-4 text-blue-500" />
      default:
        return <Archive className="w-4 h-4 text-gray-500" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0e5f97]/90 to-[#0e4772]/90 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#0e5f97] mb-2">Batch Selection</h2>
          <div className="w-16 h-1 bg-[#0e5f97] mx-auto rounded-full"></div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
        )}

        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0e5f97] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading batches...</p>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("select")}
                className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${
                  activeTab === "select"
                    ? "bg-white shadow-sm text-[#0e5f97] font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Select Batch</span>
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${
                  activeTab === "create"
                    ? "bg-white shadow-sm text-[#0e5f97] font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>New Batch</span>
              </button>
            </div>

            {/* Create New Batch Tab */}
            {activeTab === "create" && (
              <div className="animate-fadeIn">
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-5 text-center">
                  <div className="w-16 h-16 bg-[#0e5f97]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-[#0e5f97]" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Create New Batch</h3>
                  <p className="text-gray-600 mb-4">Start a fresh batch for your egg detection process</p>
                  <button
                    onClick={handleCreateBatch}
                    className="w-full bg-[#0e5f97] text-white py-3 rounded-lg hover:bg-[#0e4772] transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create New Batch</span>
                  </button>
                </div>
              </div>
            )}

            {/* Select Batch Tab */}
            {activeTab === "select" && (
              <div className="animate-fadeIn">
                {batches.length > 0 ? (
                  <div className="space-y-4">
                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                      {activeBatches.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" /> Active Batches
                          </h4>
                          {activeBatches.map((batch) => (
                            <div
                              key={batch.id}
                              onClick={() => setSelectedBatchId(batch.id)}
                              className={`p-3 rounded-lg border mb-2 cursor-pointer transition-all ${
                                selectedBatchId === batch.id
                                  ? "border-[#0e5f97] bg-[#0e5f97]/5 shadow-sm"
                                  : "border-gray-200 hover:border-gray-300 bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full bg-green-500 mr-2`}></div>
                                  <span className="font-medium">{batch.batch_number}</span>
                                </div>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  Active
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(batch.created_at).toLocaleString()}
                              </div>
                              <div className="mt-2 flex items-center text-xs">
                                <BarChart2 className="w-3 h-3 mr-1 text-[#0e5f97]" />
                                <span className="text-gray-700">
                                  Total: <b>{batch.total_count}</b>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {completedBatches.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                            <Archive className="w-3 h-3 mr-1" /> Completed Batches
                          </h4>
                          {completedBatches.map((batch) => (
                            <div
                              key={batch.id}
                              onClick={() => setSelectedBatchId(batch.id)}
                              className={`p-3 rounded-lg border mb-2 cursor-pointer transition-all ${
                                selectedBatchId === batch.id
                                  ? "border-[#0e5f97] bg-[#0e5f97]/5 shadow-sm"
                                  : "border-gray-200 hover:border-gray-300 bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full bg-blue-500 mr-2`}></div>
                                  <span className="font-medium">{batch.batch_number}</span>
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  Completed
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(batch.created_at).toLocaleString()}
                              </div>
                              <div className="mt-2 flex items-center text-xs">
                                <BarChart2 className="w-3 h-3 mr-1 text-[#0e5f97]" />
                                <span className="text-gray-700">
                                  Total: <b>{batch.total_count}</b>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {archivedBatches.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                            <Archive className="w-3 h-3 mr-1" /> Archived Batches
                          </h4>
                          {archivedBatches.map((batch) => (
                            <div
                              key={batch.id}
                              onClick={() => setSelectedBatchId(batch.id)}
                              className={`p-3 rounded-lg border mb-2 cursor-pointer transition-all ${
                                selectedBatchId === batch.id
                                  ? "border-[#0e5f97] bg-[#0e5f97]/5 shadow-sm"
                                  : "border-gray-200 hover:border-gray-300 bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full bg-gray-500 mr-2`}></div>
                                  <span className="font-medium">{batch.batch_number}</span>
                                </div>
                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                  {batch.status || "Archived"}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(batch.created_at).toLocaleString()}
                              </div>
                              <div className="mt-2 flex items-center text-xs">
                                <BarChart2 className="w-3 h-3 mr-1 text-[#0e5f97]" />
                                <span className="text-gray-700">
                                  Total: <b>{batch.total_count}</b>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSelectBatch}
                      disabled={!selectedBatchId}
                      className={`w-full py-3 rounded-lg transition-colors ${
                        selectedBatchId
                          ? "bg-[#0e5f97] text-white hover:bg-[#0e4772]"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Continue with Selected Batch
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Layers className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Batches Available</h3>
                    <p className="text-gray-500 mb-4">Create a new batch to get started</p>
                    <button
                      onClick={() => setActiveTab("create")}
                      className="px-4 py-2 bg-[#0e5f97] text-white rounded-lg hover:bg-[#0e4772] transition-colors"
                    >
                      Create New Batch
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

