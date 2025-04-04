"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Sliders,
  Weight,
  WrenchIcon,
  QrCode,
  Wifi,
  Camera,
  Gauge,
  Sun,
  RefreshCw,
  RotateCcw,
} from "lucide-react"
import { useInternetConnection } from "../contexts/InternetConnectionContext"
import { useWebSocket } from "../contexts/WebSocketContext"
import { ConnectionStatus } from "../components/ConnectionStatus"

// Import all tab components
import GeneralSettingsTab from "./components/GeneralSettingsTab"
import EggConfigTab from "./components/EggConfigTab"
import MaintenanceTab from "./components/MaintenanceTab"
import MachineIdTab from "./components/MachineIdTab"
import NetworkConfigTab from "./components/NetworkConfigTab"
import CameraCalibrationTab from "./components/CameraCalibrationTab"
import SortingSpeedTab from "./components/SortingSpeedTab"
import IlluminationTab from "./components/IlluminationTab"
import ModelUpdateTab from "./components/ModelUpdateTab"
import ResetTab from "./components/ResetTab"

export default function MachineSettings() {
  const [activeTab, setActiveTab] = useState("general")
  const [sortingSpeed, setSortingSpeed] = useState(50)
  const [eggSizes, setEggSizes] = useState({
    small: 50,
    medium: 60,
    large: 70,
    xl: 80,
    jumbo: 90,
  })

  const isOnline = useInternetConnection()
  const { readyState } = useWebSocket()

  const handleEggSizeChange = (size, value) => {
    setEggSizes((prev) => ({ ...prev, [size]: value }))
  }

  const handleSaveSettings = () => {
    // Save settings to database or local storage
    console.log("Saving settings:", { sortingSpeed, eggSizes })
    // Show success message
    alert("Settings saved successfully!")
  }

  const tabs = [
    { id: "general", label: "General", icon: Sliders },
    { id: "egg-config", label: "Egg Sizes", icon: Weight },
    { id: "maintenance", label: "Maintenance", icon: WrenchIcon },
    { id: "machine-id", label: "Machine ID", icon: QrCode },
    { id: "network", label: "Network", icon: Wifi },
    { id: "camera", label: "Camera", icon: Camera },
    { id: "sorting-speed", label: "Sorting Speed", icon: Gauge },
    { id: "illumination", label: "Illumination", icon: Sun },
    { id: "model-update", label: "Model Update", icon: RefreshCw },
    { id: "reset", label: "Reset", icon: RotateCcw },
  ]

  // Update the handleSpeedChange function to only be used in the SortingSpeedTab
  const handleSpeedChange = (value) => {
    setSortingSpeed(value)
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/home" className="text-[#0e5f97] hover:text-[#0e4772] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-[#0e5f97]">Machine Settings</h1>
          <div className="w-6 h-6" /> {/* Placeholder for symmetry */}
        </header>

        <ConnectionStatus isOnline={isOnline} readyState={readyState} />

        <div className="mt-6">
          <div className="space-y-4">
            {/* Tabs Navigation - Scrollable for many tabs */}
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2" role="tablist">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={activeTab === id}
                  aria-controls={`${id}-tab`}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap
                    ${activeTab === id ? "bg-[#0e5f97] text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab Content - Single card for all content */}
            <div className="bg-white rounded-xl shadow-md p-6">
              {/* Remove the sortingSpeed prop from GeneralSettingsTab */}
              {activeTab === "general" && <GeneralSettingsTab />}
              {activeTab === "egg-config" && <EggConfigTab eggSizes={eggSizes} onEggSizeChange={handleEggSizeChange} />}
              {activeTab === "maintenance" && <MaintenanceTab />}
              {activeTab === "machine-id" && <MachineIdTab />}
              {activeTab === "network" && <NetworkConfigTab />}
              {activeTab === "camera" && <CameraCalibrationTab />}
              {activeTab === "sorting-speed" && (
                <SortingSpeedTab sortingSpeed={sortingSpeed} onSpeedChange={handleSpeedChange} />
              )}
              {activeTab === "illumination" && <IlluminationTab />}
              {activeTab === "model-update" && <ModelUpdateTab />}
              {activeTab === "reset" && <ResetTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

