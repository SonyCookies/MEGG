"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, KeyRound, QrCode, History, Settings } from "lucide-react"
import { ConnectionStatus } from "../components/ConnectionStatus"
import MachineDetailsTab from "./components/MachineDetailsTab"
import PinAuthTab from "./components/PinAuthTab"
import AccessLogsTab from "./components/AccessLogsTab"
import SecuritySettingsTab from "./components/SecuritySettingsTab"

const tabs = [
  { id: "machine", label: "Machine Details", icon: QrCode },
  { id: "security", label: "PIN Authentication", icon: KeyRound },
  { id: "logs", label: "Access Logs", icon: History },
  { id: "settings", label: "Security Settings", icon: Settings },
]

export default function Account() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("machine")
  const [machineId, setMachineId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [readyState, setReadyState] = useState(1)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    const checkAuth = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/auth/session")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Session invalid")
        }

        // console.log("Session data:", data)
        setMachineId(data.machineId)
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [router])

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Logout failed")
      }

      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
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
              {activeTab === "machine" && <MachineDetailsTab machineId={machineId} />}
              {activeTab === "security" && <PinAuthTab machineId={machineId} />}
              {activeTab === "logs" && <AccessLogsTab machineId={machineId} />}
              {activeTab === "settings" && <SecuritySettingsTab machineId={machineId} onLogout={handleLogout} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

