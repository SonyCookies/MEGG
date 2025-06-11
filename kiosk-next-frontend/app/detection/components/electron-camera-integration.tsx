"use client"

import { useEffect, useRef } from "react"
import { useCamera } from "../../contexts/CameraContext"

interface ElectronCameraIntegrationProps {
  onCameraReady: () => void
  onCameraError: (error: string) => void
}

export default function ElectronCameraIntegration({ onCameraReady, onCameraError }: ElectronCameraIntegrationProps) {
  const {
    isCameraAvailable,
    isCameraOn,
    isCameraLoading,
    cameraError,
    stopCamera,
    availableCameras,
    selectedCamera,
  } = useCamera()
  

  const hasAttemptedStart = useRef(false)

  // Log camera status for debugging
  useEffect(() => {
    console.log("🎥 ElectronCameraIntegration - Camera Status:", {
      isAvailable: isCameraAvailable,
      isOn: isCameraOn,
      isLoading: isCameraLoading,
      error: cameraError,
      availableCameras,
      selectedCamera,
    })
  }, [isCameraAvailable, isCameraOn, isCameraLoading, cameraError, availableCameras, selectedCamera])

  // Handle camera errors
  useEffect(() => {
    if (cameraError) {
      console.error("❌ Camera error:", cameraError)
      onCameraError(cameraError)
    }
  }, [cameraError, onCameraError])

  // Handle camera ready state
  useEffect(() => {
    if (isCameraOn) {
      console.log("✅ Camera is ready and on")
      onCameraReady()
    }
  }, [isCameraOn, onCameraReady])

  // Just log camera availability but don't auto-start
  useEffect(() => {
    // Just log camera availability but don't auto-start
    if (isCameraAvailable && !hasAttemptedStart.current) {
      console.log("🎥 Electron camera is available but waiting for user to start it manually")
      hasAttemptedStart.current = true
    }
  }, [isCameraAvailable])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isCameraOn) {
        console.log("🎥 Stopping camera on component unmount")
        stopCamera()
      }
    }
  }, [isCameraOn, stopCamera])

  return null // This is a non-visual component
}
