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

// Add a sync lock to prevent multiple simultaneous sync operations
let isSyncing = false
let syncScheduled = false

// Function to safely run sync with a lock
const runSyncWithLock = async () => {
  if (isSyncing) {
    // If a sync is already in progress, schedule another one for after it completes
    logger.log("Sync already in progress, scheduling another sync")
    syncScheduled = true
    return
  }

  try {
    isSyncing = true
    logger.log("Starting sync operation")
    await syncData()
    logger.log("Sync operation completed")
  } catch (error) {
    logger.error(`Error during sync: ${error.message}`)
  } finally {
    isSyncing = false

    // If another sync was scheduled while this one was running, run it now
    if (syncScheduled) {
      logger.log("Running scheduled sync")
      syncScheduled = false
      runSyncWithLock()
    }
  }
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
  const lastOnlineState = useRef(true)

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
        lastOnlineState.current = false
        logger.log("Device reports offline")
        return
      }

      // Check actual connectivity
      const hasInternet = await checkConnectivity()

      // Only trigger sync if transitioning from offline to online
      const wasOffline = !lastOnlineState.current
      lastOnlineState.current = hasInternet

      setIsOnline(hasInternet)
      logger.log(`Internet connection status changed to: ${hasInternet ? "online" : "offline"}`)

      if (hasInternet && wasOffline) {
        logger.log("Connection restored, triggering sync")
        runSyncWithLock()
      }
    },
    [checkConnectivity],
  )

  // Set up periodic checks
  useEffect(() => {
    if (typeof window === "undefined") return

    const startPeriodicCheck = () => {
      // Commented out periodic check
      /* 
      checkIntervalRef.current = setInterval(async () => {
        const navigatorStatus = navigator.onLine
        await updateOnlineStatus(navigatorStatus)
      }, CHECK_INTERVAL)
      */
    }

    // Only sync on the "online" event, not on every periodic check
    const handleOnline = () => {
      logger.log("Browser 'online' event fired")
      updateOnlineStatus(true)
    }

    const handleOffline = () => {
      logger.log("Browser 'offline' event fired")
      updateOnlineStatus(false)
    }

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

