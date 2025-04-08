// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\detection\hooks\useFrameCapture.js

"use client"

import { useCallback, useRef } from "react"

const logger = (message) => {
  console.log(`[useFrameCapture] ${new Date().toISOString()}: ${message}`)
}

export default function useFrameCapture(readyState, sendMessage, isCameraOn) {
  const frameIntervalRef = useRef(null)
  const videoElementRef = useRef(null)

  const setVideoElement = useCallback((videoElement) => {
    videoElementRef.current = videoElement
  }, [])

  const captureAndSendFrame = useCallback(() => {
    logger(`Attempting to capture frame. Camera on: ${isCameraOn}, WebSocket ready: ${readyState === WebSocket.OPEN}`)
    if (videoElementRef.current && readyState === WebSocket.OPEN && isCameraOn) {
      const canvas = document.createElement("canvas")
      canvas.width = videoElementRef.current.videoWidth
      canvas.height = videoElementRef.current.videoHeight
      const ctx = canvas.getContext("2d")
      ctx.drawImage(videoElementRef.current, 0, 0, canvas.width, canvas.height)
      const imageData = canvas.toDataURL("image/jpeg")

      sendMessage({
        action: "defect_detection",
        image: imageData,
      })

      logger("Frame sent to WebSocket server")
    } else {
      logger("Conditions not met for sending frame to websocket")
    }
  }, [readyState, sendMessage, isCameraOn])

  const startCapture = useCallback(() => {
    logger("Starting frame capture with delay")
    const sendFrame = () => {
      captureAndSendFrame()
      frameIntervalRef.current = setTimeout(sendFrame, 5000)
    }

    frameIntervalRef.current = setTimeout(sendFrame, 5000)
  }, [captureAndSendFrame])

  const stopCapture = useCallback(() => {
    logger("Stopping frame capture")
    if (frameIntervalRef.current) {
      clearTimeout(frameIntervalRef.current)
      frameIntervalRef.current = null
    }
  }, [])

  return {
    setVideoElement,
    startCapture,
    stopCapture,
    captureAndSendFrame,
  }
}

