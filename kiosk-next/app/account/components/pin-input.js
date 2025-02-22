"use client"

import { useState, useEffect, useCallback } from "react"
import { X } from "lucide-react"

export function PinInput({ onComplete, onCancel, pinLength = 4 }) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")

  const handleNumberClick = useCallback(
    (number) => {
      if (pin.length < pinLength) {
        const newPin = pin + number
        setPin(newPin)
        if (newPin.length === pinLength) {
          onComplete(newPin)
        }
      }
    },
    [pin, pinLength, onComplete],
  )

  const handleBackspace = useCallback(() => {
    setPin(pin.slice(0, -1))
    setError("")
  }, [pin])

  const handleClear = useCallback(() => {
    setPin("")
    setError("")
  }, [])

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key >= "0" && e.key <= "9") {
        handleNumberClick(e.key)
      } else if (e.key === "Backspace") {
        handleBackspace()
      } else if (e.key === "Escape") {
        handleClear()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handleBackspace, handleNumberClick, handleClear])

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-6">
        <div className="flex justify-center space-x-4">
          {Array.from({ length: pinLength }).map((_, i) => (
            <div key={i} className="w-12 h-12 border-2 rounded-lg flex items-center justify-center text-2xl font-bold">
              {pin[i] ? "•" : ""}
            </div>
          ))}
        </div>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <button
            key={number}
            onClick={() => handleNumberClick(number.toString())}
            className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 text-2xl font-semibold transition-colors"
          >
            {number}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 text-xl font-semibold transition-colors text-red-500"
        >
          <X className="w-6 h-6 mx-auto" />
        </button>
        <button
          onClick={() => handleNumberClick("0")}
          className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 text-2xl font-semibold transition-colors"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 text-xl font-semibold transition-colors"
        >
          ←
        </button>
      </div>

      {onCancel && (
        <button onClick={onCancel} className="w-full mt-4 p-2 text-gray-600 hover:text-gray-800 transition-colors">
          Cancel
        </button>
      )}
    </div>
  )
}

