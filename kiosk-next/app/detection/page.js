"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Play, Pause, Maximize, Minimize, FlipVerticalIcon as Flip } from "lucide-react"
import { useWebSocket } from "../contexts/WebSocketContext"
import { useInternetConnection } from "../contexts/InternetConnectionContext"
import { db, storage } from "../firebaseConfig"
import { collection, addDoc } from "firebase/firestore"
import { ref, uploadString } from "firebase/storage"
import { addDefectLog, addImageRecord } from "../indexedDB"
import { ConnectionStatus } from "../components/ConnectionStatus"
// import { NoInternetState } from "../components/NoInternetState"

const logger = (message) => {
  console.log(`[DetectionPage] ${new Date().toISOString()}: ${message}`)
}

const generateBatchNumber = () => {
  const date = new Date()
  return `B${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`
}

export default function DetectionPage() {
  const { readyState, lastMessage, sendMessage } = useWebSocket()
  const isOnline = useInternetConnection()
  const [detectionResult, setDetectionResult] = useState({ prediction: null, confidence: null })
  const [defectCounts, setDefectCounts] = useState({
    good: 0,
    dirty: 0,
    broken: 0,
    cracked: 0,
  })
  const [uploadStatus, setUploadStatus] = useState("")
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMirrorMode, setIsMirrorMode] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [batchNumber, setBatchNumber] = useState(generateBatchNumber())
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const frameIntervalRef = useRef(null)
  const lastProcessedMessageId = useRef(null)

  const captureAndSendFrame = useCallback(() => {
    logger(`Attempting to capture frame. Camera on: ${isCameraOn}, WebSocket ready: ${readyState === WebSocket.OPEN}`)
    if (videoRef.current && readyState === WebSocket.OPEN && isCameraOn) {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext("2d")
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      const imageData = canvas.toDataURL("image/jpeg")

      logger(`Imagedata ${imageData}`)

      sendMessage({
        action: "defect_detection",
        image: imageData,
      })

      logger("Frame sent to WebSocket server")
    } else {
      logger("Conditions not met for sending frame to websocket")
    }
  }, [readyState, sendMessage, isCameraOn])

  const captureAndSendFrameWithDelay = useCallback(() => {
    const sendFrame = () => {
      captureAndSendFrame()
      frameIntervalRef.current = setTimeout(sendFrame, 5000)
    }

    frameIntervalRef.current = setTimeout(sendFrame, 5000)
  }, [captureAndSendFrame])

  const stopVideoStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach((track) => {
        track.stop()
        logger(`Stopped track: ${track.kind}`)
      })
      videoRef.current.srcObject = null
    }
    if (frameIntervalRef.current) {
      clearTimeout(frameIntervalRef.current)
      frameIntervalRef.current = null
    }
  }, [])

  const toggleCamera = async () => {
    if (readyState !== WebSocket.OPEN) {
      setErrorMessage("WebSocket is not connected. Please wait and try again.")
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

  const ErrorMessage = ({ message }) => {
    if (!message) return null

    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <span className="block sm:inline">{message}</span>
      </div>
    )
  }

  const saveDefectLog = useCallback(
    async (defectType, confidenceScore, imageId) => {
      const defectLog = {
        batch_number: batchNumber,
        confidence_score: confidenceScore,
        defect_type: defectType,
        device_id: "device_001", // Replace with actual device ID
        image_id: imageId,
        synced: isOnline,
        timestamp: new Date().toISOString(),
      }

      try {
        if (isOnline) {
          await addDoc(collection(db, "defect_logs"), defectLog)
          logger("Defect log saved to Firebase")
        } else {
          await addDefectLog(defectLog)
          logger("Defect log saved to IndexedDB")
        }
      } catch (error) {
        logger(`Error saving defect log: ${error.message}`)
        setErrorMessage(`Failed to save defect log: ${error.message}`)
      }
    },
    [isOnline, batchNumber],
  )

  const saveImageRecord = useCallback(
    async (imageData) => {
      if (!imageData) {
        logger("No image data received")
        return null
      }

      const formattedImageData = imageData.startsWith("data:image/") ? imageData : `data:image/jpeg;base64,${imageData}`

      const imageId = `${Date.now()}.jpg`
      const storagePath = `images/${batchNumber}/${imageId}`

      const imageRecord = {
        batch_number: batchNumber,
        storage_path: storagePath,
        timestamp: new Date().toISOString(),
        uploaded: isOnline,
      }

      try {
        if (isOnline) {
          const storageRef = ref(storage, storagePath)
          await uploadString(storageRef, formattedImageData, "data_url")
          await addDoc(collection(db, "image_records"), imageRecord)
          logger("Image record saved to Firebase")
        } else {
          await addImageRecord({ ...imageRecord, imageData: formattedImageData })
          logger("Image record saved to IndexedDB")
        }
        return imageId
      } catch (error) {
        logger(`Error saving image record: ${error.message}`)
        setErrorMessage(`Failed to save image: ${error.message}`)
        return null
      }
    },
    [isOnline, batchNumber],
  )

  useEffect(() => {
    if (
      lastMessage &&
      lastMessage.action === "defect_detection_result" &&
      lastMessage.id !== lastProcessedMessageId.current
    ) {
      logger(`Received detection result: ${JSON.stringify(lastMessage)}`)

      setDetectionResult({
        prediction: lastMessage.defects[0],
        confidence: lastMessage.confidence * 100,
      })
      setDefectCounts((prevCounts) => ({
        ...prevCounts,
        [lastMessage.defects[0]]: prevCounts[lastMessage.defects[0]] + 1,
      }))

      setUploadStatus("Uploading....")
      const saveData = async () => {
        const imageId = await saveImageRecord(lastMessage.image)
        if (imageId) {
          await saveDefectLog(lastMessage.defects[0], lastMessage.confidence, imageId)
          setUploadStatus("Upload successful!")
          setTimeout(() => {
            setUploadStatus("")
          }, 3000)
        } else {
          setUploadStatus("Upload failed")
          setTimeout(() => {
            setUploadStatus("")
          }, 3000)
        }
      }
      saveData()

      // Update the last processed message ID
      lastProcessedMessageId.current = lastMessage.id
    }
  }, [lastMessage, saveDefectLog, saveImageRecord])

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

  useEffect(() => {
    if (isCameraOn) {
      logger("Camera turned on, waiting 5 seconds before starting frame capture")
      const initialDelay = setTimeout(() => {
        logger("Starting frame capture")
        captureAndSendFrameWithDelay()
      }, 5000)

      return () => {
        logger("Stopping frame capture")
        clearTimeout(initialDelay)
        if (frameIntervalRef.current) {
          clearTimeout(frameIntervalRef.current)
          frameIntervalRef.current = null
        }
      }
    }
  }, [captureAndSendFrameWithDelay, isCameraOn])

  useEffect(() => {
    if (readyState === WebSocket.OPEN) {
      setErrorMessage("")
    }
  }, [readyState])

  useEffect(() => {
    const interval = setInterval(() => {
      setBatchNumber(generateBatchNumber())
    }, 3600000) // 1 hour in milliseconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4" ref={containerRef}>
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link href="/home" className="text-[#0e5f97] hover:text-[#0e4772] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-[#0e5f97]">Defect Detection</h1>
          <div className="w-6 h-6" />
        </header>

        <ConnectionStatus isOnline={isOnline} readyState={readyState} />

        <>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-[#fcfcfd] rounded-xl shadow-md p-4 relative">
              <div className="aspect-video bg-[#0e4772] rounded-lg flex items-center justify-center overflow-hidden relative">
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
                <button
                  onClick={toggleFullscreen}
                  className="absolute bottom-4 right-4 bg-[#0e5f97] text-white p-2 rounded-full hover:bg-[#0e4772] transition-colors"
                >
                  {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                </button>
              </div>
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button
                  onClick={toggleCamera}
                  className="bg-[#0e5f97] text-white p-2 rounded-full hover:bg-[#0e4772] transition-colors"
                >
                  {isCameraOn ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                {isCameraOn && (
                  <button
                    onClick={toggleMirrorMode}
                    className="bg-[#0e5f97] text-white p-2 rounded-full hover:bg-[#0e4772] transition-colors"
                  >
                    <Flip className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#fcfcfd] rounded-xl shadow-md p-4">
                <h3 className="text-lg font-semibold text-[#0e5f97] mb-3">Latest Detection</h3>
                <div className="p-3 bg-[#e6f7ff] rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[#0e5f97] font-medium">
                      {detectionResult.prediction || "No detection yet"}
                    </span>
                    {detectionResult.confidence !== null && (
                      <span className="text-xs bg-[#0e5f97] text-white px-2 py-0.5 rounded-full">
                        {detectionResult.confidence.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-[#fcfcfd] rounded-xl shadow-md p-4">
                <h2 className="text-lg font-semibold text-[#0e5f97] mb-4">Egg Counter</h2>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(defectCounts).map(([type, count]) => (
                    <div key={type} className="bg-[#f0f4f8] rounded-lg p-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-[#171717] capitalize">{type}</span>
                      <span className="font-bold text-sm text-[#0e5f97]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <ErrorMessage message={errorMessage} />

          <div className="mt-4 bg-[#fcfcfd] rounded-lg p-4 shadow-md">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  uploadStatus.includes("success") ? "bg-blue-500 animate-pulse" : "bg-gray-300"
                }`}
              />
              <span className="text-sm text-[#171717]/60">Upload Status:</span>
              <span className="text-[#0e5f97] font-medium">
                {uploadStatus || (isOnline ? "Waiting..." : "Will sync when online")}
              </span>
            </div>
            {!isOnline && (
              <p className="text-xs text-gray-500 mt-2">
                Detection data will be stored locally and synchronized when internet connection is restored.
              </p>
            )}
          </div>
        </>
        
      </div>
    </div>
  )
}

