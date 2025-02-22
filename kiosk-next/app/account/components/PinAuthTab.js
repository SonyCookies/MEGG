"use client"

import { useState } from "react"
import { Check, ArrowLeft } from "lucide-react"

export default function PinAuthTab() {
  const [step, setStep] = useState("current") // current, new, confirm
  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handlePinInput = (digit, pinType) => {
    setError("")
    switch (pinType) {
      case "current":
        if (currentPin.length < 4) {
          setCurrentPin((prev) => prev + digit)
        }
        break
      case "new":
        if (newPin.length < 4) {
          setNewPin((prev) => prev + digit)
        }
        break
      case "confirm":
        if (confirmPin.length < 4) {
          setConfirmPin((prev) => prev + digit)
        }
        break
    }
  }

  const handleBackspace = (pinType) => {
    switch (pinType) {
      case "current":
        setCurrentPin((prev) => prev.slice(0, -1))
        break
      case "new":
        setNewPin((prev) => prev.slice(0, -1))
        break
      case "confirm":
        setConfirmPin((prev) => prev.slice(0, -1))
        break
    }
  }

  const handleClear = (pinType) => {
    switch (pinType) {
      case "current":
        setCurrentPin("")
        break
      case "new":
        setNewPin("")
        break
      case "confirm":
        setConfirmPin("")
        break
    }
  }

  const handleNext = () => {
    if (step === "current" && currentPin.length === 4) {
      // Here you would validate the current PIN
      setStep("new")
    } else if (step === "new" && newPin.length === 4) {
      setStep("confirm")
    }
  }

  const handleBack = () => {
    if (step === "confirm") {
      setStep("new")
      setConfirmPin("")
    } else if (step === "new") {
      setStep("current")
      setNewPin("")
    }
  }

  const handleSubmit = async () => {
    setError("")
    setSuccess("")

    // Basic validation
    if (newPin !== confirmPin) {
      setError("New PINs do not match")
      return
    }

    try {
      // Here you would typically make an API call to update the PIN
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSuccess("PIN successfully updated")
      setCurrentPin("")
      setNewPin("")
      setConfirmPin("")
      setStep("current")
    } catch (err) {
      setError("Failed to update PIN. Please try again.")
    }
  }

  const numberPad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "⌫"],
  ]

  const getCurrentPin = () => {
    switch (step) {
      case "current":
        return currentPin
      case "new":
        return newPin
      case "confirm":
        return confirmPin
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case "current":
        return "Enter Current PIN"
      case "new":
        return "Enter New PIN"
      case "confirm":
        return "Confirm New PIN"
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        {step !== "current" && (
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-semibold text-[#0e4772]">Change PIN</h2>
          <p className="text-gray-500">{getStepTitle()}</p>
        </div>
      </div>

      {(error || success) && (
        <div
          className={`${
            error ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
          } border px-4 py-3 rounded-lg flex gap-2 items-start`}
        >
          <span className="text-sm">{error || success}</span>
        </div>
      )}

      <div className="flex flex-col items-center space-y-8">
        {/* PIN Display */}
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-colors duration-200 ${
                i < getCurrentPin().length ? "bg-[#0e5f97]" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-4">
          {numberPad.map((row, rowIndex) =>
            row.map((digit, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => {
                  if (digit === "C") handleClear(step)
                  else if (digit === "⌫") handleBackspace(step)
                  else handlePinInput(digit, step)
                }}
                className={`w-16 h-16 text-xl font-medium rounded-lg
                  ${
                    digit === "C" || digit === "⌫"
                      ? "border-2 border-[#0e5f97] text-[#0e5f97] hover:bg-[#0e5f97]/10"
                      : "bg-gray-100 hover:bg-gray-200"
                  }
                  transition-colors duration-200
                `}
              >
                {digit}
              </button>
            )),
          )}
        </div>

        {/* Action Button */}
        {step === "confirm" && confirmPin.length === 4 ? (
          <button
            onClick={handleSubmit}
            className="w-full bg-[#0e5f97] hover:bg-[#0e4772] text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Update PIN
          </button>
        ) : (
          getCurrentPin().length === 4 && (
            <button
              onClick={handleNext}
              className="w-full bg-[#0e5f97] hover:bg-[#0e4772] text-white py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Next
            </button>
          )
        )}
      </div>
    </div>
  )
}

