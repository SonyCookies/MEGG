"use client"

import { useEffect, useState, useRef } from "react"
import { Egg, LogIn, Settings, Wifi, WifiOff, AlertTriangle } from "lucide-react"

interface EggLoadingProps {
  isLoading: boolean
  onComplete?: () => void
  context?: {
    title: string
    icon: string | null
    destination?: string
  }
}

export default function EggLoading({ isLoading, onComplete, context }: EggLoadingProps) {
  const [progress, setProgress] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<"fast" | "slow" | "offline">("fast")
  const [message, setMessage] = useState("Loading...")
  const startTimeRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxLoadingTimeRef = useRef<NodeJS.Timeout | null>(null)

  // Reset state when loading starts and ensure it always completes
  useEffect(() => {
    if (isLoading) {
      // console.log("🔄 Loading started - Initializing component")
      startTimeRef.current = Date.now()
      setProgress(0)
      setMessage("Loading...")

      // Safety mechanism: ensure loading always completes after a maximum time
      // console.log("⏱️ Setting max loading timeout (10s)")
      maxLoadingTimeRef.current = setTimeout(() => {
        // console.log("⚠️ Max loading time reached - Forcing completion")
        if (onComplete) onComplete()
      }, 10000) // 10 seconds maximum loading time

      // Quick connection check
      checkConnection()
    } else {
      // console.log("🛑 Loading stopped - Cleaning up timeouts")
      // Clear any pending timeouts when not loading
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (maxLoadingTimeRef.current) clearTimeout(maxLoadingTimeRef.current)
    }

    return () => {
      // console.log("🧹 Cleanup function called")
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (maxLoadingTimeRef.current) clearTimeout(maxLoadingTimeRef.current)
    }
  }, [isLoading, onComplete])

  // Simple connection check
  const checkConnection = () => {
    // console.log("🌐 Checking connection status")

    // Check if browser is online
    if (!navigator.onLine) {
      // console.log("❌ Browser reports offline")
      setConnectionStatus("offline")
      setMessage("You appear to be offline. Trying anyway...")
      return
    }

    // console.log("✅ Browser reports online")

    // Try to detect connection speed with a simple timeout
    const connectionCheckTimeout = setTimeout(() => {
      // console.log("🐢 Connection seems slow")
      setConnectionStatus("slow")
      setMessage("Connection seems slow. Please wait...")
    }, 1000)

    // Clear the timeout if we determine it's fast
    setTimeout(() => {
      // console.log("🚀 Connection seems fast")
      clearTimeout(connectionCheckTimeout)
    }, 800)
  }

  // Progress animation effect
  useEffect(() => {
    if (!isLoading) return

    // console.log("⏳ Starting progress animation")
    let interval: NodeJS.Timeout

    if (isLoading && progress < 100) {
      // Adjust speed based on connection status
      const speed = connectionStatus === "fast" ? 30 : connectionStatus === "slow" ? 15 : 10
      // console.log(`🕒 Progress animation speed: ${speed}ms per tick (${connectionStatus} connection)`)

      interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 1

          // Log every 10% progress
          // if (newProgress % 10 === 0) {
          //   console.log(`📊 Progress: ${newProgress}%`)
          // }

          // Update messages based on progress
          if (newProgress === 25) {
            // console.log("💬 Progress message update: Preparing resources...")
            setMessage("Preparing resources...")
          } else if (newProgress === 50) {
            // console.log("💬 Progress message update: Loading interface...")
            setMessage("Loading interface...")
          } else if (newProgress === 75) {
            // console.log("💬 Progress message update: Almost ready...")
            setMessage("Almost ready...")
          } else if (newProgress >= 100) {
            // console.log("✅ Progress complete: Ready!")
            setMessage("Ready!")
            clearInterval(interval)
            if (onComplete) {
              const delay = connectionStatus === "fast" ? 300 : 500
              // console.log(`🏁 Setting completion timeout with ${delay}ms delay`)
              timeoutRef.current = setTimeout(() => {
                // console.log("🎉 Calling onComplete callback")
                onComplete()
              }, delay)
            }
          }

          return newProgress >= 100 ? 100 : newProgress
        })
      }, speed)
    }

    return () => {
      if (interval) {
        // console.log("🧹 Clearing progress interval")
        clearInterval(interval)
      }
    }
  }, [isLoading, progress, connectionStatus, onComplete])

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      // console.log("🌐 Browser went online")
      setConnectionStatus("fast")
      setMessage("Connection restored. Continuing...")
    }

    const handleOffline = () => {
      // console.log("🌐 Browser went offline")
      setConnectionStatus("offline")
      setMessage("Connection lost. Waiting for network...")
    }

    // console.log("👂 Adding online/offline event listeners")
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      // console.log("🧹 Removing online/offline event listeners")
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isLoading) return null

  const renderIcon = () => {
    // Show connection status icons during early loading
    if (progress < 20) {
      if (connectionStatus === "offline") return <WifiOff className="h-16 w-16 text-red-500" />
      if (connectionStatus === "slow") return <Wifi className="h-16 w-16 text-yellow-500" />
      return <Wifi className="h-16 w-16 text-[#0e5f97]" />
    }

    // Show warning icon if taking too long
    if (progress > 50 && Date.now() - (startTimeRef.current || Date.now()) > 8000) {
      return <AlertTriangle className="h-16 w-16 text-yellow-500" />
    }

    // Otherwise show context-specific icon
    if (context?.icon === "login") {
      return <LogIn className="h-16 w-16 text-[#0e5f97]" />
    } else if (context?.icon === "setup") {
      return <Settings className="h-16 w-16 text-[#0e5f97]" />
    } else {
      return <Egg className="h-16 w-16 text-[#0e5f97]" />
    }
  }

  const title = context?.title || "Loading"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center">
      <div className="bg-white/90 rounded-2xl p-8 mt-16 max-w-sm w-full shadow-xl border border-white/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

        {/* Progress bar */}
        <div className="h-2 w-full bg-gray-200 rounded-full mb-6 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${
              connectionStatus === "offline"
                ? "bg-red-500 animate-pulse"
                : connectionStatus === "slow"
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                  : "bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a]"
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Icon animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className={`absolute inset-0 rounded-full ${
                connectionStatus === "offline" ? "animate-ping opacity-50" : "animate-ping-slow opacity-70"
              }`}
              style={{ animationDuration: connectionStatus === "slow" ? "2s" : "1.5s" }}
            ></div>

            <div className="bg-gradient-to-br from-white to-[#f0f7ff] p-5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] shadow-lg border border-white/50 relative">
              <div
                className={`transform transition-transform duration-300 ${
                  connectionStatus === "offline" ? "" : progress % 20 < 10 ? "rotate-[-5deg]" : "rotate-[5deg]"
                }`}
              >
                {renderIcon()}
              </div>

              {/* Slow connection indicator */}
              {connectionStatus === "slow" && (
                <div className="absolute top-1/4 left-1/2 w-[8px] h-[8px] bg-yellow-500/30 rounded-full transform -translate-x-1/2 translate-y-[5px] animate-pulse"></div>
              )}
            </div>
          </div>
        </div>

        <h3
          className="text-xl font-bold text-center mb-2"
          style={{
            color: connectionStatus === "offline" ? "#ef4444" : connectionStatus === "slow" ? "#f59e0b" : "#0e5f97",
          }}
        >
          {title}
        </h3>

        <p
          className="text-sm text-center"
          style={{
            color:
              connectionStatus === "offline"
                ? "rgba(239, 68, 68, 0.7)"
                : connectionStatus === "slow"
                  ? "rgba(245, 158, 11, 0.7)"
                  : "rgba(14, 95, 151, 0.7)",
          }}
        >
          {message}
        </p>

        {/* Progress percentage */}
        <div className="mt-4 text-xs text-center text-gray-500 font-mono">{progress}%</div>

        {/* Connection status indicator */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionStatus === "offline"
                ? "bg-red-500 animate-pulse"
                : connectionStatus === "slow"
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
          ></div>
          <span className="text-xs text-gray-500">
            {connectionStatus === "offline" ? "Offline" : connectionStatus === "slow" ? "Slow Connection" : "Connected"}
          </span>
        </div>
      </div>
    </div>
  )
}
