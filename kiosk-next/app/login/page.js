"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, ArrowLeft, Key, Shield, Info, Lock } from "lucide-react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebaseConfig"
import { addAccessLog } from "../utils/logging"

export default function LoginPage() {
  const router = useRouter()
  const [machineId, setMachineId] = useState("")
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [attempts, setAttempts] = useState(0)
  const MAX_ATTEMPTS = 5

  const formatMachineId = (value) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Z0-9]/gi, "").toUpperCase()

    // Split into groups
    let formatted = ""

    // Add first group (4 characters)
    formatted += cleaned.slice(0, 4)
    if (cleaned.length > 4) {
      formatted += "-"
      // Add second group (4 characters)
      formatted += cleaned.slice(4, 8)
      if (cleaned.length > 8) {
        formatted += "-"
        // Add third group (3 characters)
        formatted += cleaned.slice(8, 11)
        if (cleaned.length > 11) {
          formatted += "-"
          // Add fourth group (3 characters)
          formatted += cleaned.slice(11, 14)
        }
      }
    }

    return formatted
  }

  const handleMachineIdChange = (e) => {
    const formatted = formatMachineId(e.target.value)
    setMachineId(formatted)
  }

  const handlePinInput = (digit) => {
    if (loading) return
    setError("")

    if (pin.length < 4) {
      setPin((prev) => prev + digit)
    }
  }

  const handleBackspace = () => {
    if (loading) return
    setError("")
    setPin((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    if (loading) return
    setError("")
    setPin("")
  }

  const handleLogin = async () => {
    if (!machineId || !pin) {
      setError("Please enter both Machine ID and PIN")
      return
    }

    try {
      setLoading(true)
      setError("")

      const machineRef = doc(db, "machines", machineId)
      const machineDoc = await getDoc(machineRef)

      if (!machineDoc.exists()) {
        setError("Machine not found")
        return
      }

      const data = machineDoc.data()
      const newAttempts = attempts + 1

      // Check if machine is locked
      if (data.lockedUntil && new Date(data.lockedUntil) > new Date()) {
        const remainingTime = Math.ceil((new Date(data.lockedUntil) - new Date()) / 1000 / 60)
        setError(`Too many failed attempts. Please try again in ${remainingTime} minutes.`)
        return
      }

      // Verify PIN (in real app, use proper hash comparison)
      if (btoa(pin) === data.pin) {
        await addAccessLog({
          action: "login",
          machineId,
          status: "success",
          details: "Login successful",
        })

        // Update last login
        await updateDoc(machineRef, {
          lastLoginAt: new Date().toISOString(),
          failedAttempts: 0,
          lockedUntil: null,
        })

        localStorage.setItem("machineId", machineId)
        setSuccess("Login successful!")
        setTimeout(() => router.push("/"), 1500)
      } else {
        // Handle failed attempt
        if (newAttempts >= MAX_ATTEMPTS) {
          const lockoutTime = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
          await updateDoc(machineRef, {
            failedAttempts: newAttempts,
            lockedUntil: lockoutTime.toISOString(),
            lastFailedAttempt: new Date().toISOString(),
          })

          await addAccessLog({
            action: "login",
            machineId,
            status: "locked",
            details: "Account locked due to too many failed attempts",
          })

          setError("Too many failed attempts. Account locked for 15 minutes.")
        } else {
          await updateDoc(machineRef, {
            failedAttempts: newAttempts,
            lastFailedAttempt: new Date().toISOString(),
          })

          await addAccessLog({
            action: "login",
            machineId,
            status: "failed",
            details: `Failed login attempt (${newAttempts}/${MAX_ATTEMPTS})`,
          })

          setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`)
        }

        setAttempts(newAttempts)
        setPin("")
      }
    } catch (err) {
      console.error("Error during login:", err)
      setError("An error occurred. Please try again.")

      await addAccessLog({
        action: "login",
        machineId,
        status: "error",
        details: "Error during login",
        error: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const numberPad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "⌫"],
  ]

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-[#0e5f97] hover:text-[#0e4772]">
            <ArrowLeft className="h-5 w-5 mr-2" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Machine ID */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Machine Login
                </h2>
                <p className="text-gray-500">Enter your machine credentials</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="machine-id" className="block text-sm font-medium text-gray-700">
                    Machine ID
                  </label>
                  <input
                    id="machine-id"
                    type="text"
                    placeholder="MEGG-2025-94M-019"
                    value={machineId}
                    onChange={handleMachineIdChange}
                    maxLength={17} // 4+4+3+3 chars + 3 hyphens
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e5f97] focus:border-[#0e5f97] font-mono"
                    style={{ letterSpacing: "0.5px" }}
                  />
                  <p className="text-xs text-gray-500">Format: XXXX-XXXX-XXX-XXX</p>
                </div>

                {/* Security Info */}
                <div className="bg-[#0e5f97]/5 rounded-lg p-4">
                  <h3 className="font-medium text-[#0e4772] flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4" />
                    Security Notice
                  </h3>
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <Lock className="w-4 h-4 text-[#0e5f97] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">Account Protection</p>
                      <p>Your account will be temporarily locked after {MAX_ATTEMPTS} failed attempts.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - PIN Entry */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
                <Key className="w-6 h-6" />
                Enter PIN
              </h2>
              <p className="text-gray-500">Enter your 4-digit security PIN</p>
            </div>

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* PIN Display */}
              <div className="text-center space-y-4">
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
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                {numberPad.map((row, rowIndex) =>
                  row.map((digit, colIndex) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => {
                        if (digit === "C") handleClear()
                        else if (digit === "⌫") handleBackspace()
                        else handlePinInput(digit)
                      }}
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

              {/* Login Button */}
              {pin.length === 4 && (
                <button
                  onClick={handleLogin}
                  disabled={loading || !machineId}
                  className="w-full bg-[#0e5f97] hover:bg-[#0e4772] text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </div>
                  ) : (
                    "Login"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

