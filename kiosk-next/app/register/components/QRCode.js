"use client"

import { useEffect, useRef } from "react"
import QRCodeLib from "qrcode"

export default function QRCode({ value }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, value, { width: 300 }, (error) => {
        if (error) console.error("Error generating QR code:", error)
      })
    }
  }, [value])

  return <canvas ref={canvasRef} />
}

