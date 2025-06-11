"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useCamera } from "../../contexts/CameraContext"
import ElectronCameraIntegration from "./electron-camera-integration"

interface CameraWrapperProps {
  children: React.ReactNode
}

export default function CameraWrapper({ children }: CameraWrapperProps) {
  const { isCameraAvailable, isCameraOn, cameraError } = useCamera()
  const [isElectron, setIsElectron] = useState(false)

  // Check if we're running in Electron
  useEffect(() => {
    setIsElectron(typeof window !== "undefined" && window.electronAPI !== undefined)
    console.log("🖥️ Running in Electron:", typeof window !== "undefined" && window.electronAPI !== undefined)
  }, [])

  // Log camera status for debugging
  useEffect(() => {
    console.log("📊 Camera Status:", {
      isAvailable: isCameraAvailable,
      isOn: isCameraOn,
      error: cameraError,
      isElectron,
    })
  }, [isCameraAvailable, isCameraOn, cameraError, isElectron])

  const handleCameraReady = () => {
    console.log("✅ Camera is ready from Electron integration")
  }

  const handleCameraError = (error: string) => {
    console.error("❌ Camera error from Electron integration:", error)
  }

  return (
    <>
      {isElectron && <ElectronCameraIntegration onCameraReady={handleCameraReady} onCameraError={handleCameraError} />}
      {children}
    </>
  )
}
