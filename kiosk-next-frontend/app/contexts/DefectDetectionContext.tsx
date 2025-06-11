"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useWebSocket } from "./NetworkContext"

interface DetectionResult {
  prediction: string | null
  confidence: number | null
}

interface DefectDetectionContextType {
  isConnected: boolean
  isProcessing: boolean
  lastResult: DetectionResult | null
  detectDefect: (imageData: string) => Promise<DetectionResult | null>
  connect: () => Promise<void>
  disconnect: () => void
}

const DefectDetectionContext = createContext<DefectDetectionContextType | undefined>(undefined)

export function DefectDetectionProvider({ children }: { children: React.ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastResult, setLastResult] = useState<DetectionResult | null>(null)
  const [resultPromiseResolve, setResultPromiseResolve] = useState<((result: DetectionResult | null) => void) | null>(
    null,
  )

  // Use the existing WebSocket connection from NetworkContext
  const { sendMessage, lastMessage, readyState } = useWebSocket()
  const isConnected = readyState === WebSocket.OPEN

  // Handle detection results from the WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.action === "defect_detection_result") {
      console.log("✅ Received defect detection result:", lastMessage)

      let result: DetectionResult | null = null

      if (lastMessage.error) {
        console.error("❌ Error in detection result:", lastMessage.error)
      } else if (lastMessage.defects && Array.isArray(lastMessage.defects) && lastMessage.defects.length > 0) {
        result = {
          prediction: lastMessage.defects[0],
          confidence: typeof lastMessage.confidence === "number" ? lastMessage.confidence : 0,
        }
        setLastResult(result)
      }

      setIsProcessing(false)

      // Resolve the promise if there's one waiting
      if (resultPromiseResolve) {
        resultPromiseResolve(result)
        setResultPromiseResolve(null)
      }
    }
  }, [lastMessage, resultPromiseResolve])

  // Send an image for defect detection
  const detectDefect = useCallback(
    async (imageData: string): Promise<DetectionResult | null> => {
      if (isProcessing) {
        console.warn("⚠️ Detection already in progress, ignoring request")
        return null
      }

      if (!isConnected) {
        console.error("❌ WebSocket not connected")
        throw new Error("WebSocket not connected")
      }

      // Validate image data
      if (!imageData || imageData.trim() === "") {
        console.error("❌ No image data provided")
        throw new Error("No image data provided")
      }

      console.log("📸 Image data length:", imageData.length)
      console.log("📸 Image data preview:", imageData.substring(0, 50) + "...")

      setIsProcessing(true)

      try {
        // Create a promise that will be resolved when we get the result
        const resultPromise = new Promise<DetectionResult | null>((resolve) => {
          setResultPromiseResolve(() => resolve)

          // Set a timeout to avoid hanging forever
          setTimeout(() => {
            console.warn("⏰ Detection request timed out")
            setIsProcessing(false)
            setResultPromiseResolve(null)
            resolve(null)
          }, 30000) // 30 second timeout
        })

        // Send the image to the defect detection service using existing WebSocket
        // Try different message formats to match your backend expectations
        const message = {
          action: "defect_detection",
          image: imageData, // Direct image data
          data: {
            image: imageData, // Nested in data object
          },
        }

        console.log("📤 Sending defect detection message:", {
          action: message.action,
          imageLength: imageData.length,
          hasImage: !!message.image,
          hasDataImage: !!message.data.image,
        })

        sendMessage(message)

        // Wait for the result
        return await resultPromise
      } catch (error) {
        console.error("❌ Error during defect detection:", error)
        setIsProcessing(false)
        setResultPromiseResolve(null)
        throw error
      }
    },
    [isProcessing, isConnected, sendMessage],
  )

  const value = {
    isConnected,
    isProcessing,
    lastResult,
    detectDefect,
    connect: async () => Promise.resolve(), // Since we're using the existing WebSocket, no need to connect
    disconnect: () => {}, // No need to disconnect since we're using the shared WebSocket
  }

  return <DefectDetectionContext.Provider value={value}>{children}</DefectDetectionContext.Provider>
}

export function useDefectDetection() {
  const context = useContext(DefectDetectionContext)
  if (context === undefined) {
    throw new Error("useDefectDetection must be used within a DefectDetectionProvider")
  }
  return context
}
