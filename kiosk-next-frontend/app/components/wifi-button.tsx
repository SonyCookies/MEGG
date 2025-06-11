"use client"

import type React from "react"

import { useState } from "react"
import { Wifi, WifiOff } from "lucide-react"
import WiFiManager from "./wifi-manager"
import { useInternetConnection } from "../contexts/NetworkContext"

export default function WiFiButton() {
  const [isWiFiManagerOpen, setIsWiFiManagerOpen] = useState(false)
  const isOnline = useInternetConnection()

  const handleWiFiClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("WiFi button clicked, opening manager")
    setIsWiFiManagerOpen(true)
  }

  return (
    <>
      <button
        onClick={handleWiFiClick}
        className="flex items-center gap-2 px-3 py-2 bg-white/90 rounded-lg shadow-md border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-200 backdrop-blur-sm"
        title="Manage WiFi Connections"
        style={{
          zIndex: 100,
          pointerEvents: "auto",
        }}
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#0e5f97]/10 to-[#0e5f97]/5">
          {isOnline ? <Wifi className="h-4 w-4 text-[#0e5f97]" /> : <WifiOff className="h-4 w-4 text-red-500" />}
        </div>
        <span className="text-sm font-medium text-gray-700">WiFi</span>
      </button>

      <WiFiManager
        isOpen={isWiFiManagerOpen}
        onClose={() => {
          console.log("Closing WiFi manager")
          setIsWiFiManagerOpen(false)
        }}
      />
    </>
  )
}
