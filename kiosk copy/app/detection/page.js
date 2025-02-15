"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Camera, Play, Pause, RotateCcw, Maximize, Minimize, RefreshCw } from "lucide-react"

export default function DefectDetection() {
  const [isDetecting, setIsDetecting] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [batchNumber, setBatchNumber] = useState("")
  const [showDefects, setShowDefects] = useState(false)
  const [socket, setSocket] = useState(null)
  const [detectionResult, setDetectionResult] = useState({ prediction: "", confidence: 0 })
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const containerRef = useRef(null)
  const searchParams = useSearchParams()

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

  useEffect(() => {
    const batch = searchParams.get("batch")
    if (batch) {
      setBatchNumber(batch)
    }
  }, [searchParams])

  useEffect(() => {
    if (isDetecting) {
      const ws = new WebSocket("ws://localhost:8000/ws/realtime-detect")

      ws.onopen = () => {
        console.log("WebSocket connection established")
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setDetectionResult(data)

        if (data.prediction === "good") {
          setEggCounts((prev) => ({ ...prev, [getEggSize()]: prev[getEggSize()] + 1 }))
          setDefectCounts((prev) => ({ ...prev, good: prev.good + 1 }))
        } else {
          setDefectCounts((prev) => ({ ...prev, [data.prediction]: prev[data.prediction] + 1 }))
        }
      }

      ws.onclose = () => {
        console.log("WebSocket connection closed")
      }

      setSocket(ws)

      return () => {
        ws.close()
        setSocket(null)
      }
    }
  }, [isDetecting])

  const getEggSize = () => {
    const sizes = ["small", "medium", "large", "xl", "jumbo"]
    return sizes[Math.floor(Math.random() * sizes.length)]
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        videoRef.current.play()
        setCameraActive(true)
      }
    } catch (err) {
      console.error("Error accessing the camera:", err)
    }
  }

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks()
      tracks.forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }, [])

  const startDetection = async () => {
    try {
      const response = await fetch("http://localhost:8000/detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "start" }),
      })
      const data = await response.json()
      console.log("Detection started:", data)
    } catch (error) {
      console.error("Error starting detection:", error)
    }
  }

  const toggleDetection = async () => {
    if (!isDetecting) {
      await startCamera()
      await startDetection()
    } else {
      stopCamera()
      if (socket) {
        socket.close()
      }
    }
    setIsDetecting(!isDetecting)
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
      stopCamera()
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("msfullscreenchange", handleFullscreenChange)
    }
  }, [stopCamera])

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
          <span className="text-lg">{batchNumber || "Not set"}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div ref={containerRef} className="md:col-span-2 bg-[#fcfcfd] rounded-xl shadow-md p-4 relative">
            <div className="aspect-video bg-[#0e4772] rounded-lg flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
              />
              {!cameraActive && <Camera className="w-12 h-12 text-[#fcfcfd] opacity-50" />}
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
                onClick={() => {
                  stopCamera()
                  setIsDetecting(false)
                  setEggCounts({ small: 0, medium: 0, large: 0, xl: 0, jumbo: 0 })
                  setDefectCounts({ good: 0, dirty: 0, cracked: 0, darkSpots: 0 })
                }}
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
            System Status:{" "}
            <span className="text-[#0e5f97] font-medium">{isDetecting ? "Online - Detecting" : "Online - Idle"}</span>
          </div>
          {isDetecting && (
            <div className="text-sm text-center text-[#171717]/60 mt-2">
              Last Detection: {detectionResult.prediction} (Confidence: {(detectionResult.confidence * 100).toFixed(2)}
              %)
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

