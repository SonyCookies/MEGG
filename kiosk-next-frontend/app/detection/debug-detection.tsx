"use client"

import { useRef, useState } from "react"
import { useDefectDetection } from "../contexts/DefectDetectionContext"
import { useCamera } from "../contexts/CameraContext"
import { captureImageFromVideo, validateBase64Image } from "./image-capture"

export default function DebugDetection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  // Get contexts
  const defectDetection = useDefectDetection()
  const camera = useCamera()

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]) // Keep last 10 messages
  }

  // Test image capture from browser camera
  const testBrowserCapture = async () => {
    try {
      addDebugInfo("🔍 Testing browser camera capture...")

      if (!videoRef.current) {
        throw new Error("Video element not found")
      }

      const imageData = await captureImageFromVideo(videoRef.current)

      if (validateBase64Image(imageData)) {
        addDebugInfo("✅ Browser capture successful")
        setCapturedImage(`data:image/jpeg;base64,${imageData}`)

        // Test sending to detection service
        addDebugInfo("📤 Sending to detection service...")
        const result = await defectDetection.detectDefect(imageData)

        if (result) {
          addDebugInfo(`✅ Detection result: ${result.prediction} (${result.confidence}%)`)
        } else {
          addDebugInfo("❌ No detection result received")
        }
      } else {
        addDebugInfo("❌ Invalid image data captured")
      }
    } catch (error) {
      addDebugInfo(`❌ Browser capture error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Test image capture from Electron camera
  const testElectronCapture = async () => {
    try {
      addDebugInfo("🔍 Testing Electron camera capture...")

      const imageData = await camera.captureFrame()

      if (!imageData) {
        throw new Error("No image data returned from Electron camera")
      }

      if (validateBase64Image(imageData)) {
        addDebugInfo("✅ Electron capture successful")
        setCapturedImage(`data:image/jpeg;base64,${imageData}`)

        // Test sending to detection service
        addDebugInfo("📤 Sending to detection service...")
        const result = await defectDetection.detectDefect(imageData)

        if (result) {
          addDebugInfo(`✅ Detection result: ${result.prediction} (${result.confidence}%)`)
        } else {
          addDebugInfo("❌ No detection result received")
        }
      } else {
        addDebugInfo("❌ Invalid image data from Electron camera")
      }
    } catch (error) {
      addDebugInfo(`❌ Electron capture error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Start browser camera for testing
  const startBrowserCamera = async () => {
    try {
      addDebugInfo("🎥 Starting browser camera...")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          addDebugInfo("✅ Browser camera started")
        }
      }
    } catch (error) {
      addDebugInfo(`❌ Browser camera error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Defect Detection Debug</h1>

      {/* Connection Status */}
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Connection Status</h2>
        <p>
          WebSocket:{" "}
          <span className={defectDetection.isConnected ? "text-green-600" : "text-red-600"}>
            {defectDetection.isConnected ? "Connected" : "Disconnected"}
          </span>
        </p>
        <p>
          Camera:{" "}
          <span className={camera.isCameraOn ? "text-green-600" : "text-red-600"}>
            {camera.isCameraOn ? "On" : "Off"}
          </span>
        </p>
        <p>
          Processing:{" "}
          <span className={defectDetection.isProcessing ? "text-yellow-600" : "text-gray-600"}>
            {defectDetection.isProcessing ? "Yes" : "No"}
          </span>
        </p>
      </div>

      {/* Controls */}
      <div className="mb-4 space-x-2">
        <button onClick={startBrowserCamera} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Start Browser Camera
        </button>

        <button
          onClick={camera.startCamera}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={camera.isCameraLoading}
        >
          {camera.isCameraLoading ? "Starting..." : "Start Electron Camera"}
        </button>

        <button
          onClick={testBrowserCapture}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          disabled={defectDetection.isProcessing}
        >
          Test Browser Capture
        </button>

        <button
          onClick={testElectronCapture}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          disabled={defectDetection.isProcessing || !camera.isCameraOn}
        >
          Test Electron Capture
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Video Preview */}
        <div>
          <h3 className="font-bold mb-2">Camera Preview</h3>
          <video ref={videoRef} className="w-full h-64 bg-black border rounded" playsInline muted />
        </div>

        {/* Captured Image */}
        <div>
          <h3 className="font-bold mb-2">Captured Image</h3>
          <div className="w-full h-64 bg-gray-200 border rounded flex items-center justify-center">
            {capturedImage ? (
              <img
                src={capturedImage || "/placeholder.svg"}
                alt="Captured"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-gray-500">No image captured</span>
            )}
          </div>
        </div>
      </div>

      {/* Debug Log */}
      <div className="mt-4">
        <h3 className="font-bold mb-2">Debug Log</h3>
        <div className="bg-black text-green-400 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
          {debugInfo.length === 0 ? (
            <div className="text-gray-500">No debug messages yet...</div>
          ) : (
            debugInfo.map((message, index) => (
              <div key={index} className="mb-1">
                {message}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Last Detection Result */}
      {defectDetection.lastResult && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <h3 className="font-bold mb-2">Last Detection Result</h3>
          <p>Prediction: {defectDetection.lastResult.prediction}</p>
          <p>Confidence: {defectDetection.lastResult.confidence}%</p>
        </div>
      )}
    </div>
  )
}
