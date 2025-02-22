"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, ImageIcon, PieChart, List, Package } from "lucide-react"
import { db } from "../firebaseConfig"
import { collection, query, orderBy, limit, startAfter, getDocs, onSnapshot } from "firebase/firestore"
import { useInternetConnection } from "../contexts/InternetConnectionContext"
import { useWebSocket } from "../contexts/WebSocketContext"
import { ConnectionStatus } from "../components/ConnectionStatus"
import LogsTab from "./components/LogsTab"
import ImagesTab from "./components/ImagesTab"
import StatisticsTab from "./components/StatisticsTab"
import DailySummaryTab from "./components/DailySummaryTab"
import BatchReviewTab from "./components/BatchReviewTab"

export default function DefectHistory() {
  const isOnline = useInternetConnection()
  const { readyState } = useWebSocket()
  const [activeTab, setActiveTab] = useState("log")
  const [error, setError] = useState(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  // Initial data load
  useEffect(() => {
    if (initialLoadComplete) return

    // Load defect logs
    const unsubscribeLogs = onSnapshot(
      query(collection(db, "defect_logs"), orderBy("timestamp", "desc")),
      (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setInitialLoadComplete(true)
      },
      (error) => {
        console.error("Error in real-time updates:", error)
        setError(error.message)
      },
    )

    return () => {
      unsubscribeLogs()
    }
  }, [initialLoadComplete])

  const tabs = [
    { id: "log", label: "Defect Log", icon: List },
    { id: "images", label: "Images", icon: ImageIcon },
    { id: "statistics", label: "Statistics", icon: PieChart },
    { id: "daily", label: "Daily Summary", icon: Calendar },
    { id: "batch", label: "Batch Review", icon: Package },
  ]

  if (error) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] p-4 flex items-center justify-center">
        <div className="text-red-500">Error loading data: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link href="/home" className="text-[#0e5f97] hover:text-[#0e4772] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-[#0e5f97]">Defect History</h1>
          <div className="w-6 h-6" />
        </header>

        <ConnectionStatus isOnline={isOnline} readyState={readyState} />

        <div className="mt-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2" role="tablist">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={activeTab === id}
                  aria-controls={`${id}-tab`}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${activeTab === id ? "bg-[#0e5f97] text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              {activeTab === "log" && <LogsTab />}

              {activeTab === "images" && <ImagesTab />}

              {activeTab === "statistics" && <StatisticsTab />}

              {activeTab === "daily" && <DailySummaryTab />}

              {activeTab === "batch" && <BatchReviewTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

