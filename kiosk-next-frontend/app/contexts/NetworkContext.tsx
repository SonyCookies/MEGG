
//contexts/NetworkContext.tsx

"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { syncData } from "../libs/sync"

// ==========================================
// Types
// ==========================================
interface WebSocketContextType {
  sendMessage: (message: Record<string, unknown>) => void
  lastMessage: Record<string, unknown> | null
  readyState: number
}

interface NetworkProviderProps {
  children: ReactNode
}

// ==========================================
// Constants
// ==========================================
const WS_URL = "ws://localhost:8000/ws"
const PING_INTERVAL = 60000
const PING_TIMEOUT = 5000

// ==========================================
// Context Creation
// ==========================================
const InternetConnectionContext = createContext<boolean>(true)
const WebSocketContext = createContext<WebSocketContextType | null>(null)

// ==========================================
// Sync Lock Management
// ==========================================
let isSyncing = false
let syncScheduled = false

// ==========================================
// Logger Setup
// ==========================================
const createLogger = (context: string) => ({
  log: (message: string) => console.log(`[${context}] ${new Date().toISOString()}: ${message}`),
  warn: (message: string) => console.warn(`[${context}] ${new Date().toISOString()}: ${message}`),
  error: (message: string) => console.error(`[${context}] ${new Date().toISOString()}: ${message}`),
})

const internetLogger = createLogger("InternetConnectionContext")
const wsLogger = createLogger("WebSocketContext")

// ==========================================
// Sync Function
// ==========================================
const runSyncWithLock = async (): Promise<void> => {
  if (isSyncing) {
    internetLogger.log("Sync already in progress, scheduling another sync")
    syncScheduled = true
    return
  }

  try {
    isSyncing = true
    internetLogger.log("Starting sync operation")
    await syncData()
    internetLogger.log("Sync operation completed")
  } catch (error) {
    internetLogger.error(`Error during sync: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isSyncing = false

    if (syncScheduled) {
      internetLogger.log("Running scheduled sync")
      syncScheduled = false
      runSyncWithLock()
    }
  }
}

// ==========================================
// Custom Hooks
// ==========================================
export const useInternetConnection = (): boolean => {
  const context = useContext(InternetConnectionContext)
  if (context === undefined) {
    throw new Error("useInternetConnection must be used within a NetworkProvider")
  }
  return context
}

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error("useWebSocket must be used within a NetworkProvider")
  }
  return context
}

// ==========================================
// Network Provider Component
// ==========================================
export const NetworkProvider = ({ children }: NetworkProviderProps): React.ReactElement => {
  // ==========================================
  // Internet Connection State
  // ==========================================
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const isCheckingRef = useRef<boolean>(false)
  const lastOnlineState = useRef<boolean>(true)

  // ==========================================
  // WebSocket State
  // ==========================================
  const [lastMessage, setLastMessage] = useState<Record<string, unknown> | null>(null)
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED)
  const ws = useRef<WebSocket | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const messageIdCounter = useRef<number>(0)

  // ==========================================
  // Internet Connection Methods
  // ==========================================
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    if (isCheckingRef.current) return false
    isCheckingRef.current = true

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT)

      const endpoints = [
        "https://8.8.8.8/generate_204", // Google
        "https://1.1.1.1/cdn-cgi/trace", // Cloudflare
      ]

      let isConnected = false
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: "HEAD",
            mode: "no-cors",
            signal: controller.signal,
          })
          if (response) {
            isConnected = true
            break
          }
        } catch (error) {
          internetLogger.warn(`Failed to reach ${endpoint}: ${error instanceof Error ? error.message : String(error)}`)
          continue
        }
      }

      clearTimeout(timeoutId)
      return isConnected
    } catch (error) {
      internetLogger.warn(`Connectivity check failed: ${error instanceof Error ? error.message : String(error)}`)
      return false
    } finally {
      isCheckingRef.current = false
    }
  }, [])

  const updateOnlineStatus = useCallback(
    async (navigatorStatus: boolean): Promise<void> => {
      if (!navigatorStatus) {
        setIsOnline(false)
        lastOnlineState.current = false
        internetLogger.log("Device reports offline")
        return
      }

      const hasInternet = await checkConnectivity()
      const wasOffline = !lastOnlineState.current
      lastOnlineState.current = hasInternet

      setIsOnline(hasInternet)
      internetLogger.log(`Internet connection status changed to: ${hasInternet ? "online" : "offline"}`)

      if (hasInternet && wasOffline) {
        internetLogger.log("Connection restored, triggering sync")
        runSyncWithLock()
      }
    },
    [checkConnectivity],
  )

  // ==========================================
  // WebSocket Methods
  // ==========================================
  const startPing = useCallback((): void => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }
    pingIntervalRef.current = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ action: "ping" }))
      }
    }, PING_INTERVAL)
  }, [])

  const stopPing = useCallback((): void => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
  }, [])

  const connectWebSocket = useCallback((): void => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      return
    }

    ws.current = new WebSocket(WS_URL)

    ws.current.onerror = (error: Event): void => {
      wsLogger.error(`WebSocket error: ${error instanceof ErrorEvent ? error.message : "Unknown error"}`)
      setReadyState(WebSocket.CLOSED)
    }

    ws.current.onopen = (): void => {
      setReadyState(WebSocket.OPEN)
      startPing()
    }

    ws.current.onmessage = (event: MessageEvent): void => {
      try {
        const data = JSON.parse(event.data)
        if (data.action === "pong") {
          return
        }
        data.id = `msg_${messageIdCounter.current++}`
        setLastMessage(data)
      } catch (error) {
        wsLogger.error(`Error processing WebSocket message: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    ws.current.onclose = (event: CloseEvent): void => {
      wsLogger.warn(`WebSocket disconnected: ${event.reason}`)
      setReadyState(WebSocket.CLOSED)
      stopPing()
      setTimeout(connectWebSocket, 5000)
    }
  }, [startPing, stopPing])

  const sendMessage = useCallback((message: Record<string, unknown>): void => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      wsLogger.error("WebSocket is not connected. Message not sent.")
    }
  }, [])

  // ==========================================
  // Effects
  // ==========================================

  // Internet Connection Effect
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleOnline = (): void => {
      internetLogger.log("Browser 'online' event fired")
      updateOnlineStatus(true)
    }

    const handleOffline = (): void => {
      internetLogger.log("Browser 'offline' event fired")
      updateOnlineStatus(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Initial check
    updateOnlineStatus(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      internetLogger.log("InternetConnectionProvider unmounted")
    }
  }, [updateOnlineStatus])

  // WebSocket Effect
  useEffect(() => {
    connectWebSocket()

    return () => {
      if (ws.current) {
        ws.current.close()
      }
      stopPing()
    }
  }, [connectWebSocket, stopPing])

  // ==========================================
  // Render
  // ==========================================
  return (
    <InternetConnectionContext.Provider value={isOnline}>
      <WebSocketContext.Provider value={{ sendMessage, lastMessage, readyState }}>{children}</WebSocketContext.Provider>
    </InternetConnectionContext.Provider>
  )
}
