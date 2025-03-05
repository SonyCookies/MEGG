"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, RefreshCcw, LayoutDashboard, Package } from "lucide-react"

// Components
import BatchSelector from "./components/BatchSelector"
import BatchSummaryTab from "./components/BatchSummaryTab"
import InventoryTab from "./components/InventoryTab"

// Mock data
import { generateMockData, generateNewInventoryRecord } from "./mockData"

export default function InventoryDemoPage() {
  const router = useRouter()
  const [mockData, setMockData] = useState({ batches: [], inventoryRecords: [] })
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("summary") // "summary" or "inventory"
  const [recentUpdates, setRecentUpdates] = useState([])

  // Initialize with mock data
  useEffect(() => {
    const data = generateMockData(5, 50)
    setMockData(data)
    setSelectedBatch(data.batches[0])
    setLoading(false)
  }, [])

  // Simulate real-time updates
  useEffect(() => {
    if (!selectedBatch) return

    const interval = setInterval(() => {
      // 30% chance of generating a new record
      if (Math.random() < 0.3) {
        const newRecord = generateNewInventoryRecord(selectedBatch)

        // Update inventory records
        setMockData((prev) => ({
          ...prev,
          inventoryRecords: [newRecord, ...prev.inventoryRecords],
        }))

        // Update recent updates
        setRecentUpdates((prev) =>
          [
            {
              id: newRecord.id,
              timestamp: newRecord.timestamp,
              data: newRecord,
              type: "added",
            },
            ...prev,
          ].slice(0, 5),
        )

        // Update batch size counts
        setMockData((prev) => {
          const updatedBatches = prev.batches.map((batch) => {
            if (batch.id === selectedBatch.id) {
              const updatedSizeCounts = { ...batch.size_counts }
              updatedSizeCounts[newRecord.egg_size] = (updatedSizeCounts[newRecord.egg_size] || 0) + newRecord.count

              return {
                ...batch,
                size_counts: updatedSizeCounts,
                total_count: Object.values(updatedSizeCounts).reduce((sum, count) => sum + count, 0),
              }
            }
            return batch
          })

          return {
            ...prev,
            batches: updatedBatches,
          }
        })

        // Update selected batch if it's the one being modified
        if (selectedBatch.id === selectedBatch.id) {
          setSelectedBatch((prev) => {
            const updatedSizeCounts = { ...prev.size_counts }
            updatedSizeCounts[newRecord.egg_size] = (updatedSizeCounts[newRecord.egg_size] || 0) + newRecord.count

            return {
              ...prev,
              size_counts: updatedSizeCounts,
              total_count: Object.values(updatedSizeCounts).reduce((sum, count) => sum + count, 0),
            }
          })
        }
      }
    }, 5000) // Every 5 seconds

    return () => clearInterval(interval)
  }, [selectedBatch])

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch)
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 500)
  }

  // Filter inventory records for the selected batch
  const filteredRecords = mockData.inventoryRecords.filter(
    (record) => selectedBatch && record.batch_id === selectedBatch.id,
  )

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/home" className="text-[#0e5f97] hover:text-[#0e4772] transition-colors mr-4">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-[#0e5f97]">Egg Inventory (Demo)</h1>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            <RefreshCcw className={`w-5 h-5 text-[#0e5f97] ${loading ? "animate-spin" : ""}`} />
          </button>
        </header>

        {/* Batch Selector */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <BatchSelector
            batches={mockData.batches}
            selectedBatch={selectedBatch}
            onSelectBatch={handleBatchSelect}
            loading={loading}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === "summary"
                  ? "border-b-2 border-[#0e5f97] text-[#0e5f97]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Batch Summary
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === "inventory"
                  ? "border-b-2 border-[#0e5f97] text-[#0e5f97]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Package className="w-4 h-4" />
              Inventory
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "summary" ? (
          <BatchSummaryTab selectedBatch={selectedBatch} loading={loading} recentUpdates={recentUpdates} />
        ) : (
          <InventoryTab
            selectedBatch={selectedBatch}
            loading={loading}
            recentUpdates={recentUpdates}
            inventoryData={filteredRecords}
          />
        )}
      </div>
    </div>
  )
}

