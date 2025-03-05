"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, RefreshCcw, LayoutDashboard, Package } from "lucide-react"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "../firebaseConfig"

// Components
import BatchSelector from "./components/BatchSelector"
import BatchSummaryTab from "./components/BatchSummaryTab"
import InventoryTab from "./components/InventoryTab"

export default function InventoryPage() {
  const router = useRouter()
  const [machineId, setMachineId] = useState(null)
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("summary") // "summary" or "inventory"
  const [recentUpdates, setRecentUpdates] = useState([])

  // Fetch machine ID from session
  useEffect(() => {
    const fetchMachineId = async () => {
      try {
        const response = await fetch("/api/auth/session")
        if (response.ok) {
          const data = await response.json()
          if (data.machineId) {
            setMachineId(data.machineId)
          } else {
            setError("Machine ID not found in session")
          }
        } else {
          setError("Failed to fetch session data")
        }
      } catch (err) {
        console.error("Error fetching machine ID:", err)
        setError("Error fetching machine ID")
      }
    }

    fetchMachineId()
  }, [])

  // Fetch batches when machineId is available
  useEffect(() => {
    if (!machineId) return

    setLoading(true)

    const batchesQuery = query(
      collection(db, "batches"),
      where("machine_id", "==", machineId),
      orderBy("created_at", "desc"),
    )

    const unsubscribe = onSnapshot(
      batchesQuery,
      (snapshot) => {
        const batchList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setBatches(batchList)

        // Select the most recent active batch by default
        if (!selectedBatch && batchList.length > 0) {
          const activeBatch = batchList.find((batch) => batch.status === "active")
          setSelectedBatch(activeBatch || batchList[0])
        }

        setLoading(false)
      },
      (err) => {
        console.error("Error fetching batches:", err)
        setError("Error fetching batches")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [machineId, selectedBatch])

  // Subscribe to egg inventory updates for the selected batch
  useEffect(() => {
    if (!selectedBatch) return

    const inventoryQuery = query(
      collection(db, "egg_inventory"),
      where("batch_id", "==", selectedBatch.id),
      orderBy("timestamp", "desc"),
    )

    const unsubscribe = onSnapshot(
      inventoryQuery,
      (snapshot) => {
        // Track recent updates for animation
        if (snapshot.docChanges().length > 0) {
          const newUpdates = snapshot
            .docChanges()
            .filter((change) => change.type === "added" || change.type === "modified")
            .map((change) => ({
              id: change.doc.id,
              timestamp: new Date().toISOString(),
              data: change.doc.data(),
              type: change.type,
            }))

          if (newUpdates.length > 0) {
            setRecentUpdates((prev) => [...newUpdates, ...prev].slice(0, 5))

            // Update batch with new egg counts
            if (selectedBatch) {
              const latestUpdate = newUpdates[0].data
              if (latestUpdate && latestUpdate.size_counts) {
                setSelectedBatch((prev) => ({
                  ...prev,
                  size_counts: latestUpdate.size_counts,
                  total_count: Object.values(latestUpdate.size_counts).reduce((sum, count) => sum + count, 0),
                }))
              }
            }
          }
        }
      },
      (err) => {
        console.error("Error fetching egg inventory:", err)
        setError("Error fetching egg inventory")
      },
    )

    return () => unsubscribe()
  }, [selectedBatch])

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch)
  }

  const handleRefresh = () => {
    // The real-time listeners will automatically refresh the data
    // This is just a visual indicator for the user
    setLoading(true)
    setTimeout(() => setLoading(false), 500)
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/home" className="text-[#0e5f97] hover:text-[#0e4772] transition-colors mr-4">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-[#0e5f97]">Egg Inventory</h1>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            <RefreshCcw className={`w-5 h-5 text-[#0e5f97] ${loading ? "animate-spin" : ""}`} />
          </button>
        </header>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
        ) : (
          <>
            {/* Batch Selector */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <BatchSelector
                batches={batches}
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
              <InventoryTab selectedBatch={selectedBatch} loading={loading} recentUpdates={recentUpdates} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

