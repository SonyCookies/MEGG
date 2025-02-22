"use client"

import { useState, useCallback, useEffect } from "react"
import { AlertCircle, Key, Shield, X } from "lucide-react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import { addAccessLog } from "../../utils/logging"

export function PinAuthModal({ onClose, onSuccess, canClose = true }) {
  const [mode, setMode] = useState("loading") // loading, verify, setup
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [error, setError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const MAX_ATTEMPTS = 5
  const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

  // Check if PIN exists when modal opens
  useEffect(() => {
    const checkPinSetup = async () => {
      try {
        const machineId = localStorage.getItem("machineId")
        if (!machineId) {
          setError("Machine ID not found")
          setMode("setup")
          return
        }

        const machineRef = doc(db, "machines", machineId)
        const machineDoc = await getDoc(machineRef)

        if (machineDoc.exists()) {
          const data = machineDoc.data()

          // Check if machine is locked out
          if (data.lockedUntil && new Date(data.lockedUntil) > new Date()) {
            const remainingTime = Math.ceil((new Date(data.lockedUntil) - new Date()) / 1000 / 60)
            setError(`Too many failed attempts. Please try again in ${remainingTime} minutes.`)
            setIsVerifying(true)
            return
          }

          setMode(data.pin ? "verify" : "setup")
          setAttempts(data.failedAttempts || 0)
        } else {
          setError("Machine not found")
          setMode("setup")
        }
      } catch (err) {
        console.error("Error checking PIN setup:", err)
        setError("Failed to check PIN status")
        setMode("setup")
      }
    }

    checkPinSetup()
  }, [])

  const handlePinInput = (digit) => {
    if (isVerifying) return
    setError("")

    if (mode === "verify" && pin.length < 4) {
      setPin((prev) => prev + digit)
    } else if (mode === "setup") {
      if (!confirmPin && pin.length < 4) {
        setPin((prev) => prev + digit)
      } else if (confirmPin.length < 4) {
        setConfirmPin((prev) => prev + digit)
      }
    }
  }

  const handleBackspace = () => {
    if (isVerifying) return
    setError("")

    if (mode === "verify") {
      setPin((prev) => prev.slice(0, -1))
    } else if (mode === "setup") {
      if (confirmPin.length > 0) {
        setConfirmPin((prev) => prev.slice(0, -1))
      } else {
        setPin((prev) => prev.slice(0, -1))
      }
    }
  }

  const handleClear = () => {
    if (isVerifying) return
    setError("")

    if (mode === "verify") {
      setPin("")
    } else if (mode === "setup") {
      if (confirmPin.length > 0) {
        setConfirmPin("")
      } else {
        setPin("")
      }
    }
  }

  const verifyPin = useCallback(async () => {
    if (pin.length !== 4) return

    setIsVerifying(true)
    setError("")

    try {
      const machineId = localStorage.getItem("machineId")
      if (!machineId) throw new Error("Machine ID not found")

      const machineRef = doc(db, "machines", machineId)
      const machineDoc = await getDoc(machineRef)

      if (!machineDoc.exists()) throw new Error("Machine not found")

      const data = machineDoc.data()
      const newAttempts = attempts + 1

      // Check if machine is locked out
      if (data.lockedUntil && new Date(data.lockedUntil) > new Date()) {
        const remainingTime = Math.ceil((new Date(data.lockedUntil) - new Date()) / 1000 / 60)
        setError(`Too many failed attempts. Please try again in ${remainingTime} minutes.`)
        return
      }

      // Compare with stored PIN (in real app, use proper hash comparison)
      if (btoa(pin) === data.pin) {
        // Log successful verification
        await addAccessLog({
          action: "pin_verify",
          status: "success",
          details: "PIN verified successfully",
        })

        // Update last successful auth
        await updateDoc(machineRef, {
          lastAuthAt: new Date().toISOString(),
          failedAttempts: 0,
          lockedUntil: null,
        })

        onSuccess()
      } else {
        // Check if we should lock the machine
        if (newAttempts >= MAX_ATTEMPTS) {
          const lockoutTime = new Date(Date.now() + LOCKOUT_DURATION)
          await updateDoc(machineRef, {
            failedAttempts: newAttempts,
            lockedUntil: lockoutTime.toISOString(),
            lastFailedAttempt: new Date().toISOString(),
          })

          // Log lockout
          await addAccessLog({
            action: "pin_verify",
            status: "locked",
            details: `Machine locked for ${LOCKOUT_DURATION / 1000 / 60} minutes due to too many failed attempts`,
          })

          setError(`Too many failed attempts. Please try again in ${LOCKOUT_DURATION / 1000 / 60} minutes.`)
        } else {
          // Increment failed attempts
          await updateDoc(machineRef, {
            failedAttempts: newAttempts,
            lastFailedAttempt: new Date().toISOString(),
          })

          // Log failed attempt
          await addAccessLog({
            action: "pin_verify",
            status: "failed",
            details: `Failed PIN verification attempt (${newAttempts}/${MAX_ATTEMPTS})`,
          })

          setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`)
        }

        setAttempts(newAttempts)
        setPin("")
      }
    } catch (err) {
      console.error("Error verifying PIN:", err)
      setError("An error occurred. Please try again.")

      // Log error
      await addAccessLog({
        action: "pin_verify",
        status: "error",
        details: "Error during PIN verification",
        error: err.message,
      })
    } finally {
      setIsVerifying(false)
    }
  }, [pin, attempts, onSuccess])

  const handleSetupPin = useCallback(async () => {
    if (pin.length !== 4 || confirmPin.length !== 4) return

    setIsVerifying(true)
    setError("")

    try {
      // Validate PINs match
      if (pin !== confirmPin) {
        setError("PINs do not match")
        setConfirmPin("")
        return
      }

      // Validate PIN format
      if (!/^\d+$/.test(pin)) {
        setError("PIN must contain only numbers")
        return
      }

      // Check PIN complexity (avoid simple patterns)
      const isSimplePattern =
        /^(.)\1{3}$/.test(pin) || // Same digit repeated
        /^0123|1234|2345|3456|4567|5678|6789$/.test(pin) || // Sequential
        /^9876|8765|7654|6543|5432|4321|3210$/.test(pin) // Reverse sequential

      if (isSimplePattern) {
        setError("Please choose a less predictable PIN")
        return
      }

      const machineId = localStorage.getItem("machineId")
      if (!machineId) throw new Error("Machine ID not found")

      const machineRef = doc(db, "machines", machineId)

      // Hash the PIN before storing (in real app, use proper hashing function)
      const hashedPin = btoa(pin)

      await updateDoc(machineRef, {
        pin: hashedPin,
        pinSetupAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        failedAttempts: 0,
        lockedUntil: null,
      })

      // Log successful PIN setup
      await addAccessLog({
        action: "pin_setup",
        status: "success",
        details: "PIN successfully set up",
      })

      onSuccess()
    } catch (err) {
      console.error("Error setting up PIN:", err)
      setError("Failed to set up PIN. Please try again.")

      // Log error
      await addAccessLog({
        action: "pin_setup",
        status: "error",
        details: "Error during PIN setup",
        error: err.message,
      })
    } finally {
      setIsVerifying(false)
    }
  }, [pin, confirmPin, onSuccess])

  // Watch for PIN completion
  useEffect(() => {
    if (mode === "verify" && pin.length === 4) {
      verifyPin()
    } else if (mode === "setup" && pin.length === 4 && confirmPin.length === 4) {
      handleSetupPin()
    }
  }, [pin, confirmPin, mode, verifyPin, handleSetupPin])

  const numberPad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "⌫"],
  ]

  if (mode === "loading") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {mode === "verify" ? (
              <Shield className="w-6 h-6 text-[#0e5f97]" />
            ) : (
              <Key className="w-6 h-6 text-[#0e5f97]" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{mode === "verify" ? "Enter PIN" : "Set Up PIN"}</h2>
              <p className="text-sm text-gray-500">
                {mode === "verify"
                  ? "Please enter your 4-digit PIN to continue"
                  : "Create a 4-digit PIN to secure your machine"}
              </p>
            </div>
          </div>
          {canClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Setup Warning */}
        {mode === "setup" && !confirmPin && (
          <div className="bg-[#ecb662]/10 border border-[#ecb662] text-[#ecb662] px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Important Security Information</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>You'll need this PIN to access the machine in the future</li>
                <li>Choose a PIN that's easy to remember but hard to guess</li>
                <li>Avoid simple patterns like 1234 or repeated digits</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center space-y-6">
          {/* PIN Display */}
          {mode === "setup" ? (
            <div className="space-y-4 w-full">
              <div className="space-y-2">
                <p className="text-sm text-gray-500 text-center">
                  {confirmPin.length > 0 ? "Confirm PIN" : "Enter PIN"}
                </p>
                <div className="flex gap-3 justify-center">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200
                        ${
                          i < (confirmPin.length > 0 ? confirmPin.length : pin.length)
                            ? "border-[#0e5f97] bg-[#0e5f97]/5 text-[#0e5f97]"
                            : "border-gray-200 text-transparent"
                        }`}
                    >
                      •
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 w-full">
              <div className="flex gap-3 justify-center">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200
                      ${
                        i < pin.length
                          ? "border-[#0e5f97] bg-[#0e5f97]/5 text-[#0e5f97]"
                          : "border-gray-200 text-transparent"
                      }`}
                  >
                    •
                  </div>
                ))}
              </div>
              {!error && attempts > 0 && (
                <p className="text-sm text-center text-yellow-600">{MAX_ATTEMPTS - attempts} attempts remaining</p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 w-full">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

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

          {/* Help Text */}
          {mode === "verify" && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Forgot your PIN? <button className="text-[#0e5f97] hover:underline">Contact support</button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

