"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Camera, Play, Pause, Maximize, Minimize, Egg, Wifi, WifiOff } from "lucide-react"
import { saveDefectLog, initializeBatch, syncOfflineData, checkInternetConnection } from "../utils/firebase-helpers"
import { db } from "../firebase"
import { doc, onSnapshot } from "firebase/firestore"

const WS_URL = "ws://localhost:8000/ws" // Update this to your actual WebSocket URL
const FRAME_INTERVAL = 3000 // 3 seconds in milliseconds
const PING_INTERVAL = 30000 // 30 seconds

export default function DefectDetection() {
  const [isDetecting, setIsDetecting] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [batchNumber, setBatchNumber] = useState("B001")
  const [detectionResult, setDetectionResult] = useState({ prediction: "", confidence: 0 })
  const [wsStatus, setWsStatus] = useState("Disconnected")
  const [bboxCoordinates, setBboxCoordinates] = useState(null)
  const [uploadStatus, setUploadStatus] = useState("")
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const wsRef = useRef(null)
  const intervalRef = useRef(null)

  const [totalEggs, setTotalEggs] = useState(0)
  const [defectCounts, setDefectCounts] = useState({
    good: 0,
    dirty: 0,
    cracked: 0,
    darkSpots: 0,
  })

  const [isOnline, setIsOnline] = useState(true)

  const pingIntervalRef = useRef(null)

  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket is already connected")
      return
    }

    console.log("Attempting to connect WebSocket...")
    wsRef.current = new WebSocket(WS_URL)

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error)
      setWsStatus("Error: " + (error.message || "Unknown error"))
    }

    wsRef.current.onopen = () => {
      console.log("WebSocket connected")
      setWsStatus("Connected")
      startPing()
    }

    wsRef.current.onmessage = (event) => {
      console.log("Received message from WebSocket")
      const data = JSON.parse(event.data)
      if (data.type === "pong") {
        console.log("Received pong from server")
        return
      }
      setDetectionResult({ prediction: data.defect, confidence: data.confidence })
      setBboxCoordinates(data.bbox)
      updateCounts(data.defect)
    }

    wsRef.current.onclose = (event) => {
      console.log("WebSocket disconnected:", event.reason)
      setWsStatus("Disconnected")
      stopPing()
      setTimeout(connectWebSocket, 5000) 
    }
  }, [])

  const startPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }))
        console.log("Ping sent to server")
      }
    }, PING_INTERVAL)
  }, [])

  const stopPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isDetecting) {
      connectWebSocket()
    } else {
      if (wsRef.current) {
        console.log("Closing WebSocket connection")
        wsRef.current.close()
      }
      stopPing()
    }

    return () => {
      if (wsRef.current) {
        console.log("Cleaning up WebSocket connection")
        wsRef.current.close()
      }
      stopPing()
    }
  }, [isDetecting, connectWebSocket, stopPing])

  const captureAndSendFrame = useCallback(async () => {
    if (videoRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        // 1. Capture frame
        const canvas = document.createElement("canvas")
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        canvas.getContext("2d").drawImage(videoRef.current, 0, 0)
        const imageBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg"))

        // 2. Send to WebSocket
        wsRef.current.send(canvas.toDataURL("image/jpeg"))
        console.log("Frame sent to WebSocket server")

        // 3. Save image and data (using saveDefectLog for both online and offline)
        await saveDefectLog({
          batchNumber,
          confidence: detectionResult.confidence,
          defectType: detectionResult.prediction,
          deviceId: "device_001", // Replace with actual device ID
          imageBlob: imageBlob,
        })
        setUploadStatus(isOnline ? "Image and data saved successfully" : "Image and data saved locally")
      } catch (error) {
        console.error("Error in capture and save process:", error)
        setUploadStatus(`Error: ${error.message || "Failed to save data"}`)
      }
    } else {
      console.log("Cannot send frame: Video or WebSocket not ready")
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.log("WebSocket is not open. Attempting to reconnect...")
        connectWebSocket()
      }
    }
  }, [detectionResult, batchNumber, isOnline, connectWebSocket])

  useEffect(() => {
    if (isDetecting) {
      connectWebSocket()
      intervalRef.current = setInterval(captureAndSendFrame, FRAME_INTERVAL)
    } else {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isDetecting, connectWebSocket, captureAndSendFrame])

  const drawBoundingBox = useCallback(() => {
    if (canvasRef.current && videoRef.current && bboxCoordinates) {
      const ctx = canvasRef.current.getContext("2d")
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

      // Draw bounding box
      ctx.strokeStyle = "green"
      ctx.lineWidth = 2
      const [x, y, width, height] = bboxCoordinates
      ctx.strokeRect(x, y, width, height)

      // Draw label and confidence
      ctx.fillStyle = "rgba(0, 255, 0, 0.7)"
      ctx.fillRect(x, y - 20, 150, 20)
      ctx.font = "16px Arial"
      ctx.fillStyle = "black"
      ctx.fillText(`${detectionResult.prediction} ${detectionResult.confidence.toFixed(2)}%`, x + 5, y - 5)
    }
  }, [bboxCoordinates, detectionResult])

  useEffect(() => {
    drawBoundingBox()
  }, [drawBoundingBox])

  const toggleDetection = () => {
    if (!isDetecting) {
      setCameraActive(true)
      setIsDetecting(true)
      startVideoStream()
    } else {
      setCameraActive(false)
      setIsDetecting(false)
      stopVideoStream()
    }
  }

  const startVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth
            canvasRef.current.height = videoRef.current.videoHeight
          }
        }
      }
    } catch (err) {
      console.error("Error accessing the camera:", err)
      setWsStatus("Camera Error: " + err.message)
    }
  }

  const stopVideoStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach((track) => track.stop())
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  const updateCounts = (prediction) => {
    setTotalEggs((prev) => prev + 1)
    setDefectCounts((prev) => ({
      ...prev,
      [prediction]: (prev[prediction] || 0) + 1,
    }))
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen()
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("msfullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("msfullscreenchange", handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    const initializeNewBatch = async () => {
      const success = await initializeBatch(batchNumber)
      if (!success) {
        console.error("Failed to initialize batch documents")
        setUploadStatus("Error: Failed to initialize batch")
      }
    }

    initializeNewBatch()
  }, [batchNumber])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      console.log("Internet connection restored. Syncing offline data...")
      syncOfflineData()
        .then(() => {
          console.log("Offline data synced successfully")
          setUploadStatus("Offline data synced successfully")
        })
        .catch((error) => {
          console.error("Error syncing offline data:", error)
          setUploadStatus("Error syncing offline data")
        })
    }

    const handleOffline = () => {
      setIsOnline(false)
      setUploadStatus("Offline - data will be saved locally")
    }

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)

      // Check initial connection status and sync if online
      if (checkInternetConnection()) {
        setIsOnline(true)
        syncOfflineData()
          .then(() => {
            console.log("Initial offline data sync completed")
          })
          .catch((error) => {
            console.error("Error during initial offline data sync:", error)
          })
      } else {
        setIsOnline(false)
      }

      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }
  }, [])

  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (isOnline) {
        console.log("Periodic sync: Checking for offline data...")
        syncOfflineData()
          .then(() => {
            console.log("Periodic sync: Offline data synced successfully")
          })
          .catch((error) => {
            console.error("Periodic sync: Error syncing offline data:", error)
          })
      }
    }, 60000) // Check every minute

    return () => clearInterval(syncInterval)
  }, [isOnline])

  useEffect(() => {
    const latestDetectionRef = doc(db, "latestDetection", "current")

    // Listen for changes to the latest detection
    const unsubscribe = onSnapshot(latestDetectionRef, (doc) => {
      if (doc.exists()) {
        setDetectionResult(doc.data())
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link href="/home" className="text-[#0e5f97] hover:text-[#0e4772] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-[#0e5f97]">Defect Detection</h1>
            <div className="text-sm font-medium text-[#0e5f97] bg-[#e6f7ff] px-3 py-1 rounded-full">
              Batch: {batchNumber}
            </div>
          </div>
          <div className="w-6 h-6" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div ref={containerRef} className="md:col-span-2 bg-[#fcfcfd] rounded-xl shadow-md p-4 relative">
            <div className="aspect-video bg-[#0e4772] rounded-lg flex items-center justify-center overflow-hidden relative">
              {cameraActive ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                </>
              ) : (
                <Camera className="w-12 h-12 text-[#fcfcfd] opacity-50" />
              )}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                <button
                  onClick={toggleDetection}
                  className={`${
                    isDetecting ? "bg-[#fb510f]" : "bg-[#0e5f97]"
                  } text-[#fcfcfd] px-4 py-2 rounded-md hover:opacity-90 transition-opacity flex items-center`}
                >
                  {isDetecting ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Stop Detection
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Detection
                    </>
                  )}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="bg-[#0e5f97] text-[#fcfcfd] px-4 py-2 rounded-md hover:opacity-90 transition-opacity flex items-center"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize className="w-4 h-4 mr-2" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize className="w-4 h-4 mr-2" />
                      Fullscreen
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#fcfcfd] rounded-xl shadow-md p-4">
              <h3 className="text-lg font-semibold text-[#0e5f97] mb-3">Latest Detection</h3>
              <div className="p-3 bg-[#e6f7ff] rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[#0e5f97] font-medium">{detectionResult.prediction || "No detection yet"}</span>
                  {detectionResult.confidence !== undefined && (
                    <span className="text-xs bg-[#0e5f97] text-white px-2 py-0.5 rounded-full">
                      {detectionResult.confidence.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#fcfcfd] rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#0e5f97]">Egg Counter</h2>
                <div className="flex items-center bg-[#e6f7ff] px-3 py-1 rounded-full">
                  <Egg className="w-5 h-5 text-[#0e5f97] mr-2" />
                  <span className="text-xl font-bold text-[#0e5f97]">{totalEggs}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(defectCounts).map(([type, count]) => (
                  <div key={type} className="bg-[#f0f4f8] rounded-lg p-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#171717] capitalize">{type}</span>
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-1"
                        style={{
                          backgroundColor:
                            type === "good"
                              ? "#4caf50"
                              : type === "dirty"
                                ? "#ff9800"
                                : type === "cracked"
                                  ? "#f44336"
                                  : "#9c27b0",
                        }}
                      ></div>
                      <span className="font-bold text-sm text-[#0e5f97]">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gradient-to-r from-[#f0f7ff] via-[#fcfcfd] to-[#f0f7ff] rounded-lg p-4 shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  wsStatus === "Connected" ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-[#171717]/60">System Status:</span>
              <span className="text-[#0e5f97] font-medium">{wsStatus}</span>
            </div>

            <div className="flex items-center space-x-2">
              {isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
              <span className="text-sm text-[#171717]/60">Connection:</span>
              <span className="text-[#0e5f97] font-medium">{isOnline ? "Online" : "Offline"}</span>
            </div>

            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  uploadStatus.includes("success")
                    ? "bg-blue-500 animate-pulse"
                    : uploadStatus.includes("Error")
                      ? "bg-red-500"
                      : "bg-gray-300"
                }`}
              />
              <span className="text-sm text-[#171717]/60">Upload Status:</span>
              <span className="text-[#0e5f97] font-medium">{uploadStatus || "Waiting..."}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

