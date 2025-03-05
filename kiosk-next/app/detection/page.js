"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Info } from "lucide-react"
import { useWebSocket } from "../contexts/WebSocketContext"
import { useInternetConnection } from "../contexts/InternetConnectionContext"
import { db, storage } from "../firebaseConfig"
import { collection, addDoc } from "firebase/firestore"
import { ref, uploadString } from "firebase/storage"
import { addDefectLog, addImageRecord } from "../indexedDB"
import { ConnectionStatus } from "../components/ConnectionStatus"

// Import components
import VideoDisplay from "./components/VideoDisplay"
import MachineIdStatus from "./components/MachineIdStatus"
import ErrorMessage from "./components/ErrorMessage"
import UploadStatus from "./components/UploadStatus"
import BatchSelectionModal from "./components/BatchSelectionModal"
import BatchInfoPanel from "./components/BatchInfoPanel"

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
  const [showBatchDetails, setShowBatchDetails] = useState(false)
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
    <div className="min-h-screen bg-[#fcfcfd] p-4" ref={containerRef}>
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-4">
          <Link href="/home" className="text-[#0e5f97] hover:text-[#0e4772] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-[#0e5f97]">Defect Detection</h1>
          <div className="w-6 h-6" />
        </header>

        {/* Machine ID Status */}
        <div className="mb-4">
          <MachineIdStatus status={machineIdStatus} machineId={machineId} />
        </div>

        {/* Batch Info (if available) */}
        {currentBatch && (
          <div className="mb-6 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-[#0e5f97] mr-2">Batch: {currentBatch.batch_number}</span>
                <button
                  onClick={() => setShowBatchDetails(!showBatchDetails)}
                  className="text-[#0e5f97] hover:text-[#0e4772]"
                  aria-label="Toggle batch details"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleCompleteBatch}
                className="text-xs bg-[#0e5f97] text-white px-2 py-1 rounded hover:bg-[#0e4772] transition-colors"
              >
                Complete Batch
              </button>
            </div>

            {/* Batch Details (Collapsible) - Now using the BatchInfoPanel component */}
            {showBatchDetails && <BatchInfoPanel batch={currentBatch} onClose={() => setShowBatchDetails(false)} />}
          </div>
        )}

        {/* Main Content - Camera feed with detection result inside */}
        <div className="relative">
          <VideoDisplay
            isCameraOn={isCameraOn}
            setIsCameraOn={setIsCameraOn}
            readyState={readyState}
            machineId={machineId && currentBatch ? machineId : null}
            setErrorMessage={setErrorMessage}
            onCaptureFrame={setVideoElement}
            detectionResult={detectionResult}
          />
        </div>

        <ErrorMessage message={errorMessage} />
        <UploadStatus status={uploadStatus} isOnline={isOnline} />

        {/* Connection Status at the bottom */}
        <div className="mt-8">
          <ConnectionStatus isOnline={isOnline} readyState={readyState} />
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
      </div>
    </div>
  )
}

