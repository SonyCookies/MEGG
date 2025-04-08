"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Play, Pause, Maximize, Minimize, FlipVerticalIcon as Flip } from "lucide-react"

const logger = (message) => {
  console.log(`[VideoDisplay] ${new Date().toISOString()}: ${message}`)
}

export default function VideoDisplay({
  isCameraOn,
  setIsCameraOn,
  readyState,
  machineId,
  setErrorMessage,
  onCaptureFrame,
  detectionResult,
  currentBatch,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMirrorMode, setIsMirrorMode] = useState(false)
  const videoRef = useRef(null)

  const stopVideoStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach((track) => {
        track.stop()
        logger(`Stopped track: ${track.kind}`)
      })
      videoRef.current.srcObject = null
    }
  }, [])

  const toggleCamera = async () => {
    if (readyState !== WebSocket.OPEN) {
      setErrorMessage("WebSocket is not connected. Please wait and try again.")
      return
    }

    if (!machineId) {
      setErrorMessage("Machine ID not available. Cannot start detection.")
      return
    }

    if (isCameraOn) {
      logger("Turning camera off")
      stopVideoStream()
      setIsCameraOn(false)
    } else {
      logger("Turning camera on")
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            logger("Video metadata loaded")
            videoRef.current.play().catch((e) => logger(`Error playing video: ${e}`))
          }
        }
        setIsCameraOn(true)
        logger("Camera turned on successfully")
      } catch (err) {
        logger(`Error accessing the camera: ${err.message}`)
        console.error("Error accessing the camera:", err)
        setErrorMessage(`Error accessing the camera: ${err.message}`)
      }
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      logger("Entering fullscreen mode for video")
      if (videoRef.current && videoRef.current.requestFullscreen) {
        videoRef.current
          .requestFullscreen({ navigationUI: "hide" })
          .then(() => {
            if (isMirrorMode) {
              videoRef.current.style.transform = "scaleX(-1)"
            }
          })
          .catch((err) => {
            logger(`Error attempting to enable fullscreen: ${err.message}`)
          })
      }
    } else {
      logger("Exiting fullscreen mode for video")
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const toggleMirrorMode = () => {
    setIsMirrorMode(!isMirrorMode)
    logger(`Mirror mode ${!isMirrorMode ? "enabled" : "disabled"}`)
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!document.fullscreenElement
      setIsFullscreen(isFullscreenNow)

      if (videoRef.current) {
        videoRef.current.style.transform = isMirrorMode ? "scaleX(-1)" : "none"
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [isMirrorMode])

  useEffect(() => {
    return () => {
      stopVideoStream()
    }
  }, [stopVideoStream])

  // Expose the video element to the parent component for frame capture
  useEffect(() => {
    if (videoRef.current) {
      onCaptureFrame(videoRef.current)
    }
  }, [onCaptureFrame])

  // Helper function to get color class based on prediction type
  const getColorClass = (type) => {
    if (!type) return "bg-gray-100/80"

    switch (type.toLowerCase()) {
      case "good":
        return "bg-green-100/90 border-green-200"
      case "dirty":
        return "bg-yellow-100/90 border-yellow-200"
      case "broken":
        return "bg-red-100/90 border-red-200"
      case "cracked":
        return "bg-orange-100/90 border-orange-200"
      default:
        return "bg-blue-100/90 border-blue-200"
    }
  }

  const getTextColorClass = (type) => {
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

  return (
    <div className="relative backdrop-blur-sm bg-white/90 rounded-xl shadow-lg overflow-hidden border border-white/50">
      {/* Holographic overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

      {/* Animated edge glow */}
      <div className="absolute inset-0 rounded-xl">
        <div className="absolute inset-0 rounded-xl animate-border-glow"></div>
      </div>

      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#0e5f97]/30 rounded-tl-xl"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#0e5f97]/30 rounded-tr-xl"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#0e5f97]/30 rounded-bl-xl"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#0e5f97]/30 rounded-br-xl"></div>

      <div className="relative z-10 p-4">
        <div className="aspect-video bg-gradient-to-br from-[#0e4772] to-[#0c3d62] rounded-lg flex items-center justify-center overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{
              display: isCameraOn ? "block" : "none",
              transform: isMirrorMode ? "scaleX(-1)" : "none",
            }}
          />

          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
              <div className="bg-black/30 backdrop-blur-sm p-4 rounded-lg">
                <p className="text-lg">Camera is off. Press play to start detection.</p>
              </div>
            </div>
          )}

          {/* Size Distribution Overlay - Top Left */}
          {currentBatch && (
            <div className="absolute top-4 left-4 max-w-[240px] z-10">
              <div className="p-3 rounded-lg border bg-blue-100/90 border-blue-200 shadow-md backdrop-blur-sm relative overflow-hidden">
                {/* Subtle grid pattern */}
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
                    backgroundSize: "15px 15px",
                  }}
                ></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-bold text-blue-700">Eggs Processed</span>
                    <span className="text-xs bg-white/90 px-2 py-0.5 rounded-full font-medium border shadow-sm">
                      {currentBatch.total_count}
                    </span>
                  </div>

                  <div className="space-y-1 mt-2">
                    {Object.entries(currentBatch.defect_counts).map(([type, count]) => {
                      if (count === 0) return null

                      const getColor = (type) => {
                        switch (type) {
                          case "good":
                            return "bg-green-500"
                          case "dirty":
                            return "bg-yellow-500"
                          case "broken":
                            return "bg-red-500"
                          case "cracked":
                            return "bg-orange-500"
                          default:
                            return "bg-blue-500"
                        }
                      }

                      const getTextColor = (type) => {
                        switch (type) {
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

                      const percentage =
                        currentBatch.total_count > 0 ? Math.round((count / currentBatch.total_count) * 100) : 0

                      return (
                        <div key={type} className="flex items-center justify-between text-xs">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full ${getColor(type)} mr-1`}></div>
                            <span className={`capitalize ${getTextColor(type)}`}>{type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{count}</span>
                            <span className="text-gray-500">({percentage}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detection Result Overlay - Bottom Right */}
          {detectionResult && detectionResult.prediction && (
            <div className="absolute bottom-4 right-4 max-w-[240px] z-10">
              <div
                className={`p-3 rounded-lg border shadow-md ${getColorClass(detectionResult.prediction)} backdrop-blur-sm relative overflow-hidden`}
              >
                {/* Subtle grid pattern */}
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
                    backgroundSize: "15px 15px",
                  }}
                ></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-base font-bold capitalize ${getTextColorClass(detectionResult.prediction)}`}>
                      {detectionResult.prediction}
                    </span>
                    {detectionResult.confidence !== null && (
                      <span className="text-xs bg-white/90 px-2 py-0.5 rounded-full font-medium border shadow-sm">
                        {detectionResult.confidence.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700">
                    {detectionResult.prediction === "good"
                      ? "No visible defects detected"
                      : `Classified as ${detectionResult.prediction.toLowerCase()}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fullscreen button - positioned on the video */}
          {isCameraOn && (
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 bg-[#0e5f97] text-white p-2 rounded-full hover:bg-[#0e4772] transition-colors shadow-md z-20"
            >
              {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
            </button>
          )}

          {!machineId && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm text-white text-center p-4">
              <p className="bg-[#0e5f97]/80 px-4 py-3 rounded-lg">Machine ID not available. Detection is disabled.</p>
            </div>
          )}
        </div>

        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
          <button
            onClick={toggleCamera}
            className={`bg-gradient-to-r from-[#0e5f97] to-[#0e4772] text-white p-2 rounded-full hover:shadow-md transition-all duration-300 ${
              !machineId ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!machineId}
          >
            {isCameraOn ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          {isCameraOn && (
            <button
              onClick={toggleMirrorMode}
              className="bg-gradient-to-r from-[#0e5f97] to-[#0e4772] text-white p-2 rounded-full hover:shadow-md transition-all duration-300"
            >
              <Flip className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
