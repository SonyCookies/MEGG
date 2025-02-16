"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Camera, Play, Pause, RotateCcw, Maximize, Minimize, RefreshCw } from "lucide-react"

const WS_URL = "ws://localhost:8000/ws" // Update this to your actual WebSocket URL
const FRAME_INTERVAL = 3000 // 3 seconds in milliseconds

export default function DefectDetection() {
  const [isDetecting, setIsDetecting] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [batchNumber, setBatchNumber] = useState("B001")
  const [showDefects, setShowDefects] = useState(false)
  const [detectionResult, setDetectionResult] = useState({ prediction: "", confidence: 0 })
  const [wsStatus, setWsStatus] = useState("Disconnected")
  const [bboxCoordinates, setBboxCoordinates] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const wsRef = useRef(null)
  const intervalRef = useRef(null)

  const [eggCounts, setEggCounts] = useState({
    small: 0,
    medium: 0,
    large: 0,
    xl: 0,
    jumbo: 0,
  })
  const [defectCounts, setDefectCounts] = useState({
    good: 0,
    dirty: 0,
    cracked: 0,
    darkSpots: 0,
  })

  const connectWebSocket = useCallback(() => {
    wsRef.current = new WebSocket(WS_URL)

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error)
      console.error("Error details:", {
        type: error.type,
        message: error.message,
        filename: error.filename,
        lineno: error.lineno,
        colno: error.colno,
        error: error.error,
      })
      setWsStatus("Error: " + (error.message || "Unknown error"))
    }

    wsRef.current.onopen = () => {
      console.log("WebSocket connected")
      setWsStatus("Connected")
    }

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setDetectionResult({ prediction: data.defect, confidence: data.confidence })
      setBboxCoordinates(data.bbox)
      updateCounts(data.defect)
    }

    wsRef.current.onclose = (event) => {
      console.log("WebSocket disconnected:", event.reason)
      setWsStatus("Disconnected")
      setTimeout(connectWebSocket, 5000) // Try to reconnect after 5 seconds
    }
  }, [])

  const captureAndSendFrame = useCallback(() => {
    if (videoRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0)
      const imageData = canvas.toDataURL("image/jpeg")
      wsRef.current.send(imageData)
      console.log("Frame sent to WebSocket server")
    }
  }, [])

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
    if (prediction === "good") {
      const size = ["small", "medium", "large", "xl", "jumbo"][Math.floor(Math.random() * 5)]
      setEggCounts((prev) => ({ ...prev, [size]: prev[size] + 1 }))
      setDefectCounts((prev) => ({ ...prev, good: prev.good + 1 }))
    } else {
      setDefectCounts((prev) => ({ ...prev, [prediction]: prev[prediction] + 1 }))
    }
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

  const resetCounts = () => {
    setEggCounts({ small: 0, medium: 0, large: 0, xl: 0, jumbo: 0 })
    setDefectCounts({ good: 0, dirty: 0, cracked: 0, darkSpots: 0 })
    setIsDetecting(false)
    setCameraActive(false)
    stopVideoStream()
  }

  const totalEggs = Object.values(eggCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-2">
          <Link href="/home" className="text-[#0e5f97] hover:text-[#0e4772] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-[#0e5f97]">Defect Detection</h1>
          <div className="w-6 h-6" />
        </header>

        <div className="mb-4 text-center">
          <span className="text-lg font-semibold text-[#0e5f97]">Current Batch: </span>
          <span className="text-lg">{batchNumber}</span>
        </div>

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
            </div>
            <div className="mt-4 flex justify-between items-center">
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
                onClick={resetCounts}
                className="bg-[#ecb662] text-[#171717] px-4 py-2 rounded-md hover:opacity-90 transition-opacity flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
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

          <div className="bg-[#fcfcfd] rounded-xl shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#0e5f97]">{showDefects ? "Defect Counts" : "Egg Counts"}</h2>
              <button
                onClick={() => setShowDefects(!showDefects)}
                className="bg-[#0e5f97] text-[#fcfcfd] p-2 rounded-full hover:bg-[#0e4772] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {showDefects ? (
                <>
                  {Object.entries(defectCounts).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-[#171717] capitalize">{type}</span>
                      <span className="font-bold text-[#0e5f97]">{count}</span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {Object.entries(eggCounts).map(([size, count]) => (
                    <div key={size} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-[#171717] capitalize">{size}</span>
                      <span className="font-bold text-[#0e5f97]">{count}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[#ecb662]">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-[#171717]">Total</span>
                      <span className="font-bold text-[#0e5f97]">{totalEggs}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-[#fcfcfd] rounded-lg p-4 shadow-md">
          <div className="text-sm text-center text-[#171717]/60">
            System Status: <span className="text-[#0e5f97] font-medium">{wsStatus}</span>
          </div>
          {isDetecting && detectionResult.prediction && (
            <div className="text-sm text-center text-[#171717]/60 mt-2">
              Last Detection: {detectionResult.prediction}
              {detectionResult.confidence !== undefined && (
                <span> (Confidence: {detectionResult.confidence.toFixed(2)}%)</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

