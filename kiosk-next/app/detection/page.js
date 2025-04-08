"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Wifi, WifiOff, Plug, PlugIcon as PlugOff } from "lucide-react"
import { useWebSocket } from "../contexts/WebSocketContext"
import { useInternetConnection } from "../contexts/InternetConnectionContext"
import { db, storage } from "../firebaseConfig"
import { collection, addDoc } from "firebase/firestore"
import { ref, uploadString } from "firebase/storage"
import { addDefectLog, addImageRecord } from "../indexedDB"
import { BarChart2, Clock, Archive } from "lucide-react"

// Import components
import VideoDisplay from "./components/VideoDisplay"
import ErrorMessage from "./components/ErrorMessage"
import UploadStatus from "./components/UploadStatus"
import BatchSelectionModal from "./components/BatchSelectionModal"

// Import hooks and utilities
import useFrameCapture from "./hooks/useFrameCapture"
import useMachineId from "./hooks/useMachineId"
import useBatchManagement from "./hooks/useBatchManagement"
import { logger, getLastProcessedMessageId, setLastProcessedMessageId } from "./utils"

const log = logger("DetectionPage")

export default function DetectionPage() {
  const router = useRouter()
  const { readyState, lastMessage, sendMessage } = useWebSocket()
  const isOnline = useInternetConnection()
  const [detectionResult, setDetectionResult] = useState({ prediction: null, confidence: null })
  const [uploadStatus, setUploadStatus] = useState("")
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [showBatchModal, setShowBatchModal] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const containerRef = useRef(null)
  const lastProcessedMessageId = useRef(getLastProcessedMessageId())

  // Use custom hooks
  const { machineId, machineIdStatus } = useMachineId(setErrorMessage)
  const { setVideoElement, startCapture, stopCapture } = useFrameCapture(readyState, sendMessage, isCameraOn)
  const {
    batches,
    currentBatch,
    isLoading: isLoadingBatches,
    error: batchError,
    createBatch,
    selectBatch,
    updateBatchCounts,
    completeBatch,
  } = useBatchManagement(machineId)

  // Trigger animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Reset batch selection state when page is loaded
  useEffect(() => {
    setShowBatchModal(true)
    log("Detection page loaded - showing batch selection modal")

    return () => {
      log("Detection page unmounted")
    }
  }, [])

  // Handle batch errors
  useEffect(() => {
    if (batchError) {
      setErrorMessage(batchError)
    }
  }, [batchError])

  // Clear WebSocket message on initial mount
  useEffect(() => {
    if (isInitialMount) {
      if (lastMessage) {
        setLastProcessedMessageId(lastMessage.id)
        lastProcessedMessageId.current = lastMessage.id
        log(`Marked existing message as processed: ${lastMessage.id}`)
      }
      setIsInitialMount(false)
    }
  }, [isInitialMount, lastMessage])

  // Store the last processed message ID in the global variable when unmounting
  useEffect(() => {
    return () => {
      if (lastProcessedMessageId.current) {
        setLastProcessedMessageId(lastProcessedMessageId.current)
        log(`Stored last processed message ID before unmount: ${lastProcessedMessageId.current}`)
      }
    }
  }, [])

  useEffect(() => {
    if (isCameraOn) {
      log("Camera turned on, waiting 5 seconds before starting frame capture")
      const initialDelay = setTimeout(() => {
        log("Starting frame capture")
        startCapture()
      }, 5000)

      return () => {
        log("Stopping frame capture")
        clearTimeout(initialDelay)
        stopCapture()
      }
    }
  }, [isCameraOn, startCapture, stopCapture])

  useEffect(() => {
    if (readyState === WebSocket.OPEN) {
      setErrorMessage("")
    }
  }, [readyState])

  // Custom wrapper for createBatch to handle modal closing
  const handleCreateBatch = async () => {
    const newBatch = await createBatch("") // Pass empty string instead of notes
    if (newBatch) {
      setShowBatchModal(false)
      log(`New batch created: ${newBatch.batch_number}`)
    }
  }

  // Custom wrapper for selectBatch to handle modal closing
  const handleSelectBatch = (batchId) => {
    const success = selectBatch(batchId)
    if (success) {
      setShowBatchModal(false)
      log(`Existing batch selected with ID: ${batchId}`)
    }
  }

  const handleCompleteBatch = async () => {
    if (isCameraOn) {
      setIsCameraOn(false)
      stopCapture()
    }

    // Show a loading state or message
    setUploadStatus("Completing batch...")

    const success = await completeBatch()
    if (success) {
      log("Batch completed, redirecting to inventory page")

      // Set a brief timeout to allow the user to see the success message
      setTimeout(() => {
        // Navigate to the inventory page
        router.push("/inventory")
      }, 500)
    } else {
      // If completion failed, show error and reset
      setUploadStatus("Failed to complete batch")
      setTimeout(() => {
        setUploadStatus("")
      }, 3000)
    }
  }

  const saveDefectLog = useCallback(
    async (defectType, confidenceScore, imageId) => {
      if (!machineId) {
        log("Cannot save defect log: Machine ID not available")
        setErrorMessage("Cannot save defect log: Machine ID not available")
        return false
      }

      if (!currentBatch) {
        log("Cannot save defect log: No active batch")
        setErrorMessage("Cannot save defect log: No active batch")
        return false
      }

      const defectLog = {
        batch_id: currentBatch.id,
        machine_id: machineId,
        confidence_score: confidenceScore,
        defect_type: defectType,
        image_id: imageId,
        synced: isOnline,
        timestamp: new Date().toISOString(),
      }

      try {
        if (isOnline) {
          await addDoc(collection(db, "defect_logs"), defectLog)
          log("Defect log saved to Firebase")
        } else {
          await addDefectLog(defectLog)
          log("Defect log saved to IndexedDB")
        }
        return true
      } catch (error) {
        log(`Error saving defect log: ${error.message}`)
        setErrorMessage(`Failed to save defect log: ${error.message}`)
        return false
      }
    },
    [isOnline, machineId, currentBatch],
  )

  const saveImageRecord = useCallback(
    async (imageData) => {
      if (!machineId) {
        log("Cannot save image record: Machine ID not available")
        setErrorMessage("Cannot save image record: Machine ID not available")
        return null
      }

      if (!currentBatch) {
        log("Cannot save image record: No active batch")
        setErrorMessage("Cannot save image record: No active batch")
        return null
      }

      if (!imageData) {
        log("No image data received")
        return null
      }

      const formattedImageData = imageData.startsWith("data:image/") ? imageData : `data:image/jpeg;base64,${imageData}`

      const imageId = `${Date.now()}.jpg`
      const storagePath = `images/${currentBatch.id}/${imageId}`

      const imageRecord = {
        batch_id: currentBatch.id,
        storage_path: storagePath,
        timestamp: new Date().toISOString(),
        uploaded: isOnline,
        machine_id: machineId,
      }

      try {
        if (isOnline) {
          const storageRef = ref(storage, storagePath)
          await uploadString(storageRef, formattedImageData, "data_url")
          await addDoc(collection(db, "image_records"), imageRecord)
          log("Image record saved to Firebase")
        } else {
          await addImageRecord({ ...imageRecord, imageData: formattedImageData })
          log("Image record saved to IndexedDB")
        }
        return imageId
      } catch (error) {
        log(`Error saving image record: ${error.message}`)
        setErrorMessage(`Failed to save image: ${error.message}`)
        return null
      }
    },
    [isOnline, machineId, currentBatch],
  )

  useEffect(() => {
    if (
      lastMessage &&
      lastMessage.action === "defect_detection_result" &&
      lastMessage.id !== lastProcessedMessageId.current
    ) {
      log(`Received detection result: ${JSON.stringify(lastMessage)}`)

      // Update the global and local reference to the processed message ID
      setLastProcessedMessageId(lastMessage.id)
      lastProcessedMessageId.current = lastMessage.id

      const defectType = lastMessage.defects[0]
      const confidence = lastMessage.confidence * 100

      setDetectionResult({
        prediction: defectType,
        confidence: confidence,
      })

      // Update batch counts
      if (currentBatch) {
        updateBatchCounts(defectType)
      }

      if (!machineId || !currentBatch) {
        setUploadStatus("Cannot upload: No active batch")
        setTimeout(() => {
          setUploadStatus("")
        }, 3000)
        return
      }

      setUploadStatus("Uploading....")
      const saveData = async () => {
        const imageId = await saveImageRecord(lastMessage.image)
        if (imageId) {
          const saveSuccess = await saveDefectLog(defectType, lastMessage.confidence, imageId)
          if (saveSuccess) {
            setUploadStatus("Upload successful!")
          } else {
            setUploadStatus("Upload failed")
          }
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
    }
  }, [lastMessage, saveDefectLog, saveImageRecord, machineId, currentBatch, updateBatchCounts])

  return (
    <div className="min-h-screen bg-[#0e5f97] pt-6 px-4 pb-4 relative overflow-hidden">
      {/* Dynamic background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0wIDMwaDMwdjMwSDB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwSDB2MzBoMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwaDMwdjMwSDMweiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iLjUiLz48L2c+PC9zdmc+')] opacity-70"></div>

      {/* Main content */}
      <div
        className={`max-w-3xl mx-auto transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        ref={containerRef}
      >
        {/* Card with glass morphism effect */}
        <div className="relative backdrop-blur-sm bg-white/90 rounded-2xl shadow-2xl overflow-hidden border border-white/50">
          {/* Holographic overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

          {/* Animated edge glow */}
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl animate-border-glow"></div>
          </div>

          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#0e5f97]/30 rounded-tl-2xl"></div>
          <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-[#0e5f97]/30 rounded-tr-2xl"></div>
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-[#0e5f97]/30 rounded-bl-2xl"></div>
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#0e5f97]/30 rounded-br-2xl"></div>

          <div className="relative z-10 p-6">
            <header className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Link
                  href="/home"
                  className="text-[#0e5f97] hover:text-[#0e4772] transition-colors bg-white/50 backdrop-blur-sm p-2 rounded-full shadow-sm hover:shadow-md border border-[#0e5f97]/10 mr-4"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-bold text-[#0e5f97]">Defect Detection</h1>
              </div>

              {/* Connection status indicators */}
              <div className="flex items-center space-x-3">
                {/* Internet status - Fixed pulsing effect */}
                <div
                  className={`relative flex items-center justify-center w-9 h-9 rounded-full 
                              ${
                                isOnline
                                  ? "bg-gradient-to-br from-green-400/20 to-green-600/20 border border-green-400/30"
                                  : "bg-gradient-to-br from-red-400/20 to-red-600/20 border border-red-400/30"
                              } 
                              shadow-sm transition-all duration-300`}
                >
                  {/* Pulsing ring effect instead of dot */}
                  <div
                    className={`absolute inset-0 rounded-full ${isOnline ? "bg-green-400/10" : "bg-red-400/10"} 
                                animate-ping opacity-75`}
                  ></div>
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-green-400 relative z-10" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400 relative z-10" />
                  )}
                </div>

                {/* WebSocket status - Fixed pulsing effect */}
                <div
                  className={`relative flex items-center justify-center w-9 h-9 rounded-full 
                              ${
                                readyState === WebSocket.OPEN
                                  ? "bg-gradient-to-br from-green-400/20 to-green-600/20 border border-green-400/30"
                                  : "bg-gradient-to-br from-red-400/20 to-red-600/20 border border-red-400/30"
                              } 
                              shadow-sm transition-all duration-300`}
                >
                  {/* Pulsing ring effect instead of dot */}
                  <div
                    className={`absolute inset-0 rounded-full ${readyState === WebSocket.OPEN ? "bg-green-400/10" : "bg-red-400/10"} 
                                animate-ping opacity-75`}
                  ></div>
                  {readyState === WebSocket.OPEN ? (
                    <Plug className="w-4 h-4 text-green-400 relative z-10" />
                  ) : (
                    <PlugOff className="w-4 h-4 text-red-400 relative z-10" />
                  )}
                </div>
              </div>
            </header>

            {/* Compact Batch Info Header */}
            {currentBatch && (
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0e5f97]/20 to-[#0e5f97]/10 flex items-center justify-center mr-2 border border-[#0e5f97]/20">
                    <BarChart2 className="w-4 h-4 text-[#0e5f97]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0e5f97]">Batch {currentBatch.batch_number}</h3>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{new Date(currentBatch.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCompleteBatch}
                  className="flex items-center gap-1 text-sm bg-gradient-to-r from-[#0e5f97] to-[#0e4772] text-white px-3 py-1.5 rounded-lg hover:shadow-md transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
                  <Archive className="w-4 h-4" />
                  <span>Complete</span>
                </button>
              </div>
            )}

            {/* Main Content - Camera feed with detection result inside */}
            <div className="relative ">
              <VideoDisplay
                isCameraOn={isCameraOn}
                setIsCameraOn={setIsCameraOn}
                readyState={readyState}
                machineId={machineId && currentBatch ? machineId : null}
                setErrorMessage={setErrorMessage}
                onCaptureFrame={setVideoElement}
                detectionResult={detectionResult}
                currentBatch={currentBatch}
              />
            </div>

            <ErrorMessage message={errorMessage} />
            <UploadStatus status={uploadStatus} isOnline={isOnline} />
          </div>
        </div>
      </div>

      {/* Batch Selection Modal - now uncloseable */}
      <BatchSelectionModal
        isOpen={showBatchModal && machineId && machineIdStatus === "available" && !isLoadingBatches}
        batches={batches}
        onCreateBatch={handleCreateBatch}
        onSelectBatch={handleSelectBatch}
        isLoading={isLoadingBatches}
        currentBatch={currentBatch}
      />

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
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #0e5f97;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0e4772;
        }
      `}</style>
    </div>
  )
}
