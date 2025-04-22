"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  Plug,
  PlugIcon as PlugOff,
  Play,
  Pause,
  Maximize2,
  FlipVertical,
  Camera,
  BarChart2,
  Archive,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  ZoomIn,
  Scale,
  CircleDot,
  X,
} from "lucide-react"
import { useWebSocket, useInternetConnection } from "../contexts/NetworkContext"
import type { ReactNode } from "react"

export default function DetectionPage() {
  const { readyState } = useWebSocket()
  const isOnline = useInternetConnection()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [, setIsFullscreen] = useState(false)
  const [isMirrorMode, setIsMirrorMode] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showBatchInfo, setShowBatchInfo] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<"quality" | "size">("quality")

  // Enhanced mock batch info with both quality and size data
  const currentBatch = {
    id: "batch-123",
    batch_number: "B-2023-04-18-001",
    created_at: new Date().toISOString(),
    total_count: 120,
    quality_counts: {
      good: 85,
      dirty: 20,
      broken: 10,
      cracked: 5,
    },
    size_counts: {
      small: 15,
      medium: 35,
      large: 45,
      xl: 20,
      jumbo: 5,
    },
    weight_ranges: {
      small: "< 45g",
      medium: "45-50g",
      large: "50-60g",
      xl: "60-70g",
      jumbo: "> 70g",
    },
  }

  // Trigger animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)

    // Add animation for bar filling when batch info is shown
    if (showBatchInfo) {
      const timer = setTimeout(() => {
        const bars = document.querySelectorAll(".animate-fill-bar")
        bars.forEach((bar, index) => {
          setTimeout(
            () => {
              if (bar instanceof HTMLElement) {
                const percentage = bar.getAttribute("data-percentage") || "0%"
                bar.style.height = percentage
              }
            },
            100 + index * 50,
          ) // Stagger the animations
        })
      }, 300) // Wait for the panel to appear

      return () => clearTimeout(timer)
    }

    return () => clearTimeout(timer)
  }, [isLoaded, showBatchInfo])

  // Mock detection result
  useEffect(() => {
    if (isCameraOn) {
      const timer = setInterval(() => {
        // Simulate processing
        setIsProcessing(true)
        setProcessingProgress(0)

        const progressInterval = setInterval(() => {
          setProcessingProgress((prev) => {
            if (prev >= 100) {
              clearInterval(progressInterval)
              return 100
            }
            return prev + 5
          })
        }, 50)

        // Simulate detection completion
        setTimeout(() => {
          const defectTypes = ["good", "dirty", "broken", "cracked"]
          const randomType = defectTypes[Math.floor(Math.random() * defectTypes.length)]
          const randomConfidence = Math.random() * 30 + 70 // 70-100%

          setDetectionResult({
            prediction: randomType,
            confidence: randomConfidence,
          })

          setIsProcessing(false)
          clearInterval(progressInterval)
          setProcessingProgress(100)
        }, 1500)
      }, 10000)

      return () => clearInterval(timer)
    }
  }, [isCameraOn])

  const stopVideoStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()
      tracks.forEach((track: MediaStreamTrack) => track.stop())
      videoRef.current.srcObject = null
    }
  }, [])

  // Replace the toggleCamera function with this updated version that includes Raspberry Pi specific options
  const toggleCamera = async () => {
    if (readyState !== WebSocket.OPEN) {
      setErrorMessage("WebSocket is not connected. Please wait and try again.")
      return
    }

    if (isCameraOn) {
      stopVideoStream()
      setIsCameraOn(false)
    } else {
      try {
        // Add specific constraints for Raspberry Pi
        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { max: 30 },
            facingMode: "environment",
          },
        }

        console.log("Attempting to access camera with constraints:", constraints)

        // Try to access the camera with specific constraints
        const stream = await navigator.mediaDevices.getUserMedia(constraints)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((e) => {
              console.error(`Error playing video: ${e}`)
              setErrorMessage(`Error playing video: ${e instanceof Error ? e.message : String(e)}`)
            })
          }
          setIsCameraOn(true)
          console.log("Camera stream successfully initialized")
        }
      } catch (err) {
        console.error("Error accessing the camera:", err)

        // Try again with minimal constraints as fallback
        try {
          console.log("Trying fallback with minimal constraints")
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          })

          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch((e) => console.error(`Error playing video: ${e}`))
            }
            setIsCameraOn(true)
            console.log("Camera initialized with fallback method")
          }
        } catch (fallbackErr) {
          console.error("Fallback camera access also failed:", fallbackErr)
          setErrorMessage(`Error accessing the camera: ${err instanceof Error ? err.message : String(err)}. 
            Make sure the camera is properly connected and permissions are granted.`)
        }
      }
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (videoRef.current && videoRef.current.requestFullscreen) {
        videoRef.current
          .requestFullscreen()
          .then(() => {
            setIsFullscreen(true)
          })
          .catch((err) => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`)
          })
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const toggleMirrorMode = () => {
    setIsMirrorMode(!isMirrorMode)
  }

  const handleCompleteBatch = () => {
    // Batch completion logic would go here
    console.log("Batch completed")
  }

  const toggleBatchInfo = () => {
    setShowBatchInfo(!showBatchInfo)
  }

  const triggerManualDetection = () => {
    if (!isCameraOn) return

    // Simulate processing
    setIsProcessing(true)
    setProcessingProgress(0)

    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 5
      })
    }, 50)

    // Simulate detection completion
    setTimeout(() => {
      const defectTypes = ["good", "dirty", "broken", "cracked"]
      const randomType = defectTypes[Math.floor(Math.random() * defectTypes.length)]
      const randomConfidence = Math.random() * 30 + 70 // 70-100%

      setDetectionResult({
        prediction: randomType,
        confidence: randomConfidence,
      })

      setIsProcessing(false)
      clearInterval(progressInterval)
      setProcessingProgress(100)
    }, 1500)
  }


  const getTextColorClass = (type: string | null) => {
    if (!type) return "text-gray-700"

    switch (type.toLowerCase()) {
      case "good":
        return "text-green-700"
      case "dirty":
        return "text-yellow-700"
      case "broken":
        return "text-red-700"
      case "cracked":
        return "text-orange-700"
      default:
        return "text-blue-700"
    }
  }

  const getGradientClass = (type: string | null) => {
    if (!type) return "from-gray-500 to-gray-600"

    switch (type.toLowerCase()) {
      case "good":
        return "from-green-500 to-green-600"
      case "dirty":
        return "from-yellow-500 to-yellow-600"
      case "broken":
        return "from-red-500 to-red-600"
      case "cracked":
        return "from-orange-500 to-orange-600"
      default:
        return "from-blue-500 to-blue-600"
    }
  }

  const getResultIcon = (type: string | null) => {
    if (!type) return null

    switch (type.toLowerCase()) {
      case "good":
        return <CheckCircle className="w-6 h-6 text-white" />
      case "dirty":
        return <AlertCircle className="w-6 h-6 text-white" />
      case "broken":
        return <XCircle className="w-6 h-6 text-white" />
      case "cracked":
        return <AlertCircle className="w-6 h-6 text-white" />
      default:
        return null
    }
  }

  // Helper function to get color for size categories
  const getSizeColorClass = (size: string) => {
    switch (size.toLowerCase()) {
      case "small":
        return {
          bg: "bg-blue-100/90",
          border: "border-blue-200",
          text: "text-blue-700",
          gradient: "from-blue-500 to-blue-600",
          fill: "bg-blue-500",
        }
      case "medium":
        return {
          bg: "bg-cyan-100/90",
          border: "border-cyan-200",
          text: "text-cyan-700",
          gradient: "from-cyan-500 to-cyan-600",
          fill: "bg-cyan-500",
        }
      case "large":
        return {
          bg: "bg-teal-100/90",
          border: "border-teal-200",
          text: "text-teal-700",
          gradient: "from-teal-500 to-teal-600",
          fill: "bg-teal-500",
        }
      case "xl":
        return {
          bg: "bg-indigo-100/90",
          border: "border-indigo-200",
          text: "text-indigo-700",
          gradient: "from-indigo-500 to-indigo-600",
          fill: "bg-indigo-500",
        }
      case "jumbo":
        return {
          bg: "bg-purple-100/90",
          border: "border-purple-200",
          text: "text-purple-700",
          gradient: "from-purple-500 to-purple-600",
          fill: "bg-purple-500",
        }
      default:
        return {
          bg: "bg-gray-100/90",
          border: "border-gray-200",
          text: "text-gray-700",
          gradient: "from-gray-500 to-gray-600",
          fill: "bg-gray-500",
        }
    }
  }

  return (
    <div className="min-h-screen bg-[#0e5f97] pt-4 px-4 pb-4 flex flex-col items-center relative overflow-hidden">
      {/* Dynamic background with floating particles */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0wIDMwaDMwdjMwSDB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwSDB2MzBoMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwaDMwdjMwSDMweiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iLjUiLz48L2c+PC9zdmc+')] opacity-70"></div>

      {/* Animated egg shapes in background */}
      <div
        className="absolute top-1/4 right-1/4 w-64 h-80 bg-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] blur-3xl animate-pulse opacity-20"
        style={{ animationDuration: "8s" }}
      ></div>
      <div
        className="absolute bottom-1/4 left-1/4 w-64 h-80 bg-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] blur-3xl animate-pulse opacity-20"
        style={{ animationDuration: "10s", animationDelay: "2s" }}
      ></div>

      {/* Main card */}
      <div
        className={`max-w-3xl w-full transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Card with glass morphism effect */}
        <div className="relative backdrop-blur-sm bg-white/90 rounded-2xl shadow-2xl overflow-hidden border border-white/50 h-[440px]">
          {/* Holographic overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

          {/* Animated edge glow */}
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl animate-border-glow"></div>
          </div>

          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            ></div>
          </div>

          {/* Content container */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Redesigned batch info panel */}
            {showBatchInfo && (
              <div className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg z-30 border-b border-[#0e5f97]/10 animate-slide-down-smooth">
                <div className="p-4">
                  {/* Header with close button */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0e5f97]/20 to-[#0e5f97]/5 flex items-center justify-center transform transition-transform hover:scale-110 duration-300">
                        <BarChart2 className="w-5 h-5 text-[#0e5f97]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#0e5f97]">Batch Statistics</h3>
                        <p className="text-xs text-gray-500">
                          Batch {currentBatch.batch_number} • {currentBatch.total_count} eggs
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleBatchInfo}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-300 transform hover:rotate-90 hover:scale-110"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Tab navigation */}
                  <div className="flex border-b border-gray-200 mb-4 relative">
                    <button
                      className={`px-4 py-2 font-medium text-sm relative transition-all duration-300 ${
                        activeTab === "quality" ? "text-[#0e5f97]" : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("quality")}
                    >
                      <div className="flex items-center gap-1.5">
                        <CircleDot
                          className={`w-4 h-4 transition-transform duration-300 ${activeTab === "quality" ? "scale-110" : ""}`}
                        />
                        <span>Quality</span>
                      </div>
                    </button>
                    <button
                      className={`px-4 py-2 font-medium text-sm relative transition-all duration-300 ${
                        activeTab === "size" ? "text-[#0e5f97]" : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("size")}
                    >
                      <div className="flex items-center gap-1.5">
                        <Scale
                          className={`w-4 h-4 transition-transform duration-300 ${activeTab === "size" ? "scale-110" : ""}`}
                        />
                        <span>Size</span>
                      </div>
                    </button>

                    {/* Animated underline indicator */}
                    <div
                      className="absolute bottom-0 h-0.5 bg-[#0e5f97] transition-all duration-300 ease-in-out"
                      style={{
                        left: activeTab === "quality" ? "0%" : "50%",
                        width: "50%",
                        transform: activeTab === "quality" ? "translateX(0%)" : "translateX(0%)",
                      }}
                    ></div>
                  </div>

                  {/* Quality tab content */}
                  <div
                    className={`transition-all duration-500 ease-in-out ${
                      activeTab === "quality"
                        ? "opacity-100 translate-y-0"
                        : "absolute opacity-0 -translate-y-4 pointer-events-none"
                    }`}
                    style={{ display: activeTab === "quality" ? "block" : "none" }}
                  >
                    <div className="grid grid-cols-4 gap-3">
                      {Object.entries(currentBatch.quality_counts).map(([type, count]) => {
                        const percentage =
                          currentBatch.total_count > 0 ? Math.round((count / currentBatch.total_count) * 100) : 0

                        return (
                          <div
                            key={type}
                            className={`rounded-xl p-3 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-500 border transform hover:scale-[1.02] hover:-translate-y-0.5 ${
                              type === "good"
                                ? "bg-green-50/80 hover:bg-green-50 border-green-200"
                                : type === "dirty"
                                  ? "bg-yellow-50/80 hover:bg-yellow-50 border-yellow-200"
                                  : type === "broken"
                                    ? "bg-red-50/80 hover:bg-red-50 border-red-200"
                                    : "bg-orange-50/80 hover:bg-orange-50 border-orange-200"
                            }`}
                          >
                            {/* Highlight effect on hover */}
                            <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            {/* Subtle pattern background */}
                            <div className="absolute inset-0 opacity-5">
                              <div
                                className="absolute inset-0"
                                style={{
                                  backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iIzAwMCIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIvPjwvZz48L3N2Zz4=')`,
                                  backgroundSize: "20px 20px",
                                }}
                              ></div>
                            </div>

                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center">
                                  <div
                                    className={`w-3 h-3 rounded-full mr-1 group-hover:scale-125 transition-transform duration-300 ${
                                      type === "good"
                                        ? "bg-green-500"
                                        : type === "dirty"
                                          ? "bg-yellow-500"
                                          : type === "broken"
                                            ? "bg-red-500"
                                            : "bg-orange-500"
                                    }`}
                                  ></div>
                                  <span
                                    className={`text-sm font-semibold capitalize ${
                                      type === "good"
                                        ? "text-green-700"
                                        : type === "dirty"
                                          ? "text-yellow-700"
                                          : type === "broken"
                                            ? "text-red-700"
                                            : "text-orange-700"
                                    }`}
                                  >
                                    {type}
                                  </span>
                                </div>
                                <span
                                  className={`text-xs font-medium ${
                                    type === "good"
                                      ? "text-green-700"
                                      : type === "dirty"
                                        ? "text-yellow-700"
                                        : type === "broken"
                                          ? "text-red-700"
                                          : "text-orange-700"
                                  }`}
                                >
                                  {percentage}%
                                </span>
                              </div>
                              <div className="flex items-end justify-between">
                                <span
                                  className={`text-xl font-bold ${
                                    type === "good"
                                      ? "text-green-700"
                                      : type === "dirty"
                                        ? "text-yellow-700"
                                        : type === "broken"
                                          ? "text-red-700"
                                          : "text-orange-700"
                                  } group-hover:scale-110 transition-transform duration-300`}
                                >
                                  {count}
                                </span>
                                <div className="h-10 w-full max-w-[60px]">
                                  <div className="h-full bg-white/50 rounded-md relative overflow-hidden shadow-inner">
                                    <div
                                      className={`absolute bottom-0 left-0 right-0 animate-fill-bar ${
                                        type === "good"
                                          ? "bg-gradient-to-t from-green-500 to-green-400"
                                          : type === "dirty"
                                            ? "bg-gradient-to-t from-yellow-500 to-yellow-400"
                                            : type === "broken"
                                              ? "bg-gradient-to-t from-red-500 to-red-400"
                                              : "bg-gradient-to-t from-orange-500 to-orange-400"
                                      }`}
                                      style={{
                                        height: "0%", // Start at 0% for animation
                                        transition: "height 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                      }}
                                      data-percentage={`${Math.max(percentage, 5)}%`}
                                    >
                                      {/* Bubbles effect */}
                                      <div className="absolute inset-0 overflow-hidden opacity-70">
                                        {[...Array(3)].map((_, i) => (
                                          <div
                                            key={i}
                                            className="absolute bg-white/30 rounded-full animate-float-bubble"
                                            style={{
                                              width: `${Math.random() * 6 + 3}px`,
                                              height: `${Math.random() * 6 + 3}px`,
                                              left: `${Math.random() * 100}%`,
                                              animationDelay: `${Math.random() * 2}s`,
                                              animationDuration: `${Math.random() * 2 + 1.5}s`,
                                            }}
                                          ></div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Size tab content */}
                  <div
                    className={`transition-all duration-500 ease-in-out ${
                      activeTab === "size"
                        ? "opacity-100 translate-y-0"
                        : "absolute opacity-0 -translate-y-4 pointer-events-none"
                    }`}
                    style={{ display: activeTab === "size" ? "block" : "none" }}
                  >
                    <div className="grid grid-cols-5 gap-3">
                      {Object.entries(currentBatch.size_counts).map(([size, count]) => {
                        const percentage =
                          currentBatch.total_count > 0 ? Math.round((count / currentBatch.total_count) * 100) : 0
                        const colorClass = getSizeColorClass(size)
                        const weightRange = currentBatch.weight_ranges[size as keyof typeof currentBatch.weight_ranges]

                        return (
                          <div
                            key={size}
                            className={`rounded-xl p-3 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-500 border transform hover:scale-[1.02] hover:-translate-y-0.5 ${colorClass.bg} ${colorClass.border}`}
                          >
                            {/* Highlight effect on hover */}
                            <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            {/* Subtle pattern background */}
                            <div className="absolute inset-0 opacity-5">
                              <div
                                className="absolute inset-0"
                                style={{
                                  backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iIzAwMCIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIvPjwvZz48L3N2Zz4=')`,
                                  backgroundSize: "20px 20px",
                                }}
                              ></div>
                            </div>

                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center">
                                  <div
                                    className={`w-3 h-3 rounded-full mr-1 ${colorClass.fill} group-hover:scale-125 transition-transform duration-300`}
                                  ></div>
                                  <span className={`text-sm font-semibold capitalize ${colorClass.text}`}>{size}</span>
                                </div>
                                <span className={`text-xs font-medium ${colorClass.text}`}>{percentage}%</span>
                              </div>
                              <div className="flex items-end justify-between">
                                <div className="flex flex-col">
                                  <span
                                    className={`text-xl font-bold ${colorClass.text} group-hover:scale-110 transition-transform duration-300`}
                                  >
                                    {count}
                                  </span>
                                  <span className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-700 transition-colors duration-300">
                                    {weightRange}
                                  </span>
                                </div>
                                <div className="h-10 w-full max-w-[40px]">
                                  <div className="h-full bg-white/50 rounded-md relative overflow-hidden shadow-inner">
                                    <div
                                      className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${colorClass.gradient} animate-fill-bar`}
                                      style={{
                                        height: "0%", // Start at 0% for animation
                                        transition: "height 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                      }}
                                      data-percentage={`${Math.max(percentage, 5)}%`}
                                    >
                                      {/* Bubbles effect */}
                                      <div className="absolute inset-0 overflow-hidden opacity-70">
                                        {[...Array(3)].map((_, i) => (
                                          <div
                                            key={i}
                                            className="absolute bg-white/30 rounded-full animate-float-bubble"
                                            style={{
                                              width: `${Math.random() * 6 + 3}px`,
                                              height: `${Math.random() * 6 + 3}px`,
                                              left: `${Math.random() * 100}%`,
                                              animationDelay: `${Math.random() * 2}s`,
                                              animationDuration: `${Math.random() * 2 + 1.5}s`,
                                            }}
                                          ></div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main video container - flex-1 to take remaining space */}
            <div className="flex-1 relative bg-black overflow-hidden">
              {/* Video feed */}
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                style={{ transform: isMirrorMode ? "scaleX(-1)" : "none" }}
                playsInline
                muted
              />

              {/* Canvas overlay for detection */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />

              {/* Right side panel with detection results and egg classification */}
              <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10 w-[280px] max-w-[280px]">
                {/* Quality detection result */}
                {detectionResult && detectionResult.prediction && isCameraOn && !isProcessing ? (
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-white/50 mb-3 animate-fade-in-right">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradientClass(
                          detectionResult.prediction,
                        )} flex items-center justify-center shadow-lg`}
                      >
                        {getResultIcon(detectionResult.prediction)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-lg font-bold capitalize ${getTextColorClass(detectionResult.prediction)}`}
                          >
                            {detectionResult.prediction}
                          </span>
                          {detectionResult.confidence !== null && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full font-medium border shadow-sm text-black">
                              {detectionResult.confidence.toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {detectionResult.prediction === "good"
                            ? "No visible defects detected"
                            : `Classified as ${detectionResult.prediction.toLowerCase()}`}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2"></div>

                    {/* Weight and Size Classification */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500">Weight</span>
                        <span className="text-xl font-bold text-[#0e5f97]">62g</span>
                      </div>
                      <div className="h-14 w-px bg-gray-200"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500">Size</span>
                        <span className="text-xl font-bold text-[#0e5f97]">Large</span>
                        <span className="text-xs text-gray-500 mt-0.5">50-60g range</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  isCameraOn &&
                  !isProcessing && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-white/50 animate-fade-in-right">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shadow-lg">
                          <Camera className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-700">Awaiting Detection</p>
                          <p className="text-sm text-gray-500">Position egg in the center</p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2"></div>

                      {/* Weight and Size Classification placeholder */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-500">Weight</span>
                          <span className="text-xl font-bold text-gray-400">--</span>
                        </div>
                        <div className="h-14 w-px bg-gray-200"></div>
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-500">Size</span>
                          <span className="text-xl font-bold text-gray-400">--</span>
                          <span className="text-xs text-gray-500 mt-0.5 opacity-50">Classification</span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Camera off state */}
              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4 bg-black/70">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl max-w-xs w-full border border-white/50">
                    <div className="relative mb-4">
                      {/* Animated rings */}
                      <div
                        className="absolute inset-[-12px] rounded-full border-2 border-[#0e5f97]/20 animate-ping-slow opacity-70"
                        style={{ animationDuration: "3s" }}
                      ></div>
                      <div
                        className="absolute inset-[-8px] rounded-full border-2 border-[#0e5f97]/10 animate-ping-slow opacity-50"
                        style={{ animationDuration: "4s" }}
                      ></div>

                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#0e5f97]/20 to-[#0e5f97]/5 flex items-center justify-center">
                        <Camera className="w-10 h-10 text-[#0e5f97]" />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-[#0e5f97] mb-1">Camera is off</p>
                    <p className="text-gray-500 mb-6 text-sm">Press play to start detection</p>
                    <button
                      onClick={toggleCamera}
                      className="bg-gradient-to-r from-[#0e5f97] to-[#083d66] hover:from-[#0e5f97]/90 hover:to-[#083d66]/90 text-white px-6 py-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 mx-auto transform hover:scale-105 active:scale-95 w-full text-lg font-medium relative overflow-hidden group"
                      disabled={readyState !== WebSocket.OPEN}
                    >
                      {/* Button shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full"></div>
                      <Play className="w-6 h-6" />
                      <span className="relative z-10">Start Camera</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Processing overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                  <div className="relative w-20 h-20 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                    <div
                      className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin"
                      style={{ animationDuration: "1s" }}
                    ></div>
                  </div>
                  <div className="text-white font-medium text-2xl mb-2">Analyzing Egg</div>
                  <div className="text-white/70 text-lg mb-6">Please wait...</div>
                  <div className="w-64 h-3 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Top navigation bar - overlaid on video */}
              <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                  <Link
                    href="/"
                    className="bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 p-3 rounded-xl shadow-lg text-[#0e5f97] flex items-center justify-center transform hover:scale-105 active:scale-95 border border-white/50"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </Link>

                  {/* Batch info button */}
                  <button
                    onClick={toggleBatchInfo}
                    className="flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 p-2 px-4 rounded-xl shadow-lg border border-white/50 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0e5f97]/20 to-[#0e5f97]/5 flex items-center justify-center shadow-sm">
                      <BarChart2 className="w-5 h-5 text-[#0e5f97] group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-bold text-[#0e5f97]">Batch {currentBatch.batch_number}</span>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{currentBatch.total_count} eggs</span>
                      </div>
                    </div>
                    {showBatchInfo ? (
                      <ChevronUp className="w-5 h-5 text-[#0e5f97]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#0e5f97]" />
                    )}
                  </button>
                </div>

                {/* Right side - Status indicators and complete button */}
                <div className="flex items-center gap-3">
                  <StatusIndicator
                    isActive={isOnline}
                    activeIcon={<Wifi className="w-5 h-5 text-green-400 relative z-10" />}
                    inactiveIcon={<WifiOff className="w-5 h-5 text-red-400 relative z-10" />}
                  />
                  <StatusIndicator
                    isActive={readyState === WebSocket.OPEN}
                    activeIcon={<Plug className="w-5 h-5 text-green-400 relative z-10" />}
                    inactiveIcon={<PlugOff className="w-5 h-5 text-red-400 relative z-10" />}
                  />
                  <button
                    onClick={handleCompleteBatch}
                    className="bg-white/80 backdrop-blur-sm hover:bg-white/90 text-[#0e5f97] px-4 py-3 rounded-xl shadow-lg transition-all duration-300 font-medium transform hover:scale-105 active:scale-95 flex items-center gap-2 relative overflow-hidden group border border-white/50"
                  >
                    {/* Button shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0e5f97]/0 via-[#0e5f97]/5 to-[#0e5f97]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full"></div>
                    <Archive className="w-5 h-5" />
                    <span className="relative z-10">Complete</span>
                  </button>
                </div>
              </div>

              {/* Bottom control bar - overlaid on video */}
              <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-center z-20">
                {/* Left side controls */}
                <div className="flex gap-3 items-center">
                  {/* Camera toggle button */}
                  <button
                    onClick={toggleCamera}
                    className={`${
                      isCameraOn ? "bg-red-500/80 hover:bg-red-600/80" : "bg-[#0e5f97]/80 hover:bg-[#0c4d7a]/80"
                    } backdrop-blur-sm transition-all duration-300 p-4 rounded-2xl shadow-lg text-white flex items-center justify-center w-16 h-16 transform hover:scale-105 active:scale-95 relative overflow-hidden group border border-white/30`}
                    disabled={readyState !== WebSocket.OPEN}
                  >
                    {/* Button shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full"></div>
                    {isCameraOn ? (
                      <Pause className="w-8 h-8 relative z-10" />
                    ) : (
                      <Play className="w-8 h-8 relative z-10" />
                    )}
                  </button>

                  {/* Additional controls - only show when camera is on */}
                  {isCameraOn && (
                    <>
                      <button
                        onClick={toggleMirrorMode}
                        className="bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 p-3 rounded-xl shadow-lg border border-white/50 text-[#0e5f97] flex items-center justify-center w-14 h-14 transform hover:scale-105 active:scale-95 group"
                      >
                        <FlipVertical className="w-7 h-7 group-hover:rotate-180 transition-transform duration-500" />
                      </button>
                      <button
                        onClick={triggerManualDetection}
                        className="bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 p-3 rounded-xl shadow-lg border border-white/50 text-[#0e5f97] flex items-center justify-center w-14 h-14 transform hover:scale-105 active:scale-95 group"
                        disabled={isProcessing}
                      >
                        <RefreshCw
                          className={`w-7 h-7 ${isProcessing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
                        />
                      </button>
                    </>
                  )}
                </div>

                {/* Right side controls */}
                <div className="flex gap-3">
                  {isCameraOn && (
                    <>
                      <button
                        onClick={toggleFullscreen}
                        className="bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 p-3 rounded-xl shadow-lg border border-white/50 text-[#0e5f97] flex items-center justify-center w-14 h-14 transform hover:scale-105 active:scale-95 group"
                      >
                        <Maximize2 className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
                      </button>
                      <button className="bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 p-3 rounded-xl shadow-lg border border-white/50 text-[#0e5f97] flex items-center justify-center w-14 h-14 transform hover:scale-105 active:scale-95 group">
                        <ZoomIn className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
                      </button>
                      <button className="bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 p-3 rounded-xl shadow-lg border border-white/50 text-[#0e5f97] flex items-center justify-center w-14 h-14 transform hover:scale-105 active:scale-95 group">
                        <Settings className="w-7 h-7 group-hover:rotate-90 transition-transform duration-500" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-t-2 border-l-2 border-[#0e5f97]/30 rounded-tl-2xl"></div>
            <div className="absolute top-2 left-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16">
            <div className="absolute top-0 right-0 w-full h-full border-t-2 border-r-2 border-[#0e5f97]/30 rounded-tr-2xl"></div>
            <div className="absolute top-2 right-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-16 h-16">
            <div className="absolute bottom-0 left-0 w-full h-full border-b-2 border-l-2 border-[#0e5f97]/30 rounded-bl-2xl"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 right-0 w-16 h-16">
            <div className="absolute bottom-0 right-0 w-full h-full border-b-2 border-r-2 border-[#0e5f97]/30 rounded-br-2xl"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 animate-slide-down">
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-base flex items-center gap-2 shadow-lg">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Add keyframes for animations */}
      <style jsx global>{`
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 0.4; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); }
          20%, 100% { transform: translateX(100%); }
        }
        
        @keyframes border-glow {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(14, 95, 151, 0.3),
                        0 0 10px rgba(14, 95, 151, 0.2),
                        0 0 15px rgba(14, 95, 151, 0.1);
          }
          50% { 
            box-shadow: 0 0 10px rgba(14, 95, 151, 0.5),
                        0 0 20px rgba(14, 95, 151, 0.3),
                        0 0 30px rgba(14, 95, 151, 0.2);
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scanline {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(1000%);
          }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        
        @keyframes float-bubble {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        .animate-slide-down {
          animation: slide-down 0.4s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }
        
        .animate-scanline {
          animation: scanline 4s linear infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }

        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .animate-fade-in-right {
          animation: fade-in-right 0.5s ease-out forwards;
        }

        @keyframes slide-down-smooth {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-slide-down-smooth {
          animation: slide-down-smooth 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes tab-enter {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-tab-enter {
          animation: tab-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  )
}

// StatusIndicator component included directly in the file
function StatusIndicator({ isActive, activeIcon, inactiveIcon }: StatusIndicatorProps) {
  return (
    <div
      className={`relative flex items-center justify-center w-10 h-10 rounded-full 
                ${
                  isActive
                    ? "bg-gradient-to-br from-green-400/20 to-green-600/20 border border-green-400/30"
                    : "bg-gradient-to-br from-red-400/20 to-red-600/20 border border-red-400/30"
                } 
                shadow-sm transition-all duration-300`}
    >
      {/* Pulsing ring effect */}
      <div
        className={`absolute inset-0 rounded-full ${isActive ? "bg-green-400/10" : "bg-red-400/10"} 
                    animate-ping opacity-75`}
      ></div>

      {/* Icon */}
      {isActive ? activeIcon : inactiveIcon}
    </div>
  )
}

// Types
interface DetectionResult {
  prediction: string | null
  confidence: number | null
}

interface StatusIndicatorProps {
  isActive: boolean
  activeIcon: ReactNode
  inactiveIcon: ReactNode
}
