"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Wifi, WifiOff, Lock, Signal, RefreshCw, Eye, EyeOff, Check, X } from "lucide-react"
import { createWiFiAPI, type WiFiNetwork } from "../libs/wifi-api"

interface WiFiManagerProps {
  isOpen: boolean
  onClose: () => void
}

export default function WiFiManager({ isOpen, onClose }: WiFiManagerProps) {
  const [networks, setNetworks] = useState<WiFiNetwork[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<WiFiNetwork | null>(null)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connecting" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [mounted, setMounted] = useState(false)
  const [wifiAPI] = useState(() => createWiFiAPI())

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true)
  }, [])

  const scanNetworks = useCallback(async () => {
    setIsScanning(true)
    setErrorMessage("")

    try {
      console.log("=== Starting WiFi scan process ===")

      // Get current network first
      const currentNetwork = await wifiAPI.getCurrentNetwork()
      console.log("Current network from API:", currentNetwork)

      // Then scan for all networks
      const realNetworks = await wifiAPI.scanNetworks()
      console.log("Scanned networks:", realNetworks)

      // Create a map to track which networks are connected
      const networksWithStatus = realNetworks.map((network) => {
        let isConnected = false

        if (currentNetwork) {
          // Try multiple comparison methods
          const currentSSID = currentNetwork.ssid.trim().toLowerCase()
          const networkSSID = network.ssid.trim().toLowerCase()

          isConnected = currentSSID === networkSSID

          console.log(`Comparing "${currentSSID}" with "${networkSSID}": ${isConnected}`)
        }

        return {
          ...network,
          connected: isConnected,
        }
      })

      // If we have a current network but it's not in the scanned list, add it at the top
      if (currentNetwork) {
        const foundInList = networksWithStatus.some(
          (n) => n.ssid.trim().toLowerCase() === currentNetwork.ssid.trim().toLowerCase(),
        )

        if (!foundInList) {
          console.log("Current network not found in scan results, adding it:", currentNetwork)
          networksWithStatus.unshift({
            ...currentNetwork,
            connected: true,
          })
        }
      }

      // Sort by connection status first, then signal strength
      const sortedNetworks = networksWithStatus.sort((a, b) => {
        if (a.connected && !b.connected) return -1
        if (!a.connected && b.connected) return 1
        return b.signal - a.signal
      })

      console.log("=== Final network list ===")
      sortedNetworks.forEach((n, i) => {
        console.log(`${i + 1}. ${n.ssid} - Connected: ${n.connected} - Signal: ${n.signal}%`)
      })

      setNetworks(sortedNetworks)

      if (sortedNetworks.length === 0) {
        setErrorMessage("No WiFi networks found. Make sure WiFi is enabled and try again.")
      }
    } catch (error) {
      console.error("Network scan error:", error)
      const errorMsg = error instanceof Error ? error.message : "Failed to scan for networks"
      setErrorMessage(`${errorMsg}. Click refresh to try again.`)
      setNetworks([])
    } finally {
      setIsScanning(false)
    }
  }, [wifiAPI])

  const connectToNetwork = async (network: WiFiNetwork) => {
    if (network.security !== "open" && !password.trim()) {
      setErrorMessage("Password is required for secured networks")
      return
    }

    setIsConnecting(true)
    setConnectionStatus("connecting")
    setErrorMessage("")

    try {
      console.log(`Connecting to ${network.ssid}...`)
      const success = await wifiAPI.connectToNetwork(network.ssid, password)

      if (success) {
        // Update networks to show new connection
        setNetworks((prev) =>
          prev.map((n) => ({
            ...n,
            connected: n.ssid === network.ssid,
          })),
        )
        setConnectionStatus("success")
        setSelectedNetwork(null)
        setPassword("")

        // Refresh the network list to get updated connection status
        setTimeout(() => {
          scanNetworks()
        }, 2000)

        // Auto-close after successful connection
        setTimeout(() => {
          onClose()
        }, 3000)
      } else {
        throw new Error("Connection failed - please check your password")
      }
    } catch (error) {
      console.error("Connection error:", error)
      setConnectionStatus("error")
      const errorMsg = error instanceof Error ? error.message : "Connection failed"
      setErrorMessage(errorMsg)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectFromNetwork = async (network: WiFiNetwork) => {
    try {
      console.log(`Disconnecting from ${network.ssid}...`)
      const success = await wifiAPI.disconnectFromNetwork(network.ssid)

      if (success) {
        setNetworks((prev) =>
          prev.map((n) => ({
            ...n,
            connected: false,
          })),
        )

        // Refresh the network list to get updated connection status
        setTimeout(() => {
          scanNetworks()
        }, 2000)
      } else {
        throw new Error("Failed to disconnect")
      }
    } catch (error) {
      console.error("Disconnect error:", error)
      const errorMsg = error instanceof Error ? error.message : "Failed to disconnect"
      setErrorMessage(errorMsg)
    }
  }

  const getSignalIcon = (signal: number) => {
    if (signal >= 80) return "excellent"
    if (signal >= 60) return "good"
    if (signal >= 40) return "fair"
    return "poor"
  }

  const getSecurityIcon = (security: string) => {
    return security === "open" ? null : <Lock className="h-4 w-4" />
  }

  useEffect(() => {
    if (isOpen) {
      console.log("WiFiManager opened, scanning networks...")
      scanNetworks()
    }
  }, [isOpen, scanNetworks])

  useEffect(() => {
    if (connectionStatus === "success" || connectionStatus === "error") {
      const timer = setTimeout(() => {
        setConnectionStatus("idle")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [connectionStatus])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) {
    return null
  }

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(8px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
        style={{ maxHeight: "400px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wifi className="h-6 w-6" />
              <h2 className="text-xl font-semibold">WiFi Networks</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={scanNetworks}
                disabled={isScanning}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
                title="Refresh networks"
              >
                <RefreshCw className={`h-5 w-5 ${isScanning ? "animate-spin" : ""}`} />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-64 overflow-y-auto">
          {/* Connection Status */}
          {connectionStatus !== "idle" && (
            <div className="p-4 border-b border-gray-200">
              <div
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  connectionStatus === "connecting"
                    ? "bg-blue-50 text-blue-700"
                    : connectionStatus === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                }`}
              >
                {connectionStatus === "connecting" && (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Connecting to {selectedNetwork?.ssid}...</span>
                  </>
                )}
                {connectionStatus === "success" && (
                  <>
                    <Check className="h-5 w-5" />
                    <span>Successfully connected!</span>
                  </>
                )}
                {connectionStatus === "error" && (
                  <>
                    <X className="h-5 w-5" />
                    <span>{errorMessage || "Connection failed"}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && connectionStatus === "idle" && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 text-yellow-700">
                <X className="h-5 w-5" />
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Networks List */}
          <div className="p-4 space-y-2">
            {isScanning ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-gray-500">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Scanning for networks...</span>
                </div>
              </div>
            ) : networks.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-gray-500">
                  <WifiOff className="h-5 w-5" />
                  <span>No networks found</span>
                </div>
              </div>
            ) : (
              networks.map((network, index) => (
                <div
                  key={`${network.ssid}-${network.bssid || index}`}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    network.connected ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <Signal
                          className={`h-5 w-5 ${
                            getSignalIcon(network.signal) === "excellent"
                              ? "text-green-500"
                              : getSignalIcon(network.signal) === "good"
                                ? "text-blue-500"
                                : getSignalIcon(network.signal) === "fair"
                                  ? "text-yellow-500"
                                  : "text-red-500"
                          }`}
                        />
                        {network.connected && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${network.connected ? "text-green-800" : "text-gray-900"}`}>
                            {network.ssid}
                          </span>
                          {getSecurityIcon(network.security)}
                          {/* Debug info */}
                          <span className="text-xs text-gray-400">
                            (connected: {network.connected ? "true" : "false"})
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {network.security.toUpperCase()} • {Math.round(network.signal)}% signal
                          {network.connected && <span className="text-green-600 ml-2 font-medium">• Connected</span>}
                          {network.frequency && <span className="ml-2">• {network.frequency}MHz</span>}
                        </div>
                      </div>
                    </div>

                    <div>
                      {network.connected ? (
                        <button
                          onClick={() => disconnectFromNetwork(network)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedNetwork(network)}
                          disabled={isConnecting}
                          className="px-3 py-1 text-sm bg-[#0e5f97] text-white rounded-lg hover:bg-[#0c4d7a] transition-colors disabled:opacity-50"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Password Input Modal */}
        {selectedNetwork && selectedNetwork.security !== "open" && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password for "{selectedNetwork.ssid}"
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter network password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0e5f97] focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        connectToNetwork(selectedNetwork)
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedNetwork(null)
                    setPassword("")
                    setErrorMessage("")
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => connectToNetwork(selectedNetwork)}
                  disabled={isConnecting || !password.trim()}
                  className="flex-1 px-4 py-2 bg-[#0e5f97] text-white rounded-lg hover:bg-[#0c4d7a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Connect for Open Networks */}
        {selectedNetwork && selectedNetwork.security === "open" && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Connect to "{selectedNetwork.ssid}"? This is an open network.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedNetwork(null)}
                  className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => connectToNetwork(selectedNetwork)}
                  disabled={isConnecting}
                  className="px-3 py-1 text-sm bg-[#0e5f97] text-white rounded-lg hover:bg-[#0c4d7a] transition-colors disabled:opacity-50"
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body)
}
