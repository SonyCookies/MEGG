//D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\contexts\InternetConnectionContext.js

"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { syncData } from "../sync"

const InternetConnectionContext = createContext(true)
const CHECK_INTERVAL = 10000 // Check every 10 seconds
const PING_TIMEOUT = 5000 // Timeout after 5 seconds

const logger = {
  log: (message) => {
    console.log(`[InternetConnectionContext] ${new Date().toISOString()}: ${message}`)
  },
  warn: (message) => {
    console.warn(`[InternetConnectionContext] ${new Date().toISOString()}: ${message}`)
  },
  error: (message) => {
    console.error(`[InternetConnectionContext] ${new Date().toISOString()}: ${message}`)
  },
}

export const useInternetConnection = () => {
  const context = useContext(InternetConnectionContext)
  if (context === undefined) {
    logger.error("useInternetConnection must be used within an InternetConnectionProvider")
    throw new Error("useInternetConnection must be used within an InternetConnectionProvider")
  }
  return context
}

export const InternetConnectionProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true)
  const checkIntervalRef = useRef(null)
  const isCheckingRef = useRef(false)

  // Check actual internet connectivity by pinging a reliable endpoint
  const checkConnectivity = useCallback(async () => {
    if (isCheckingRef.current) return
    isCheckingRef.current = true

    try {
      // Use AbortController to implement timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT)

      // Try to fetch a small resource from a reliable CDN
      // Using both Google and Cloudflare as fallbacks
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
          logger.warn(`Failed to reach ${endpoint}: ${error.message}`)
          continue
        }
      }

      clearTimeout(timeoutId)
      return isConnected
    } catch (error) {
      logger.warn(`Connectivity check failed: ${error.message}`)
      return false
    } finally {
      isCheckingRef.current = false
    }
  }, [])

  const updateOnlineStatus = useCallback(
    async (navigatorStatus) => {
      // Only proceed with connectivity check if navigator reports online
      if (!navigatorStatus) {
        setIsOnline(false)
        logger.log("Device reports offline")
        return
      }

      // Check actual connectivity
      const hasInternet = await checkConnectivity()

      setIsOnline(hasInternet)
      logger.log(`Internet connection status changed to: ${hasInternet ? "online" : "offline"}`)

      if (hasInternet) {
        syncData().catch((error) => {
          logger.error(`Error syncing data: ${error.message}`)
        })
      }
    },
    [checkConnectivity],
  )

  // Set up periodic checks
  useEffect(() => {
    if (typeof window === "undefined") return

    const startPeriodicCheck = () => {
      checkIntervalRef.current = setInterval(async () => {
        const navigatorStatus = navigator.onLine
        await updateOnlineStatus(navigatorStatus)
      }, CHECK_INTERVAL)
    }

    const handleOnline = () => updateOnlineStatus(true)
    const handleOffline = () => updateOnlineStatus(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Initial check
    updateOnlineStatus(navigator.onLine)
    startPeriodicCheck()

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      logger.log("InternetConnectionProvider unmounted")
    }
  }, [updateOnlineStatus])

  return <InternetConnectionContext.Provider value={isOnline}>{children}</InternetConnectionContext.Provider>
}

