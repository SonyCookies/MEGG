"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"

interface CameraContextType {
  isCameraAvailable: boolean
  isCameraOn: boolean
  isCameraLoading: boolean
  cameraError: string
  startCamera: () => Promise<void>
  stopCamera: () => Promise<void>
  captureFrame: () => Promise<string>
  availableCameras: { id: string; label: string }[]
  selectedCamera: string | null
  setSelectedCamera: (cameraId: string | null) => void
}

const CameraContext = createContext<CameraContextType>({
  isCameraAvailable: false,
  isCameraOn: false,
  isCameraLoading: false,
  cameraError: "",
  startCamera: async () => {},
  stopCamera: async () => {},
  captureFrame: async () => "",
  availableCameras: [],
  selectedCamera: null,
  setSelectedCamera: () => {},
})

export const useCamera = (): CameraContextType => {
  const context = useContext(CameraContext)
  if (!context) {
    throw new Error("useCamera must be used within a CameraProvider")
  }
  return context
}

export const CameraProvider = ({ children }: { children: React.ReactNode }) => {
  const [isCameraAvailable, setIsCameraAvailable] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const hasMounted = useRef(false)

  useEffect(() => {
    hasMounted.current = true
  }, [])

  const checkCameraAvailability = useCallback(async () => {
    if (typeof window !== "undefined" && window.electronAPI) {
      try {
        const devices = await window.electronAPI.getCameraDevices()
        setAvailableCameras(devices)
        setIsCameraAvailable(devices.length > 0)
      } catch (error) {
        console.error("Error getting camera devices:", error)
        setCameraError(`Error getting camera devices: ${error instanceof Error ? error.message : String(error)}`)
        setIsCameraAvailable(false)
      }
    } else {
      setIsCameraAvailable(false)
    }
  }, [])

  useEffect(() => {
    checkCameraAvailability()
  }, [checkCameraAvailability])

  const startCamera = useCallback(async () => {
    if (!hasMounted.current) return
    console.log("Starting camera")
    setIsCameraLoading(true)
    setCameraError("")

    try {
      console.log("Checking for Electron API")

      if (typeof window !== "undefined" && window.electronAPI) {
        console.log("Starting camera with selected device")

        try {
          const success = await window.electronAPI.startCamera(selectedCamera)
          console.log("Camera start result:", success)
          setIsCameraOn(success)

          if (!success) {
            console.error("Failed to start camera")
            setCameraError("Failed to start camera through Electron API")
          }
        } catch (err) {
          console.error("Error starting camera:", err)
          setCameraError(`Error calling Electron camera API: ${err instanceof Error ? err.message : String(err)}`)
          setIsCameraOn(false)
        }
      } else {
        console.error("Electron API not available")
        setCameraError("Electron API not available")
        setIsCameraOn(false)
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      setIsCameraOn(false)
      setCameraError(`Unexpected error starting camera: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      console.log("Camera initialization completed")
      setIsCameraLoading(false)
    }
  }, [selectedCamera])

  const stopCamera = useCallback(async () => {
    if (!hasMounted.current) return
    setIsCameraLoading(true)
    setCameraError("")

    try {
      if (typeof window !== "undefined" && window.electronAPI) {
        await window.electronAPI.stopCamera()
        setIsCameraOn(false)
      } else {
        setCameraError("Electron API not available")
      }
    } catch (error) {
      console.error("Error stopping camera:", error)
      setCameraError(`Error stopping camera: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsCameraLoading(false)
    }
  }, [])

  const captureFrame = useCallback(async () => {
    try {
      if (typeof window !== "undefined" && window.electronAPI) {
        const frame = await window.electronAPI.captureFrame()
        return frame
      } else {
        setCameraError("Electron API not available")
        return ""
      }
    } catch (error) {
      console.error("Error capturing frame:", error)
      setCameraError(`Error capturing frame: ${error instanceof Error ? error.message : String(error)}`)
      return ""
    }
  }, [])

  const value: CameraContextType = {
    isCameraAvailable,
    isCameraOn,
    isCameraLoading,
    cameraError,
    startCamera,
    stopCamera,
    captureFrame,
    availableCameras,
    selectedCamera,
    setSelectedCamera,
  }

  return <CameraContext.Provider value={value}>{children}</CameraContext.Provider>
}
