"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, KeyRound, QrCode, History, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useInternetConnection } from "../contexts/InternetConnectionContext"
import { useWebSocket } from "../contexts/WebSocketContext"
import { ConnectionStatus } from "../components/ConnectionStatus"
import PinAuthTab from "./components/PinAuthTab"
import MachineDetailsTab from "./components/MachineDetailsTab"
import AccessLogsTab from "./components/AccessLogsTab"
import SecuritySettingsTab from "./components/SecuritySettingsTab"
import { PinAuthModal } from "./components/PinAuthModal"

export default function Account() {
  const router = useRouter()
  const isOnline = useInternetConnection()
  const { readyState } = useWebSocket()
  const [activeTab, setActiveTab] = useState("machine")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPinModal, setShowPinModal] = useState(true)

  // Tabs configuration
  const tabs = [
    { id: "machine", label: "Machine Details", icon: QrCode },
    { id: "security", label: "Security", icon: KeyRound },
    { id: "logs", label: "Access Logs", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  // Handle successful PIN authentication
  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
    setShowPinModal(false)
  }

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    setShowPinModal(true)
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link href="/home" className="text-[#0e5f97] hover:text-[#0e4772] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-[#0e5f97]">Account Management</h1>
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
              {activeTab === "machine" && <MachineDetailsTab />}
              {activeTab === "security" && <PinAuthTab />}
              {activeTab === "logs" && <AccessLogsTab />}
              {activeTab === "settings" && <SecuritySettingsTab onLogout={handleLogout} />}
            </div>
          </div>
        </div>
      </div>

      {showPinModal && <PinAuthModal onClose={() => {}} onSuccess={handleAuthSuccess} canClose={false} />}
    </div>
  )
}

