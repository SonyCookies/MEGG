"use client"

import { useState, useEffect } from "react"
import { Clock, Plus, CheckCircle, Archive, BarChart2, Layers, FileText, Tag } from "lucide-react"

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
  const [animateIn, setAnimateIn] = useState(false)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (isOpen) {
      setAnimateIn(true)
    } else {
      setAnimateIn(false)
    }
  }, [isOpen])

  const handleCreateBatch = () => {
    console.log("Creating new batch")
    // Notes are optional
    onCreateBatch(notes)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0e5f97]/90 to-[#0e4772]/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div
        className={`relative backdrop-blur-sm bg-white/95 rounded-2xl shadow-2xl overflow-hidden border border-white/50 w-full max-w-md transition-all duration-500 ${
          animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Holographic overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

        {/* Animated edge glow */}
        <div className="absolute inset-0 rounded-2xl">
          <div className="absolute inset-0 rounded-2xl animate-border-glow"></div>
        </div>

        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#0e5f97]/30 rounded-tl-2xl"></div>
        <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-[#0e5f97]/30 rounded-tr-2xl"></div>
        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-[#0e5f97]/30 rounded-bl-2xl"></div>
        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#0e5f97]/30 rounded-br-2xl"></div>

        <div className="relative z-10 p-5">
          {/* Compact header */}
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0e5f97]/20 to-[#0e5f97]/10 rounded-full flex items-center justify-center mr-3 border border-[#0e5f97]/20">
              <Layers className="w-5 h-5 text-[#0e5f97]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0e5f97]">Batch Selection</h2>
              <p className="text-xs text-gray-500">Select an existing batch or create a new one</p>
            </div>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-gradient-to-r from-red-50 to-red-50/70 border border-red-200 text-red-700 rounded-lg text-xs flex items-center animate-fadeIn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 mr-1.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-6 text-center">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-full border-3 border-[#0e5f97]/10"></div>
                <div className="absolute inset-0 rounded-full border-3 border-t-[#0e5f97] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              </div>
              <p className="mt-3 text-sm text-[#0e5f97]/70">Loading batches...</p>
            </div>
          ) : (
            <>
              {/* Tab Navigation - more compact */}
              <div className="flex mb-3 bg-gradient-to-r from-[#0e5f97]/5 to-[#0e5f97]/10 rounded-lg p-0.5 border border-[#0e5f97]/10">
                <button
                  onClick={() => setActiveTab("select")}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all text-sm ${
                    activeTab === "select"
                      ? "bg-white shadow-sm text-[#0e5f97] font-medium"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Select Batch</span>
                </button>
                <button
                  onClick={() => setActiveTab("create")}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all text-sm ${
                    activeTab === "create"
                      ? "bg-white shadow-sm text-[#0e5f97] font-medium"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Batch</span>
                </button>
              </div>

              {/* Create New Batch Tab - more compact */}
              {activeTab === "create" && (
                <div className="animate-fadeIn">
                  <div className="bg-gradient-to-r from-[#0e5f97]/5 to-white rounded-lg border border-[#0e5f97]/10 p-4 relative overflow-hidden">
                    {/* Subtle grid pattern */}
                    <div
                      className="absolute inset-0 opacity-5"
                      style={{
                        backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
                        backgroundSize: "15px 15px",
                      }}
                    ></div>

                    <div className="relative z-10">
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="flex items-center text-xs font-medium text-gray-700 gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#0e5f97]" />
                            Batch Notes (Optional)
                          </label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes about this batch..."
                            className="w-full px-3 py-2 border border-[#0e5f97]/20 bg-white/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e5f97] focus:border-[#0e5f97] text-sm shadow-sm transition-all duration-200 h-16 resize-none"
                          />
                        </div>

                        <button
                          onClick={handleCreateBatch}
                          className="w-full bg-gradient-to-r from-[#0e5f97] to-[#0e4772] text-white py-2 rounded-lg hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group text-sm"
                        >
                          {/* Button shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
                          <Plus className="w-4 h-4" />
                          <span>Create New Batch</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Select Batch Tab - more compact */}
              {activeTab === "select" && (
                <div className="animate-fadeIn">
                  {batches.length > 0 ? (
                    <div className="space-y-3">
                      <div className="max-h-[280px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {activeBatches.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-[#0e5f97] mb-1.5 flex items-center gap-1 pl-1">
                              <CheckCircle className="w-3 h-3" /> Active Batches
                            </h4>
                            {activeBatches.map((batch) => (
                              <div
                                key={batch.id}
                                onClick={() => setSelectedBatchId(batch.id)}
                                className={`p-2 rounded-lg border mb-1.5 cursor-pointer transition-all relative overflow-hidden ${
                                  selectedBatchId === batch.id
                                    ? "border-[#0e5f97] bg-gradient-to-r from-[#0e5f97]/10 to-[#0e5f97]/5 shadow-md"
                                    : "border-gray-200 hover:border-[#0e5f97]/30 bg-white"
                                }`}
                              >
                                {/* Highlight effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0e5f97]/0 via-[#0e5f97]/5 to-[#0e5f97]/0 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>

                                <div className="relative z-10">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                                        <Tag className="w-3 h-3 text-green-600" />
                                      </div>
                                      <span className="font-medium text-sm text-gray-800">
                                        Batch {batch.batch_number}
                                      </span>
                                    </div>
                                    <span className="text-[10px] bg-gradient-to-r from-green-100 to-green-50 text-green-800 px-1.5 py-0.5 rounded-full border border-green-200">
                                      Active
                                    </span>
                                  </div>
                                  <div className="mt-1 flex justify-between items-center">
                                    <div className="text-[10px] text-gray-500 flex items-center">
                                      <Clock className="w-2.5 h-2.5 mr-1" />
                                      {new Date(batch.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center text-[10px]">
                                      <BarChart2 className="w-2.5 h-2.5 mr-1 text-[#0e5f97]" />
                                      <span className="text-gray-700">
                                        <b>{batch.total_count}</b> eggs
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {completedBatches.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-[#0e5f97] mb-1.5 flex items-center gap-1 pl-1">
                              <Archive className="w-3 h-3" /> Completed Batches
                            </h4>
                            {completedBatches.map((batch) => (
                              <div
                                key={batch.id}
                                onClick={() => setSelectedBatchId(batch.id)}
                                className={`p-2 rounded-lg border mb-1.5 cursor-pointer transition-all relative overflow-hidden ${
                                  selectedBatchId === batch.id
                                    ? "border-[#0e5f97] bg-gradient-to-r from-[#0e5f97]/10 to-[#0e5f97]/5 shadow-md"
                                    : "border-gray-200 hover:border-[#0e5f97]/30 bg-white"
                                }`}
                              >
                                {/* Highlight effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0e5f97]/0 via-[#0e5f97]/5 to-[#0e5f97]/0 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>

                                <div className="relative z-10">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                                        <Tag className="w-3 h-3 text-blue-600" />
                                      </div>
                                      <span className="font-medium text-sm text-gray-800">
                                        Batch {batch.batch_number}
                                      </span>
                                    </div>
                                    <span className="text-[10px] bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 px-1.5 py-0.5 rounded-full border border-blue-200">
                                      Completed
                                    </span>
                                  </div>
                                  <div className="mt-1 flex justify-between items-center">
                                    <div className="text-[10px] text-gray-500 flex items-center">
                                      <Clock className="w-2.5 h-2.5 mr-1" />
                                      {new Date(batch.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center text-[10px]">
                                      <BarChart2 className="w-2.5 h-2.5 mr-1 text-[#0e5f97]" />
                                      <span className="text-gray-700">
                                        <b>{batch.total_count}</b> eggs
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {archivedBatches.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-[#0e5f97] mb-1.5 flex items-center gap-1 pl-1">
                              <Archive className="w-3 h-3" /> Archived Batches
                            </h4>
                            {archivedBatches.map((batch) => (
                              <div
                                key={batch.id}
                                onClick={() => setSelectedBatchId(batch.id)}
                                className={`p-2 rounded-lg border mb-1.5 cursor-pointer transition-all relative overflow-hidden ${
                                  selectedBatchId === batch.id
                                    ? "border-[#0e5f97] bg-gradient-to-r from-[#0e5f97]/10 to-[#0e5f97]/5 shadow-md"
                                    : "border-gray-200 hover:border-[#0e5f97]/30 bg-white"
                                }`}
                              >
                                {/* Highlight effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0e5f97]/0 via-[#0e5f97]/5 to-[#0e5f97]/0 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>

                                <div className="relative z-10">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                        <Tag className="w-3 h-3 text-gray-600" />
                                      </div>
                                      <span className="font-medium text-sm text-gray-800">
                                        Batch {batch.batch_number}
                                      </span>
                                    </div>
                                    <span className="text-[10px] bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 px-1.5 py-0.5 rounded-full border border-gray-200">
                                      {batch.status || "Archived"}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex justify-between items-center">
                                    <div className="text-[10px] text-gray-500 flex items-center">
                                      <Clock className="w-2.5 h-2.5 mr-1" />
                                      {new Date(batch.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center text-[10px]">
                                      <BarChart2 className="w-2.5 h-2.5 mr-1 text-[#0e5f97]" />
                                      <span className="text-gray-700">
                                        <b>{batch.total_count}</b> eggs
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleSelectBatch}
                        disabled={!selectedBatchId}
                        className={`w-full py-2 rounded-lg transition-all duration-300 text-sm ${
                          selectedBatchId
                            ? "bg-gradient-to-r from-[#0e5f97] to-[#0e4772] text-white hover:shadow-md relative overflow-hidden group"
                            : "bg-gradient-to-r from-gray-200 to-gray-100 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {selectedBatchId && (
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
                        )}
                        <span className="relative z-10 font-medium">Continue with Selected Batch</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-5 bg-gradient-to-r from-[#0e5f97]/5 to-white rounded-lg border border-[#0e5f97]/10 relative overflow-hidden">
                      {/* Subtle grid pattern */}
                      <div
                        className="absolute inset-0 opacity-5"
                        style={{
                          backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
                          backgroundSize: "15px 15px",
                        }}
                      ></div>

                      <div className="relative z-10">
                        <div className="w-12 h-12 bg-[#0e5f97]/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#0e5f97]/20">
                          <Layers className="w-6 h-6 text-[#0e5f97]/60" />
                        </div>
                        <h3 className="text-base font-medium text-[#0e5f97] mb-1">No Batches Available</h3>
                        <p className="text-xs text-gray-500 mb-3">Create a new batch to get started</p>
                        <button
                          onClick={() => setActiveTab("create")}
                          className="px-3 py-1.5 bg-gradient-to-r from-[#0e5f97] to-[#0e4772] text-white rounded-lg hover:shadow-md transition-all duration-300 relative overflow-hidden group text-sm"
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
                          <span className="relative z-10 flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5" />
                            Create New Batch
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
