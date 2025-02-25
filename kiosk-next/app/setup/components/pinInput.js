"use client"

import { AlertCircle } from "lucide-react"

const numberPad = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["C", "0", "⌫"],
]

export function PinInput({
  pin,
  confirmPin,
  pinStep,
  pinError,
  loading,
  onPinChange,
  onConfirmPinChange,
  onStepChange,
  onComplete,
}) {
  const handlePinInput = (digit) => {
    const currentPin = pinStep === "create" ? pin : confirmPin
    const setPin = pinStep === "create" ? onPinChange : onConfirmPinChange

    if (digit === "C") {
      setPin("")
    } else if (digit === "⌫") {
      setPin(currentPin.slice(0, -1))
    } else if (currentPin.length < 4) {
      setPin(currentPin + digit)
    }
  }

  const renderPinDisplay = () => (
    <div className="flex gap-3 justify-center">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200
            ${
              i < (pinStep === "confirm" ? confirmPin.length : pin.length)
                ? "border-[#0e5f97] bg-[#0e5f97]/5 text-[#0e5f97]"
                : "border-gray-200 text-transparent"
            }`}
        >
          •
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {pinError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{pinError}</p>
        </div>
      )}

      <div className="text-center space-y-4">
        <p className="text-sm font-medium text-gray-600">
          {pinStep === "confirm" ? "Confirm your PIN" : "Create a 4-digit PIN"}
        </p>
        {renderPinDisplay()}
      </div>

      <div className="grid grid-cols-3 gap-4 justify-center">
        {numberPad.map((row, rowIndex) =>
          row.map((digit, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handlePinInput(digit)}
              disabled={loading}
              className={`w-16 h-16 text-xl font-medium rounded-lg transition-all duration-200
                ${
                  digit === "C" || digit === "⌫"
                    ? "border-2 border-[#0e5f97] text-[#0e5f97] hover:bg-[#0e5f97]/10"
                    : "bg-gray-50 hover:bg-gray-100 hover:scale-105"
                }
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              `}
            >
              {digit}
            </button>
          )),
        )}
      </div>

      {pinStep === "create" && pin.length === 4 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => onStepChange("confirm")}
            className="bg-[#0e5f97] hover:bg-[#0e4772] text-white py-2 px-6 rounded-lg transition-colors"
          >
            Confirm PIN
          </button>
        </div>
      )}

      {pinStep === "confirm" && (
        <div className="flex justify-center gap-3 mt-8">
          <button
            onClick={() => onStepChange("create")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-6 rounded-lg transition-colors"
          >
            Back
          </button>
          {confirmPin.length === 4 && (
            <button
              onClick={onComplete}
              disabled={loading}
              className="bg-[#0e5f97] hover:bg-[#0e4772] text-white py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting up...
                </div>
              ) : (
                "Complete Setup"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

