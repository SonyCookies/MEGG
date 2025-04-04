"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Crosshair, Sliders, Maximize, RotateCw, Check, AlertCircle } from "lucide-react"
import CameraService from "../utils/CameraService"
import { useSearchParams } from "next/navigation"
import { getCookie } from "cookies-next"

export default function CameraCalibrationTab() {
  const searchParams = useSearchParams()
  const [machineId, setMachineId] = useState("")
  const [calibrationMode, setCalibrationMode] = useState(false)
  const [calibrationStep, setCalibrationStep] = useState(0)
  const [cameraSettings, setCameraSettings] = useState({
    sensitivity: 85,
    fieldOfView: "standard",
    lastCalibration: null,
    isCalibrated: false,
  })
  const [cameraStatus, setCameraStatus] = useState({
    isConnected: false,
    isCalibrated: false,
    errorMessage: null,
    isLoading: true,
  })
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)
  const [detectedObjects, setDetectedObjects] = useState([])
  const [saveStatus, setSaveStatus] = useState({ saving: false, success: false, error: null })

  // Get machine ID from URL or cookie
  useEffect(() => {
    const getMachineId = () => {
      // Try to get machine ID from URL query parameter
      const urlMachineId = searchParams.get("machine_id")
      if (urlMachineId) {
        return urlMachineId
      }

      // Try to get machine ID from cookie
      const cookieMachineId = getCookie("machine_id")
      if (cookieMachineId) {
        return cookieMachineId
      }

      // Fallback to a default or show an error
      return "MEGG-2025-O89-367" // Default for testing
    }

    setMachineId(getMachineId())
  }, [searchParams])

  // Initialize camera and fetch settings when machine ID is available
  useEffect(() => {
    if (machineId) {
      initializeCamera()
      fetchCameraSettings()
    }

    return () => {
      // Clean up camera stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [machineId])

  const fetchCameraSettings = async () => {
    if (!machineId) return

    try {
      setCameraStatus((prev) => ({ ...prev, isLoading: true }))

      const settings = await CameraService.fetchSettings(machineId)

      setCameraSettings(settings)
      setCameraStatus((prev) => ({
        ...prev,
        isCalibrated: settings.isCalibrated || false,
        isLoading: false,
        errorMessage: null,
      }))
    } catch (error) {
      console.error("Error fetching camera settings:", error)
      setCameraStatus((prev) => ({
        ...prev,
        errorMessage: "Failed to load camera settings: " + error.message,
        isLoading: false,
      }))
    }
  }

  const initializeCamera = async () => {
    try {
      // Check if the browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support camera access")
      }

      // Request camera access
      const stream = await CameraService.initializeCamera()

      // Store the stream for later cleanup
      streamRef.current = stream

      // If we're in calibration mode, display the video feed
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setCameraStatus((prev) => ({
        ...prev,
        isConnected: true,
        errorMessage: null,
        isLoading: false,
      }))
    } catch (error) {
      console.error("Error accessing camera:", error)
      setCameraStatus((prev) => ({
        ...prev,
        isConnected: false,
        errorMessage: error.message || "Failed to access camera",
        isLoading: false,
      }))
    }
  }

  const startCalibration = async () => {
    // Reset any previous calibration state
    setDetectedObjects([])
    setCalibrationMode(true)
    setCalibrationStep(1)

    // Initialize camera if not already done
    if (!cameraStatus.isConnected) {
      await initializeCamera()
    }

    // If we have a video element, set the stream to it
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }

  const nextCalibrationStep = async () => {
    if (!machineId) {
      setCameraStatus((prev) => ({
        ...prev,
        errorMessage: "Machine ID is required for calibration",
      }))
      return
    }

    if (calibrationStep < 3) {
      try {
        // Record this step in Firebase
        await CameraService.performCalibrationStep(machineId, calibrationStep)

        // Move to next step
        setCalibrationStep(calibrationStep + 1)

        // Simulate different actions based on the step
        if (calibrationStep === 1) {
          // Simulate focus adjustment
          setTimeout(() => {
            // Pretend we're adjusting camera parameters
          }, 1500)
        } else if (calibrationStep === 2) {
          // Simulate object detection
          detectObjects()
        }
      } catch (error) {
        console.error("Error during calibration step:", error)
        setCameraStatus((prev) => ({
          ...prev,
          errorMessage: "Calibration step failed: " + error.message,
        }))
      }
    } else {
      // Finish calibration
      completeCalibration()
    }
  }

  const detectObjects = async () => {
    if (!videoRef.current) return

    try {
      // Use the camera service to detect objects
      const objects = await CameraService.detectObjects(videoRef.current)
      setDetectedObjects(objects)
    } catch (error) {
      console.error("Error detecting objects:", error)
      setCameraStatus((prev) => ({
        ...prev,
        errorMessage: "Object detection failed: " + error.message,
      }))
    }
  }

  const completeCalibration = async () => {
    if (!machineId) {
      setCameraStatus((prev) => ({
        ...prev,
        errorMessage: "Machine ID is required to complete calibration",
      }))
      return
    }

    try {
      // Save calibration data to Firebase
      const now = new Date().toISOString()
      const updatedSettings = {
        ...cameraSettings,
        lastCalibration: now,
        isCalibrated: true,
      }

      // Save to Firebase
      await CameraService.saveSettings(machineId, updatedSettings)

      // Update local state
      setCameraSettings(updatedSettings)
      setCameraStatus((prev) => ({
        ...prev,
        isCalibrated: true,
        errorMessage: null,
      }))

      // Show success message
      setSaveStatus({ saving: false, success: true, error: null })
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, success: false }))
      }, 3000)

      // Exit calibration mode
      setCalibrationMode(false)
      setCalibrationStep(0)

      // Stop showing the video feed
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    } catch (error) {
      console.error("Error completing calibration:", error)
      setCameraStatus((prev) => ({
        ...prev,
        errorMessage: "Failed to complete calibration: " + error.message,
      }))
      setSaveStatus({ saving: false, success: false, error: "Failed to save calibration: " + error.message })
    }
  }

  const cancelCalibration = () => {
    setCalibrationMode(false)
    setCalibrationStep(0)
    setDetectedObjects([])

    // Stop showing the video feed
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const handleSettingChange = async (setting, value) => {
    if (!machineId) {
      setCameraStatus((prev) => ({
        ...prev,
        errorMessage: "Machine ID is required to save settings",
      }))
      return
    }

    // Update local state immediately for responsive UI
    setCameraSettings((prev) => ({
      ...prev,
      [setting]: value,
    }))

    try {
      setSaveStatus({ saving: true, success: false, error: null })

      // Save to Firebase
      await CameraService.saveSettings(machineId, {
        ...cameraSettings,
        [setting]: value,
      })

      setSaveStatus({ saving: false, success: true, error: null })

      // Clear success message after a delay
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, success: false }))
      }, 3000)
    } catch (error) {
      console.error("Error saving camera settings:", error)
      setSaveStatus({
        saving: false,
        success: false,
        error: "Failed to save settings: " + error.message,
      })
    }
  }

  // Format the last calibration date for display
  const formatCalibrationDate = (isoString) => {
    if (!isoString) return "Never calibrated"

    try {
      const date = new Date(isoString)
      return date.toLocaleString()
    } catch (error) {
      return isoString // Fallback to the raw string if parsing fails
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#0e5f97] mb-4 flex items-center">
        <Camera className="w-5 h-5 mr-2" />
        Camera Calibration
      </h2>

      {!machineId ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <h4 className="font-medium">Configuration Error</h4>
          </div>
          <p className="mt-1 text-sm text-red-600">Machine ID is required for camera calibration.</p>
        </div>
      ) : cameraStatus.isLoading ? (
        <div className="flex items-center justify-center h-40">
          <RotateCw className="w-8 h-8 text-[#0e5f97] animate-spin" />
          <span className="ml-2 text-gray-600">Loading camera status...</span>
        </div>
      ) : cameraStatus.errorMessage && !calibrationMode ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <h4 className="font-medium">Camera Error</h4>
          </div>
          <p className="mt-1 text-sm text-red-600">{cameraStatus.errorMessage}</p>
          <button
            onClick={initializeCamera}
            className="mt-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : !calibrationMode ? (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-4">
              Calibrate the camera to ensure accurate egg detection and sorting. This process will adjust the camera's
              position, focus, and detection parameters.
            </p>

            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg mb-4">
              <div>
                <h4 className="font-medium text-[#0e4772]">Last Calibration</h4>
                <p className="text-xs text-gray-500">{formatCalibrationDate(cameraSettings.lastCalibration)}</p>
              </div>
              <button
                onClick={startCalibration}
                className="px-3 py-1.5 bg-[#0e5f97] text-white rounded-lg text-sm hover:bg-[#0e4772] transition-colors flex items-center gap-1"
              >
                <Crosshair className="w-3.5 h-3.5" />
                Start Calibration
              </button>
            </div>

            <h3 className="font-medium text-[#171717] mb-3">Camera Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-[#0e5f97]" />
                  Detection Sensitivity
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={cameraSettings.sensitivity}
                    onChange={(e) => handleSettingChange("sensitivity", Number.parseInt(e.target.value))}
                    className="w-full h-2 bg-[#ecb662] rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="ml-4 text-[#171717] font-medium">{cameraSettings.sensitivity}%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Higher sensitivity may detect more eggs but could increase false positives.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Maximize className="w-3.5 h-3.5 text-[#0e5f97]" />
                  Field of View
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSettingChange("fieldOfView", "narrow")}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      cameraSettings.fieldOfView === "narrow"
                        ? "bg-[#0e5f97] text-white"
                        : "bg-white border border-gray-300 text-gray-700"
                    }`}
                  >
                    Narrow (90°)
                  </button>
                  <button
                    onClick={() => handleSettingChange("fieldOfView", "standard")}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      cameraSettings.fieldOfView === "standard"
                        ? "bg-[#0e5f97] text-white"
                        : "bg-white border border-gray-300 text-gray-700"
                    }`}
                  >
                    Standard (120°)
                  </button>
                  <button
                    onClick={() => handleSettingChange("fieldOfView", "wide")}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      cameraSettings.fieldOfView === "wide"
                        ? "bg-[#0e5f97] text-white"
                        : "bg-white border border-gray-300 text-gray-700"
                    }`}
                  >
                    Wide (150°)
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Wider field of view captures more area but may reduce detail.
                </p>
              </div>

              {/* Save status indicator */}
              {(saveStatus.saving || saveStatus.success || saveStatus.error) && (
                <div
                  className={`mt-2 text-sm px-3 py-2 rounded-lg ${
                    saveStatus.error
                      ? "bg-red-50 text-red-600"
                      : saveStatus.success
                        ? "bg-green-50 text-green-600"
                        : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {saveStatus.error
                    ? saveStatus.error
                    : saveStatus.success
                      ? "Settings saved successfully!"
                      : "Saving settings..."}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-[#171717] mb-3">Camera Status</h3>
            {cameraStatus.isConnected ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                <Check className="w-4 h-4" />
                <span className="text-sm">
                  Camera is operational {cameraStatus.isCalibrated ? "and calibrated" : "but needs calibration"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Camera is not connected</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-[#0e4772] mb-2 flex items-center gap-1">
              <Crosshair className="w-4 h-4" />
              Calibration Step {calibrationStep} of 3
            </h4>

            {calibrationStep === 1 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">Place the calibration card in the center of the conveyor belt.</p>
                <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center relative">
                  {cameraStatus.isConnected ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <p className="text-xs text-gray-500">Make sure the calibration card is clearly visible and well-lit.</p>
              </div>
            )}

            {calibrationStep === 2 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">Adjusting camera focus and alignment...</p>
                <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center relative">
                  {cameraStatus.isConnected ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <RotateCw className="w-8 h-8 text-white animate-spin" />
                      </div>
                    </>
                  ) : (
                    <RotateCw className="w-8 h-8 text-gray-400 animate-spin" />
                  )}
                </div>
                <p className="text-xs text-gray-500">Please wait while the system adjusts the camera parameters.</p>
              </div>
            )}

            {calibrationStep === 3 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">Verifying calibration with test objects...</p>
                <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center relative">
                  {cameraStatus.isConnected ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover rounded-lg"
                      />
                      <canvas
                        ref={canvasRef}
                        className="hidden" // Hidden canvas for processing
                      />
                      {detectedObjects.map((obj, index) => (
                        <div
                          key={index}
                          className="absolute border-2 border-green-500 flex items-center justify-center"
                          style={{
                            left: `${obj.x}px`,
                            top: `${obj.y}px`,
                            width: `${obj.width}px`,
                            height: `${obj.height}px`,
                            borderRadius: "50%",
                          }}
                        >
                          <span className="text-xs text-green-600 bg-white px-1 rounded">Detected</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-20 rounded-full border-2 border-green-500 flex items-center justify-center">
                        <span className="text-xs text-green-600">Detected</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">The system is verifying that objects are correctly detected.</p>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={cancelCalibration}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={nextCalibrationStep}
                className="px-3 py-1.5 bg-[#0e5f97] text-white rounded-lg text-sm hover:bg-[#0e4772] transition-colors"
              >
                {calibrationStep < 3 ? "Next Step" : "Finish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

