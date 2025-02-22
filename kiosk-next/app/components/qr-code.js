"use client"

import { useEffect, useRef } from "react"
import QRCodeLib from "qrcode"

export default function QRCode({ value, size = 200 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: "#0e5f97",
          light: "#ffffff",
        },
      })
    }
  }, [value, size])

  return <canvas ref={canvasRef} />
}

