// components/wifi-manager.tsx

"use client"

import React, {
  useState,
  useEffect,
  useCallback,
  memo,
  MouseEvent,
} from "react"
import dynamic from "next/dynamic"
import { createPortal } from "react-dom"
import { createWiFiAPI, type WiFiNetwork } from "../libs/wifi-api"

// Dynamically import Lucide icons
const Wifi       = dynamic(() => import("lucide-react").then((m) => m.Wifi))
const WifiOff    = dynamic(() => import("lucide-react").then((m) => m.WifiOff))
const Lock       = dynamic(() => import("lucide-react").then((m) => m.Lock))
const Signal     = dynamic(() => import("lucide-react").then((m) => m.Signal))
const RefreshCw  = dynamic(() => import("lucide-react").then((m) => m.RefreshCw))
const Eye        = dynamic(() => import("lucide-react").then((m) => m.Eye))
const EyeOff     = dynamic(() => import("lucide-react").then((m) => m.EyeOff))
const Check      = dynamic(() => import("lucide-react").then((m) => m.Check))
const X          = dynamic(() => import("lucide-react").then((m) => m.X))

interface WiFiManagerProps {
  isOpen: boolean
  onClose: () => void
}

export default function WiFiManager({ isOpen, onClose }: WiFiManagerProps) {
  const [networks, setNetworks] = useState<WiFiNetwork[]>([])
  const [scanning, setScanning] = useState(false)
  const [selected, setSelected] = useState<WiFiNetwork | null>(null)
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [status, setStatus] = useState<"idle"|"connecting"|"success"|"error">("idle")
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)
  const wifiAPI = React.useRef(createWiFiAPI()).current

  // Only mount portal after hydration
  useEffect(() => { setMounted(true) }, [])

  // Scan function
  const scan = useCallback(async () => {
    setScanning(true); setError("")
    try {
      const current = await wifiAPI.getCurrentNetwork()
      const list = (await wifiAPI.scanNetworks()).map(n => ({
        ...n,
        connected: current?.ssid.trim().toLowerCase() === n.ssid.trim().toLowerCase()
      }))
      if (current && !list.some(n => n.connected)) {
        list.unshift({ ...current, connected: true })
      }
      list.sort((a,b) => a.connected !== b.connected
        ? (a.connected ? -1 : 1)
        : b.signal - a.signal
      )
      setNetworks(list)
      if (!list.length) setError("No WiFi networks found.")
    } catch (err) {
      setError((err as Error).message || "Scan failed.")
      setNetworks([])
    } finally {
      setScanning(false)
    }
  }, [wifiAPI])

  // On open, scan
  useEffect(() => { if (isOpen) scan() }, [isOpen, scan])

  // ESC & scroll lock
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose()
    if (isOpen) {
      document.addEventListener("keydown", onKey)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  // Auto‐close / refresh on success or clear status on error
  useEffect(() => {
    if (status === "success") {
      const t1 = setTimeout(scan, 2000)
      const t2 = setTimeout(onClose, 3000)
      return () => { clearTimeout(t1); clearTimeout(t2); setStatus("idle") }
    }
    if (status === "error") {
      const t = setTimeout(() => setStatus("idle"), 3000)
      return () => clearTimeout(t)
    }
  }, [status, scan, onClose])

  // Connect/Disconnect handlers
  const handleConnect = useCallback(async (n: WiFiNetwork) => {
    if (n.security !== "open" && !password.trim()) {
      setError("Password is required."); return
    }
    setConnecting(true); setStatus("connecting"); setError("")
    try {
      const ok = await wifiAPI.connectToNetwork(n.ssid, password)
      if (!ok) throw new Error("Connection failed")
      setStatus("success"); setSelected(null); setPassword("")
    } catch (err) {
      setStatus("error"); setError((err as Error).message)
    } finally {
      setConnecting(false)
    }
  }, [password, wifiAPI])

  const handleDisconnect = useCallback(async (n: WiFiNetwork) => {
    try {
      const ok = await wifiAPI.disconnectFromNetwork(n.ssid)
      if (!ok) throw new Error("Disconnect failed")
      scan()
    } catch (err) {
      setError((err as Error).message)
    }
  }, [scan, wifiAPI])

  if (!mounted || !isOpen) return null

  const onBackdropClick = (e: MouseEvent) => {
    if (e.currentTarget === e.target) onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md z-50"
      onClick={onBackdropClick}
    >
      <div
        // Flex‐column container, full 90vh, so header & footer always visible
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        style={{ height: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Wifi className="h-6 w-6" />
            <h2 className="text-xl font-semibold">WiFi Networks</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={scan}
              disabled={scanning}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${scanning ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable status+list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Status / Error */}
          {(status !== "idle" || error) && (
            <div className="border-b border-gray-200 pb-2 mb-2">
              <div
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  status === "connecting"
                    ? "bg-blue-50 text-blue-700"
                    : status === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {status === "connecting" && <RefreshCw className="h-5 w-5 animate-spin" />}
                {status === "success"     && <Check className="h-5 w-5" />}
                {status === "error"       && <X className="h-5 w-5" />}
                <span>
                  {status === "connecting"
                    ? `Connecting…`
                    : status === "success"
                    ? "Successfully connected!"
                    : error}
                </span>
              </div>
            </div>
          )}

          {/* Network list */}
          {scanning ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Scanning for networks...
            </div>
          ) : networks.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <WifiOff className="h-5 w-5 mr-2" />
              No networks found
            </div>
          ) : (
            networks.map((n) => (
              <NetworkRow
                key={n.ssid + (n.bssid || "")}
                network={n}
                onSelect={() => setSelected(n)}
                onDisconnect={() => handleDisconnect(n)}
                isConnecting={connecting}
              />
            ))
          )}
        </div>

        {/* Footer: password prompt or quick‐connect */}
        {selected && selected.security !== "open" ? (
          <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Password for “{selected.ssid}”
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0e5f97]"
                onKeyDown={(e) => e.key === "Enter" && handleConnect(selected)}
                autoFocus
              />
              <button
                onClick={() => setShowPass((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                type="button"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelected(null); setPassword(""); setError("")
                }}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConnect(selected!)}
                disabled={connecting || !password.trim()}
                className="flex-1 px-4 py-2 bg-[#0e5f97] text-white rounded-lg hover:bg-[#0c4d7a] disabled:opacity-50"
              >
                {connecting ? "Connecting…" : "Connect"}
              </button>
            </div>
          </div>
        ) : selected ? (
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end gap-2">
            <button
              onClick={() => setSelected(null)}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => handleConnect(selected!)}
              disabled={connecting}
              className="px-4 py-2 bg-[#0e5f97] text-white rounded-lg hover:bg-[#0c4d7a] disabled:opacity-50"
            >
              {connecting ? "Connecting…" : "Connect"}
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  )
}

// Memoized network row
interface RowProps {
  network: WiFiNetwork
  onSelect: () => void
  onDisconnect: () => void
  isConnecting: boolean
}
const NetworkRow = memo(function NetworkRow({
  network,
  onSelect,
  onDisconnect,
  isConnecting,
}: RowProps) {
  const str = Math.round(network.signal)
  const color =
    str >= 80 ? "text-green-500" :
    str >= 60 ? "text-blue-500"  :
    str >= 40 ? "text-yellow-500": "text-red-500"

  return (
    <div
      className={`p-3 rounded-lg border flex items-center justify-between transition-all duration-200 ${
        network.connected
          ? "bg-green-50 border-green-200"
          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <Signal className={`h-5 w-5 ${color}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${network.connected?"text-green-800":"text-gray-900"}`}>
              {network.ssid}
            </span>
            {network.security !== "open" && <Lock className="h-4 w-4" />}
          </div>
          <div className="text-sm text-gray-500">
            {network.security.toUpperCase()} · {str}% signal
            {network.connected && (
              <span className="text-green-600 ml-2 font-medium">• Connected</span>
            )}
          </div>
        </div>
      </div>
      {network.connected ? (
        <button
          onClick={onDisconnect}
          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={onSelect}
          disabled={isConnecting}
          className="px-3 py-1 text-sm bg-[#0e5f97] text-white rounded-lg hover:bg-[#0c4d7a] transition-colors disabled:opacity-50"
        >
          Connect
        </button>
      )}
    </div>
  )
})
