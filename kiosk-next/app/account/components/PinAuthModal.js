"use client"

import { useState, useCallback, useEffect } from "react"

export function PinAuthModal({ onClose, onSuccess, canClose = true }) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  // Simulated stored PIN - In real app, this would be fetched from secure storage
  const STORED_PIN = "1234" // This is just for demo purposes

  const handlePinInput = (digit) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit)
      setError("")
    }
  }

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1))
    setError("")
  }

  const handleClear = () => {
    setPin("")
    setError("")
  }

  const verifyPin = useCallback(async () => {
    if (pin.length !== 4) return

    setIsVerifying(true)
    setError("")

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (pin === STORED_PIN) {
        onSuccess()
      } else {
        setError("Incorrect PIN. Please try again.")
        setPin("")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }, [pin, onSuccess])

  // Use useEffect to watch for PIN length changes
  useEffect(() => {
    if (pin.length === 4) {
      verifyPin()
    }
  }, [pin, verifyPin])

  const numberPad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "⌫"],
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Enter PIN</h2>
          <p className="text-sm text-gray-500 mt-1">Please enter your 4-digit PIN to continue</p>
        </div>

        <div className="flex flex-col items-center space-y-6">
          {/* PIN Display */}
          <div className="flex gap-3 my-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full ${i < pin.length ? "bg-[#0e5f97]" : "bg-gray-200"}`} />
            ))}
          </div>

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-4">
            {numberPad.map((row, rowIndex) =>
              row.map((digit, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => {
                    if (digit === "C") handleClear()
                    else if (digit === "⌫") handleBackspace()
                    else handlePinInput(digit)
                  }}
                  disabled={isVerifying}
                  className={`w-16 h-16 text-xl font-medium rounded-lg
                    ${
                      digit === "C" || digit === "⌫"
                        ? "border-2 border-[#0e5f97] text-[#0e5f97] hover:bg-[#0e5f97]/10"
                        : "bg-gray-100 hover:bg-gray-200"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors duration-200
                  `}
                >
                  {digit}
                </button>
              )),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

