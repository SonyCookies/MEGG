"use client"
import { useState, useEffect, useRef } from "react"
import React from "react"

import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Shield, Lock, Key, AlertCircle, Check, XCircle, Keyboard, ChevronRight, Loader } from "lucide-react"
import { addAccessLog } from "../utils/logging"

// Add this improved debug helper function at the top of your component
const debugMachineId = (id: string, source: string) => {
  console.log(`[DEBUG ${source}] Machine ID: "${id}"`)
  console.log(`[DEBUG ${source}] Length: ${id.length}`)
  console.log(
    `[DEBUG ${source}] Character codes:`,
    [...id].map((c) => `${c}:${c.charCodeAt(0)}`),
  )
  console.log(`[DEBUG ${source}] Parts:`, id.split("-"))

  // Check for any whitespace at the beginning or end
  if (id !== id.trim()) {
    console.warn(`[DEBUG ${source}] WARNING: Machine ID contains whitespace at beginning or end`)
  }

  // Check for any non-visible characters
  const nonVisibleChars = [...id].filter((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126)
  if (nonVisibleChars.length > 0) {
    console.warn(
      `[DEBUG ${source}] WARNING: Machine ID contains non-visible characters:`,
      nonVisibleChars.map((c) => `${c}:${c.charCodeAt(0)}`),
    )
  }
}

// Replace the cleanMachineId function with this improved version that handles O/0 confusion
const cleanMachineId = (id: string): string => {
  // Remove all whitespace
  const cleaned = id.replace(/\s+/g, "")

  // Replace any 'O' or 'o' with '0' (zero) - common OCR/visual confusion
  const corrected = cleaned.replace(/[oO]/g, "0")

  // Check if we have a properly formatted ID with dashes
  if (/^MEGG-\d{4}-\d{3}-\d{3}$/.test(corrected)) {
    console.log(`[DEBUG cleanMachineId] ID already in correct format: "${corrected}"`)
    return corrected
  }

  // Split by dashes and filter out empty parts
  const parts = corrected.split("-").filter((p) => p.length > 0)

  if (parts.length === 4 && parts[0] === "MEGG") {
    // We have the right number of parts, just make sure they're clean
    const formattedId = `MEGG-${parts[1]}-${parts[2]}-${parts[3]}`
    console.log(`[DEBUG cleanMachineId] Reformatted from parts: "${formattedId}"`)
    return formattedId
  } else if (parts.length === 1) {
    // No hyphens, try to parse based on expected format
    const fullString = parts[0]
    if (fullString.startsWith("MEGG") && fullString.length >= 14) {
      const formattedId = `MEGG-${fullString.substring(4, 8)}-${fullString.substring(8, 11)}-${fullString.substring(11, 14)}`
      console.log(`[DEBUG cleanMachineId] Reformatted from single string: "${formattedId}"`)
      return formattedId
    }
  }

  // If we can't parse it properly, try to reconstruct it from the original
  if (corrected.startsWith("MEGG")) {
    const remainder = corrected.substring(4)
    if (remainder.length >= 10) {
      // At least enough characters for YYYY-SSS-UUU
      const formattedId = `MEGG-${remainder.substring(0, 4)}-${remainder.substring(4, 7)}-${remainder.substring(7, 10)}`
      console.log(`[DEBUG cleanMachineId] Reconstructed from original: "${formattedId}"`)
      return formattedId
    }
  }

  // If all else fails, return the cleaned string
  console.log(`[DEBUG cleanMachineId] Could not format properly, returning cleaned: "${corrected}"`)
  return corrected
}

export default function LoginPage() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [machineId, setMachineId] = useState("")
  const [savedMachineId, setSavedMachineId] = useState("")
  const [showSavedModal, setShowSavedModal] = useState(false)
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [inputMode, setInputMode] = useState<"machineId" | "pin">("machineId")
  const [machineIdPart, setMachineIdPart] = useState<"year" | "series" | "unit">("year")
  const [yearInput, setYearInput] = useState("")
  const [seriesInput, setSeriesInput] = useState("")
  const [unitInput, setUnitInput] = useState("")
  const [isMachineIdFocused, setIsMachineIdFocused] = useState(true)
  const machineIdInputRef = useRef<HTMLInputElement>(null)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100)

    const saved = localStorage.getItem("machineId")
    if (saved) {
      setSavedMachineId(saved)
      setShowSavedModal(true)
    }

    return () => {
      clearTimeout(timer)
    }
  }, [])

  // Effect to update machineId when parts change
  useEffect(() => {
    const parts = ["MEGG"]
    if (yearInput) parts.push(yearInput)
    if (yearInput && seriesInput) parts.push(seriesInput)
    if (yearInput && seriesInput && unitInput) parts.push(unitInput)

    const newMachineId = parts.join("-")
    setMachineId(newMachineId)

    // Debug log
    debugMachineId(newMachineId, "useEffect")
  }, [yearInput, seriesInput, unitInput])

  // Effect to switch to PIN mode when machine ID is complete
  useEffect(() => {
    if (yearInput.length === 4 && seriesInput.length === 3 && unitInput.length === 3) {
      setInputMode("pin")
      setIsMachineIdFocused(false)
    }
  }, [yearInput, seriesInput, unitInput])

  const handleUseSavedMachine = () => {
    // Parse the saved machine ID into its components
    const cleanSavedMachineId = savedMachineId.trim()
    debugMachineId(cleanSavedMachineId, "handleUseSavedMachine-before")

    const parts = cleanSavedMachineId.split("-")
    if (parts.length === 4) {
      setYearInput(parts[1].trim())
      setSeriesInput(parts[2].trim())
      setUnitInput(parts[3].trim())
    }
    setMachineId(cleanSavedMachineId)

    // Debug log after setting
    setTimeout(() => {
      debugMachineId(machineId, "handleUseSavedMachine-after")
    }, 0)

    setInputMode("pin")
    setIsMachineIdFocused(false)
    setShowSavedModal(false)
  }

  const handleUseDifferentMachine = () => {
    setShowSavedModal(false)
    // Focus on the machine ID input
    setTimeout(() => {
      if (machineIdInputRef.current) {
        machineIdInputRef.current.focus()
      }
    }, 100)
  }

  const handleClearSavedMachine = () => {
    localStorage.removeItem("machineId")
    setSavedMachineId("")
    setShowSavedModal(false)
  }

  const handleMachineIdInput = (digit: string) => {
    // Ensure digit is trimmed
    const cleanDigit = digit.trim()
    console.log(`[DEBUG handleMachineIdInput] Adding digit: "${cleanDigit}" to ${machineIdPart}`)

    if (machineIdPart === "year") {
      if (yearInput.length < 4) {
        const newYearInput = yearInput + cleanDigit
        console.log(`[DEBUG handleMachineIdInput] New yearInput: "${newYearInput}"`)
        setYearInput(newYearInput)
        if (yearInput.length === 3) {
          // Automatically move to series after completing year
          setMachineIdPart("series")
        }
      }
    } else if (machineIdPart === "series") {
      if (seriesInput.length < 3) {
        const newSeriesInput = seriesInput + cleanDigit
        console.log(`[DEBUG handleMachineIdInput] New seriesInput: "${newSeriesInput}"`)
        setSeriesInput(newSeriesInput)
        if (seriesInput.length === 2) {
          // Automatically move to unit after completing series
          setMachineIdPart("unit")
        }
      }
    } else if (machineIdPart === "unit") {
      if (unitInput.length < 3) {
        const newUnitInput = unitInput + cleanDigit
        console.log(`[DEBUG handleMachineIdInput] New unitInput: "${newUnitInput}"`)
        setUnitInput(newUnitInput)
        if (unitInput.length === 2) {
          // Will automatically switch to PIN mode via useEffect
        }
      }
    }
  }

  const handleMachineIdBackspace = () => {
    if (machineIdPart === "year" && yearInput.length > 0) {
      setYearInput((prev) => prev.slice(0, -1))
    } else if (machineIdPart === "series") {
      if (seriesInput.length > 0) {
        setSeriesInput((prev) => prev.slice(0, -1))
      } else {
        // Go back to year if series is empty
        setMachineIdPart("year")
      }
    } else if (machineIdPart === "unit") {
      if (unitInput.length > 0) {
        setUnitInput((prev) => prev.slice(0, -1))
      } else {
        // Go back to series if unit is empty
        setMachineIdPart("series")
      }
    }
  }

  const handleMachineIdClear = () => {
    if (machineIdPart === "year") {
      setYearInput("")
    } else if (machineIdPart === "series") {
      setSeriesInput("")
    } else if (machineIdPart === "unit") {
      setUnitInput("")
    }
  }

  const handlePinInput = (digit: string) => {
    if (loading) return
    setError("")

    if (pin.length < 4) {
      setPin((prev) => prev + digit)
    }
  }

  const handlePinBackspace = () => {
    if (loading) return
    setError("")
    setPin((prev) => prev.slice(0, -1))
  }

  const handlePinClear = () => {
    if (loading) return
    setError("")
    setPin("")
  }

  const handleSwitchToMachineId = () => {
    setInputMode("machineId")
    setIsMachineIdFocused(true)

    // If machine ID is complete, start editing from the unit part
    if (yearInput.length === 4 && seriesInput.length === 3 && unitInput.length === 3) {
      setMachineIdPart("unit")
    } else if (yearInput.length === 4 && seriesInput.length === 3) {
      setMachineIdPart("unit")
    } else if (yearInput.length === 4) {
      setMachineIdPart("series")
    } else {
      setMachineIdPart("year")
    }

    setTimeout(() => {
      if (machineIdInputRef.current) {
        machineIdInputRef.current.focus()
      }
    }, 100)
  }

  const handleSwitchToPin = () => {
    if (yearInput.length === 4 && seriesInput.length === 3 && unitInput.length === 3) {
      setInputMode("pin")
      setIsMachineIdFocused(false)
    } else {
      setError("Please complete the Machine ID first")
    }
  }

  // Replace the handleLogin function with this updated version
  const handleLogin = async () => {
    // Show the verify modal first
    setShowVerifyModal(true)

    // Ensure machineId is properly formatted and trimmed
    let formattedMachineId = machineId.trim()

    // Apply thorough cleaning to ensure dashes are preserved
    formattedMachineId = cleanMachineId(formattedMachineId)

    // Debug log before login
    debugMachineId(formattedMachineId, "handleLogin-cleaned")

    // Verify that the machine ID has dashes
    if (!formattedMachineId.includes("-")) {
      console.warn("[DEBUG handleLogin] WARNING: Machine ID does not contain dashes after cleaning!")
      // Force the format if needed
      if (formattedMachineId.startsWith("MEGG") && formattedMachineId.length >= 14) {
        formattedMachineId = `MEGG-${formattedMachineId.substring(4, 8)}-${formattedMachineId.substring(8, 11)}-${formattedMachineId.substring(11, 14)}`
        console.log(`[DEBUG handleLogin] Forced dash format: "${formattedMachineId}"`)
      }
    }

    // Also create a simplified version without hyphens for debugging
    const simplifiedId = formattedMachineId.replace(/-/g, "")
    console.log(`[DEBUG handleLogin] Simplified ID (no hyphens): "${simplifiedId}"`)

    if (!formattedMachineId || !pin) {
      setError("Please enter both Machine ID and PIN")
      setShowVerifyModal(false)
      return
    }

    try {
      setLoading(true)
      setError("")

      console.log(`[DEBUG handleLogin] Sending login request with machineId: "${formattedMachineId}" and PIN: "${pin}"`)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machineId: formattedMachineId, // This should now always have dashes
          pin,
          // Also send alternative formats to help debug
          machineIdAlternatives: {
            simplified: simplifiedId,
            lowercase: formattedMachineId.toLowerCase(),
            uppercase: formattedMachineId.toUpperCase(),
          },
        }),
      })

      const data = await response.json()
      console.log(`[DEBUG handleLogin] Response:`, data)

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      localStorage.setItem("machineId", formattedMachineId)

      setSuccess("Login successful!")
      setTimeout(() => {
        setShowVerifyModal(false)
        router.push("/home")
      }, 1500)
    } catch (err: any) {
      console.error("Error during login:", err)
      setError(err.message || "An error occurred. Please try again.")
      setShowVerifyModal(false)

      await addAccessLog(
        {
          action: "login",
          status: "error",
          details: "Error during login",
          error: err.message,
        },
        formattedMachineId,
      )
    } finally {
      setLoading(false)
    }
  }

  // MachineIdInput Component
  function MachineIdInput() {
    const handleFocus = () => {
      setInputMode("machineId")
      setIsMachineIdFocused(true)
    }

    // Create segments for the machine ID visualization
    const segments = ["MEGG"]
    const parts = ["MEGG"]
    if (yearInput) parts.push(yearInput)
    if (yearInput && seriesInput) parts.push(seriesInput)
    if (yearInput && seriesInput && unitInput) parts.push(unitInput)

    return (
      <div className="h-full flex flex-col">
        <div className="bg-gradient-to-br from-white/40 to-white/30 backdrop-blur-md rounded-xl border border-white/50 shadow-lg p-3 relative overflow-hidden h-full">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
              backgroundSize: "15px 15px",
            }}
          ></div>

          <div className="relative z-10 h-full flex flex-col">
            {/* Header with back button and title - moved to left column */}
            <div className="flex items-center mb-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center text-[#0e5f97] hover:text-[#0e5f97]/80 transition-colors bg-white/50 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:shadow-md border border-[#0e5f97]/10 mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>

              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#0e5f97]">Machine Login</h1>
              </div>
            </div>

            <div className="mb-1">
              <h2 className="text-base font-semibold text-[#0e5f97] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Machine ID
              </h2>
            </div>

            {/* Visual Machine ID Display */}
            <div className="mb-3 relative">
              <div className="absolute -left-2 -top-2 w-20 h-20 bg-[#0e5f97]/10 rounded-full blur-xl"></div>
              <div
                className={`relative bg-gradient-to-r from-[#0e5f97]/5 to-white/80 rounded-lg border ${isMachineIdFocused ? "border-[#0e5f97]/40 ring-2 ring-[#0e5f97]/20" : "border-[#0e5f97]/10"} p-2 transition-all duration-300`}
              >
                <div className="grid grid-cols-4 gap-1">
                  {parts.map((segment, index) => {
                    const isActive =
                      ((index === 1 && machineIdPart === "year") ||
                        (index === 2 && machineIdPart === "series") ||
                        (index === 3 && machineIdPart === "unit")) &&
                      isMachineIdFocused

                    const isComplete =
                      index === 0 ||
                      (index === 1 && yearInput.length === 4) ||
                      (index === 2 && seriesInput.length === 3) ||
                      (index === 3 && unitInput.length === 3)

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-center p-1 rounded border transition-all duration-300 ${
                          isActive
                            ? "bg-[#0e5f97]/10 border-[#0e5f97]/50 shadow-md"
                            : isComplete
                              ? "bg-white border-[#0e5f97]/30 shadow-sm"
                              : "bg-gray-50 border-gray-200"
                        }`}
                        onClick={handleFocus}
                      >
                        <span
                          className={`font-mono text-xs text-center ${isActive ? "text-[#0e5f97] font-bold" : "text-[#0e5f97] font-medium"}`}
                        >
                          {segment}
                        </span>
                        {isActive && <span className="ml-1 inline-block w-1 h-4 bg-[#0e5f97] animate-pulse"></span>}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-[10px] text-gray-500">Prefix</span>
                  <span
                    className={`text-[10px] ${machineIdPart === "year" && isMachineIdFocused ? "text-[#0e5f97] font-medium" : "text-gray-500"}`}
                  >
                    Year
                  </span>
                  <span
                    className={`text-[10px] ${machineIdPart === "series" && isMachineIdFocused ? "text-[#0e5f97] font-medium" : "text-gray-500"}`}
                  >
                    Series
                  </span>
                  <span
                    className={`text-[10px] ${machineIdPart === "unit" && isMachineIdFocused ? "text-[#0e5f97] font-medium" : "text-gray-500"}`}
                  >
                    Unit
                  </span>
                </div>
              </div>
            </div>

            {/* Hidden input for focus management */}
            <input ref={machineIdInputRef} type="text" className="sr-only" onFocus={handleFocus} tabIndex={-1} />

            {/* Current input status */}
            <div className="bg-[#0e5f97]/5 rounded-lg p-2 border border-[#0e5f97]/10 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#0e5f97]">
                  {inputMode === "machineId" ? (
                    <>
                      {machineIdPart === "year" && "Enter Year (4 digits)"}
                      {machineIdPart === "series" && "Enter Series (3 digits)"}
                      {machineIdPart === "unit" && "Enter Unit (3 digits)"}
                    </>
                  ) : (
                    "Machine ID"
                  )}
                </span>
                {inputMode === "machineId" ? (
                  <button
                    onClick={handleSwitchToPin}
                    disabled={!(yearInput.length === 4 && seriesInput.length === 3 && unitInput.length === 3)}
                    className="text-xs bg-[#0e5f97] text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ) : (
                  <button onClick={handleSwitchToMachineId} className="relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0e5f97] via-[#1a88c9] to-[#0e5f97] opacity-80 rounded-lg animate-animate-gradient bg-[length:200%_100%]"></div>
                    <div className="relative flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white/30 shadow-lg group-hover:shadow-[0_0_15px_rgba(14,95,151,0.5)] transition-all duration-300">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#0e5f97]/0 via-white/40 to-[#0e5f97]/0 opacity-0 group-hover:opacity-100 group-hover:animate-shine"></div>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Keyboard className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="mr-12 font-medium text-sm">Edit</span>
                      </div>
                      <div className="absolute right-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#0e5f97]/5 to-[#0e5f97]/10 rounded-lg p-2 border border-[#0e5f97]/10 relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iIzBlNWY5NyIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIvPjwvZz48L3N2Zz4=')",
                    backgroundSize: "20px 20px",
                  }}
                ></div>
              </div>

              <div className="relative z-10">
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <Lock className="w-3 h-3 text-[#0e5f97] mt-0.5 flex-shrink-0" />
                  <p className="font-medium text-gray-700">Account locked after 5 failed attempts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // PinEntry Component
  function PinEntry() {
    const numberPad = [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
      ["C", "0", "⌫"],
    ]

    const renderPinDisplay = () => (
      <div className="flex gap-2 justify-center">
        {[...Array(4)].map((_, i) => {
          const isFilled = i < pin.length
          return (
            <div
              key={i}
              className={`relative w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-all duration-300 overflow-hidden
        ${
          isFilled
            ? "border-none bg-gradient-to-br from-[#0e5f97] to-[#0c4d7a] text-white shadow-[0_0_10px_rgba(14,95,151,0.4)]"
            : "border-2 border-[#0e5f97]/20 bg-white/50 text-transparent"
        }`}
            >
              {/* Inner glow effect */}
              {isFilled && <div className="absolute inset-0 bg-[#0e5f97] opacity-20 animate-pulse"></div>}

              {/* Highlight effect */}
              <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-lg"></div>

              {/* Dot indicator */}
              <div
                className={`relative z-10 w-2.5 h-2.5 rounded-full ${isFilled ? "bg-white" : "bg-[#0e5f97]/20"}`}
              ></div>

              {/* Bottom shadow */}
              <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-black/5 rounded-full"></div>
            </div>
          )
        })}
      </div>
    )

    return (
      <div className="bg-gradient-to-br from-white/40 to-white/30 backdrop-blur-md rounded-xl border border-white/50 shadow-lg p-4 relative overflow-hidden h-full flex flex-col">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
            backgroundSize: "15px 15px",
          }}
        ></div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-[#0e5f97] flex items-center gap-2">
              {inputMode === "machineId" ? (
                <>
                  <Keyboard className="w-5 h-5" />
                  {machineIdPart === "year" && "Enter Year"}
                  {machineIdPart === "series" && "Enter Series"}
                  {machineIdPart === "unit" && "Enter Unit"}
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  Enter PIN
                </>
              )}
            </h2>
          </div>

          <div className="flex flex-col flex-1 justify-between">
            {/* PIN Display or Machine ID Part Display */}
            <div className="text-center mb-3">
              {inputMode === "pin" ? (
                renderPinDisplay()
              ) : (
                <div className="flex justify-center items-center h-10">
                  <div className="bg-white/80 border border-[#0e5f97]/20 rounded-lg px-3 py-1 font-mono text-lg text-[#0e5f97] font-medium">
                    {machineIdPart === "year" && (
                      <span>
                        {yearInput}
                        <span className="animate-pulse">|</span>
                      </span>
                    )}
                    {machineIdPart === "series" && (
                      <span>
                        {seriesInput}
                        <span className="animate-pulse">|</span>
                      </span>
                    )}
                    {machineIdPart === "unit" && (
                      <span>
                        {unitInput}
                        <span className="animate-pulse">|</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Numpad - changes based on input mode */}
            <div className="grid grid-cols-3 gap-2 w-full relative">
              {/* Enhanced background effects */}
              <div className="absolute -inset-3 bg-gradient-to-br from-[#0e5f97]/5 to-transparent rounded-xl blur-lg opacity-70"></div>
              <div className="absolute -inset-1 border border-[#0e5f97]/10 rounded-xl"></div>
              <div className="absolute -bottom-2 inset-x-4 h-1 bg-black/5 blur-md rounded-full"></div>

              {/* Subtle grid pattern */}
              <div
                className="absolute inset-0 rounded-xl opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
                  backgroundSize: "15px 15px",
                }}
              ></div>

              {numberPad.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {row.map((digit, colIndex) => {
                    // Special case: transform the "0" button into a login button when PIN is complete
                    const isPinComplete = pin.length === 4 && inputMode === "pin"
                    const isZeroButton = digit === "0"
                    const isLoginButton = isPinComplete && isZeroButton
                    const isSpecial = digit === "C" || digit === "⌫" || isLoginButton

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => {
                          if (inputMode === "machineId") {
                            if (digit === "C") {
                              handleMachineIdClear()
                            } else if (digit === "⌫") {
                              handleMachineIdBackspace()
                            } else {
                              handleMachineIdInput(digit)
                            }
                          } else {
                            if (isLoginButton) {
                              handleLogin()
                            } else if (digit === "C") {
                              handlePinClear()
                            } else if (digit === "⌫") {
                              handlePinBackspace()
                            } else {
                              handlePinInput(digit)
                            }
                          }
                        }}
                        disabled={
                          loading ||
                          (inputMode === "pin" && !machineId) ||
                          (isPinComplete && !isLoginButton && !isSpecial)
                        }
                        className={`
                        h-16 text-2xl font-medium rounded-lg transition-all duration-300 
                        relative group overflow-hidden w-full
                        ${
                          isLoginButton
                            ? "bg-gradient-to-br from-[#0e5f97] to-[#0c4d7a] text-white border border-[#0e5f97]/50"
                            : isSpecial
                              ? "bg-gradient-to-br from-white to-gray-50 text-[#0e5f97] border border-[#0e5f97]/20"
                              : "bg-gradient-to-br from-white to-gray-50 text-gray-700 border border-white/50"
                        }
                        active:translate-y-0.5 active:shadow-inner
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0
                      `}
                      >
                        {/* Inner shadow effect */}
                        <span className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/80 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></span>

                        {/* Button press effect */}
                        <span className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/5 to-transparent opacity-0 group-active:opacity-100 transition-opacity"></span>

                        {/* Highlight effect */}
                        <span className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/50 to-transparent rounded-t-lg"></span>

                        {/* Button content */}
                        <span className="relative z-10 flex items-center justify-center h-full">
                          {isLoginButton ? (
                            <div className="flex items-center justify-center gap-1">
                              {loading ? (
                                <>
                                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span className="text-base">Verifying...</span>
                                </>
                              ) : (
                                <>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-1"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <polyline points="10 17 15 12 10 7" />
                                    <line x1="15" y1="12" x2="3" y2="12" />
                                  </svg>
                                  <span className="text-base font-medium">Verify</span>
                                </>
                              )}
                            </div>
                          ) : (
                            <>
                              {isSpecial && digit === "C" && <span className="text-sm font-semibold">CLEAR</span>}
                              {isSpecial && digit === "⌫" && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-7 w-7"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0-2-2z"></path>
                                  <line x1="18" y1="9" x2="12" y2="15"></line>
                                  <line x1="12" y1="9" x2="18" y2="15"></line>
                                </svg>
                              )}
                              {!isSpecial && digit}
                            </>
                          )}
                        </span>

                        {/* Bottom shadow */}
                        <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-black/5 rounded-full"></span>

                        {/* Animated highlight for login button */}
                        {isLoginButton && (
                          <>
                            <span className="absolute inset-0 bg-white/10 rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-500 origin-center"></span>
                            <span className="absolute inset-0 bg-white/20 rounded-lg animate-pulse-subtle"></span>
                            <span className="absolute -inset-0.5 rounded-lg border-2 border-white/30 animate-ping-slow opacity-70"></span>
                          </>
                        )}
                      </button>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // SavedMachineModal Component
  function SavedMachineModal() {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="relative backdrop-blur-sm bg-white/95 rounded-xl shadow-lg overflow-hidden border border-white/50 max-w-lg w-full">
          {/* Subtle edge glow */}
          <div className="absolute inset-0 rounded-xl">
            <div className="absolute inset-0 rounded-xl animate-border-glow"></div>
          </div>

          <div className="relative z-10 p-5">
            {/* Header with icon */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="w-7 h-7 text-[#0e5f97]" />
                <h2 className="text-2xl font-semibold text-[#0e5f97]">Saved Machine</h2>
              </div>
            </div>

            {/* Machine ID display - larger for touch */}
            <div className="bg-[#0e5f97]/5 rounded-lg p-4 border border-[#0e5f97]/10 mb-5">
              <div className="font-mono text-lg text-[#0e5f97] bg-white/80 p-3 rounded border border-[#0e5f97]/20 break-all shadow-inner">
                {savedMachineId}
              </div>
            </div>

            {/* Large touch-friendly buttons */}
            <div className="space-y-4">
              <button
                onClick={handleUseSavedMachine}
                className="w-full h-16 bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] text-white py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg relative overflow-hidden group text-xl font-medium"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
                <div className="flex items-center justify-center gap-2 relative z-10">
                  <Check className="h-6 w-6" />
                  <span>Use This Machine</span>
                </div>
              </button>

              <button
                onClick={handleUseDifferentMachine}
                className="w-full h-14 bg-white text-[#0e5f97] py-3 px-4 rounded-lg transition-colors border border-[#0e5f97]/20 shadow-md hover:shadow-lg text-lg font-medium"
              >
                Use Different Machine
              </button>

              {/* Clear button - still touch-friendly but less prominent */}
              <button
                onClick={handleClearSavedMachine}
                className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 py-3 group text-base font-medium"
              >
                <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Clear Saved Machine</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // PIN Error Modal Component
  function PinErrorModal() {
    return (
      <div className="fixed inset-0 z-50">
        {/* Backdrop with blur effect */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setError("")}></div>

        {/* Modal content */}
        <div className="flex justify-center mt-8">
          <div className="relative bg-white rounded-xl shadow-2xl w-[90%] max-w-md p-6 border border-white/50 animate-fade-in-up">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">PIN Error</h3>
              <p className="text-red-600 mb-4">{error}</p>

              <button
                onClick={() => setError("")}
                className="px-6 py-2 bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] hover:from-[#0c4d7a] hover:to-[#0a3d62] text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Verification Modal Component
  function VerifyModal() {
    return (
      <div className="fixed inset-0 z-50">
        {/* Backdrop with blur effect */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        {/* Modal content */}
        <div className="flex justify-center mt-8">
          <div className="relative bg-white rounded-xl shadow-2xl w-[90%] max-w-md p-6 border border-white/50 animate-fade-in-up">
            <div className="flex flex-col items-center text-center">
              {success ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                    <Check className="h-10 w-10 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Login Successful</h3>
                  <p className="text-green-600 mb-4">Redirecting to home page...</p>
                  <div className="w-full bg-green-100 rounded-lg p-2 mt-2">
                    <div className="h-1.5 bg-green-500 rounded-full animate-progress"></div>
                  </div>
                </>
              ) : loading ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                    <Loader className="h-10 w-10 text-[#0e5f97] animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Verifying</h3>
                  <p className="text-[#0e5f97] mb-4">Please wait while we verify your credentials...</p>
                  <div className="flex items-center justify-center gap-2 text-[#0e5f97]">
                    <div
                      className="w-2 h-2 rounded-full bg-[#0e5f97] animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-[#0e5f97] animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-[#0e5f97] animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0e5f97] pt-6 px-4 pb-4 flex flex-col items-center relative overflow-hidden">
      {/* Dynamic background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0wIDMwaDMwdjMwSDB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwSDB2MzBoMzB6IiBzdHJva2U9InRnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwaDMwdjMwSDMweiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iLjUiLz48L2c+PC9zdmc+')] opacity-70"></div>

      {showSavedModal && <SavedMachineModal />}
      {error && <PinErrorModal />}
      {showVerifyModal && <VerifyModal />}

      {/* Main content */}
      <div
        className={`max-w-3xl w-full transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} relative`}
      >
        {/* Large background logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="relative w-[80%] h-[80%] opacity-10">
            <Image src="/Logos/logoblue.png" alt="MEGG Logo Background" fill className="object-contain select-none" />
          </div>
        </div>

        {/* Card with glass morphism effect */}
        <div className="relative backdrop-blur-sm bg-white/70 rounded-2xl shadow-2xl overflow-hidden border border-white/50 h-[440px]">
          {/* Holographic overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            ></div>
          </div>

          {/* Creative background elements */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-[#0e5f97]/20 to-transparent rounded-full blur-xl"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-tl from-[#0e5f97]/30 to-transparent rounded-full blur-xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-[#0e5f97]/20 to-transparent rounded-full blur-xl"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-[#0e5f97]/30 to-transparent rounded-full blur-xl"></div>

          {/* Animated edge glow */}
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl animate-border-glow"></div>
          </div>

          <div className="relative z-10 p-4 h-full">
            {/* Main content grid */}
            <div className="flex flex-row h-full">
              {/* Left column - Machine ID - reduced to 40% width */}
              <div className="w-2/5 pr-3 relative">
                <MachineIdInput />
              </div>

              {/* Creative divider between columns */}
              <div className="absolute left-2/5 top-4 bottom-4 transform -translate-x-1/2 w-[2px] z-20">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0e5f97]/30 to-transparent"></div>
              </div>

              {/* Right column - PIN Entry - increased to 60% width */}
              <div className="w-3/5 relative">
                <PinEntry />
              </div>
            </div>
          </div>

          {/* Decorative corner accents with enhanced design */}
          <div className="absolute top-0 left-0 w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-t-2 border-l-2 border-[#0e5f97]/30 rounded-tl-2xl"></div>
            <div className="absolute top-2 left-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16">
            <div className="absolute top-0 right-0 w-full h-full border-t-2 border-r-2 border-[#0e5f97]/30 rounded-tr-2xl"></div>
            <div className="absolute top-2 right-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-16 h-16">
            <div className="absolute bottom-0 left-0 w-full h-full border-b-2 border-l-2 border-[#0e5f97]/30 rounded-bl-2xl"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 right-0 w-16 h-16">
            <div className="absolute bottom-0 right-0 w-full h-full border-b-2 border-r-2 border-[#0e5f97]/30 rounded-br-2xl"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Add keyframes for animations */}
      <style jsx global>{`
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 0.4; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); }
          20%, 100% { transform: translateX(100%); }
        }
        
        @keyframes border-glow {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(14, 95, 151, 0.3),
                        0 0 10px rgba(14, 95, 151, 0.2),
                        0 0 15px rgba(14, 95, 151, 0.1);
          }
          50% { 
            box-shadow: 0 0 10px rgba(14, 95, 151, 0.5),
                        0 0 20px rgba(14, 95, 151, 0.3),
                        0 0 30px rgba(14, 95, 151, 0.2);
          }
        }
        
        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.6; }
        }
        
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        @keyframes animate-gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes animate-progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        .animate-progress {
          animation: animate-progress 3s linear forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
