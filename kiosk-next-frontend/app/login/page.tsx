//D:\4THYEAR\CAPSTONE\MEGG\kiosk-next-frontend\app\login\page.tsx

"use client"

import React, {useState, useEffect, useRef} from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Shield, Key, AlertCircle, Check, XCircle, Keyboard, ChevronRight, ArrowLeft, Loader, Lock } from "lucide-react"
import type { MachineIdPart, LoginState } from "./types"

// ==========================================
// Constants
// ==========================================
const NUMBER_PAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["C", "0", "⌫"],
]

// ==========================================
// Helper Functions
// ==========================================

/**
 * Cleans and formats machine ID
 */
const cleanMachineId = (id: string): string => {
  // Remove whitespace and handle O/0 confusion
  const cleaned = id.replace(/\s+/g, "").replace(/[oO]/g, "0")

  // Check if already in correct format
  if (/^MEGG-\d{4}-\d{3}-\d{3}$/.test(cleaned)) {
    return cleaned
  }

  // Split by dashes and filter out empty parts
  const parts = cleaned.split("-").filter((p) => p.length > 0)

  if (parts.length === 4 && parts[0] === "MEGG") {
    // We have the right number of parts
    return `MEGG-${parts[1]}-${parts[2]}-${parts[3]}`
  } else if (parts.length === 1) {
    // No hyphens, try to parse based on expected format
    const fullString = parts[0]
    if (fullString.startsWith("MEGG") && fullString.length >= 14) {
      return `MEGG-${fullString.substring(4, 8)}-${fullString.substring(8, 11)}-${fullString.substring(11, 14)}`
    }
  }

  // Try to reconstruct from the original
  if (cleaned.startsWith("MEGG")) {
    const remainder = cleaned.substring(4)
    if (remainder.length >= 10) {
      return `MEGG-${remainder.substring(0, 4)}-${remainder.substring(4, 7)}-${remainder.substring(7, 10)}`
    }
  }

  // Return cleaned string if all else fails
  return cleaned
}

/**
 * Check if machine ID is complete
 */
const isMachineIdComplete = (yearInput: string, seriesInput: string, unitInput: string): boolean => {
  return yearInput.length === 4 && seriesInput.length === 3 && unitInput.length === 3
}

// ==========================================
// Main Component
// ==========================================
export default function LoginPage() {
  const router = useRouter()
  const machineIdInputRef = useRef<HTMLInputElement>(null)

  // State management
  const [state, setState] = useState<LoginState>({
    isLoaded: false,
    machineId: "",
    savedMachineId: "",
    showSavedModal: false,
    pin: "",
    loading: false,
    error: "",
    success: "",
    inputMode: "machineId",
    machineIdPart: "year",
    yearInput: "",
    seriesInput: "",
    unitInput: "",
    isMachineIdFocused: true,
    showVerifyModal: false,
    showPinErrorModal: false,
  })

  // Destructure state for convenience
  const {
    isLoaded,
    machineId,
    savedMachineId,
    showSavedModal,
    pin,
    loading,
    error,
    success,
    inputMode,
    machineIdPart,
    yearInput,
    seriesInput,
    unitInput,
    isMachineIdFocused,
    showVerifyModal,
    showPinErrorModal,
  } = state

  // Helper function to update state
  const updateState = (updates: Partial<LoginState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }

  // ==========================================
  // Effects
  // ==========================================

  // Initial load effect
  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => updateState({ isLoaded: true }), 100)

    // Check for saved machine ID
    const saved = localStorage.getItem("machineId")
    if (saved) {
      updateState({
        savedMachineId: saved,
        showSavedModal: true,
      })
    }

    return () => clearTimeout(timer)
  }, [])

  // Update machineId when parts change
  useEffect(() => {
    const parts = ["MEGG"]
    if (yearInput) parts.push(yearInput)
    if (yearInput && seriesInput) parts.push(seriesInput)
    if (yearInput && seriesInput && unitInput) parts.push(unitInput)

    const newMachineId = parts.join("-")
    updateState({ machineId: newMachineId })
  }, [yearInput, seriesInput, unitInput])

  // Switch to PIN mode when machine ID is complete
  useEffect(() => {
    if (isMachineIdComplete(yearInput, seriesInput, unitInput)) {
      updateState({
        inputMode: "pin",
        isMachineIdFocused: false,
      })
    }
  }, [yearInput, seriesInput, unitInput])

  // ==========================================
  // Event Handlers
  // ==========================================

  const handleUseSavedMachine = () => {
    // Parse the saved machine ID into its components
    const cleanSavedMachineId = savedMachineId.trim()

    const parts = cleanSavedMachineId.split("-")
    if (parts.length === 4) {
      updateState({
        yearInput: parts[1].trim(),
        seriesInput: parts[2].trim(),
        unitInput: parts[3].trim(),
        machineId: cleanSavedMachineId,
        inputMode: "pin",
        isMachineIdFocused: false,
        showSavedModal: false,
      })
    }
  }

  const handleUseDifferentMachine = () => {
    updateState({ showSavedModal: false })

    // Focus on the machine ID input
    setTimeout(() => {
      if (machineIdInputRef.current) {
        machineIdInputRef.current.focus()
      }
    }, 100)
  }

  const handleClearSavedMachine = () => {
    localStorage.removeItem("machineId")
    updateState({
      savedMachineId: "",
      showSavedModal: false,
    })
  }

  const handleMachineIdInput = (digit: string) => {
    // Ensure digit is trimmed
    const cleanDigit = digit.trim()

    if (machineIdPart === "year") {
      if (yearInput.length < 4) {
        const newYearInput = yearInput + cleanDigit
        updateState({ yearInput: newYearInput })

        if (yearInput.length === 3) {
          // Automatically move to series after completing year
          updateState({ machineIdPart: "series" })
        }
      }
    } else if (machineIdPart === "series") {
      if (seriesInput.length < 3) {
        const newSeriesInput = seriesInput + cleanDigit
        updateState({ seriesInput: newSeriesInput })

        if (seriesInput.length === 2) {
          // Automatically move to unit after completing series
          updateState({ machineIdPart: "unit" })
        }
      }
    } else if (machineIdPart === "unit") {
      if (unitInput.length < 3) {
        const newUnitInput = unitInput + cleanDigit
        updateState({ unitInput: newUnitInput })
      }
    }
  }

  const handleMachineIdBackspace = () => {
    if (machineIdPart === "year" && yearInput.length > 0) {
      updateState({ yearInput: yearInput.slice(0, -1) })
    } else if (machineIdPart === "series") {
      if (seriesInput.length > 0) {
        updateState({ seriesInput: seriesInput.slice(0, -1) })
      } else {
        // Go back to year if series is empty
        updateState({ machineIdPart: "year" })
      }
    } else if (machineIdPart === "unit") {
      if (unitInput.length > 0) {
        updateState({ unitInput: unitInput.slice(0, -1) })
      } else {
        // Go back to series if unit is empty
        updateState({ machineIdPart: "series" })
      }
    }
  }

  const handleMachineIdClear = () => {
    if (machineIdPart === "year") {
      updateState({ yearInput: "" })
    } else if (machineIdPart === "series") {
      updateState({ seriesInput: "" })
    } else if (machineIdPart === "unit") {
      updateState({ unitInput: "" })
    }
  }

  const handlePinInput = (digit: string) => {
    if (loading) return

    if (pin.length < 4) {
      updateState({
        error: "",
        pin: pin + digit,
      })
    }
  }

  const handlePinBackspace = () => {
    if (loading) return
    updateState({
      error: "",
      pin: pin.slice(0, -1),
    })
  }

  const handlePinClear = () => {
    if (loading) return
    updateState({
      error: "",
      pin: "",
    })
  }

  const handleSwitchToMachineId = () => {
    let newMachineIdPart: MachineIdPart = "year"

    // Determine which part to edit based on completion
    if (yearInput.length === 4 && seriesInput.length === 3 && unitInput.length === 3) {
      newMachineIdPart = "unit"
    } else if (yearInput.length === 4 && seriesInput.length === 3) {
      newMachineIdPart = "unit"
    } else if (yearInput.length === 4) {
      newMachineIdPart = "series"
    }

    updateState({
      inputMode: "machineId",
      isMachineIdFocused: true,
      machineIdPart: newMachineIdPart,
    })

    setTimeout(() => {
      if (machineIdInputRef.current) {
        machineIdInputRef.current.focus()
      }
    }, 100)
  }

  const handleSwitchToPin = () => {
    if (isMachineIdComplete(yearInput, seriesInput, unitInput)) {
      updateState({
        inputMode: "pin",
        isMachineIdFocused: false,
      })
    } else {
      updateState({
        error: "Please complete the Machine ID first",
        showPinErrorModal: true,
      })
    }
  }

  const handleLogin = async () => {
    // Check if machine ID is complete before proceeding
    if (!isMachineIdComplete(yearInput, seriesInput, unitInput)) {
      updateState({
        error: "Please complete the Machine ID first",
        showPinErrorModal: true,
      })
      return
    }

    // Show the verify modal first
    updateState({ showVerifyModal: true })

    // Ensure machineId is properly formatted and trimmed
    let formattedMachineId = machineId.trim()
    formattedMachineId = cleanMachineId(formattedMachineId)

    // Verify that the machine ID has dashes
    if (!formattedMachineId.includes("-")) {
      // Force the format if needed
      if (formattedMachineId.startsWith("MEGG") && formattedMachineId.length >= 14) {
        formattedMachineId = `MEGG-${formattedMachineId.substring(4, 8)}-${formattedMachineId.substring(8, 11)}-${formattedMachineId.substring(11, 14)}`
      }
    }

    // Create a simplified version without hyphens
    const simplifiedId = formattedMachineId.replace(/-/g, "")

    if (!formattedMachineId || !pin) {
      updateState({
        error: "Please enter both Machine ID and PIN",
        showVerifyModal: false,
        showPinErrorModal: true,
      })
      return
    }

    try {
      updateState({
        loading: true,
        error: "",
      })

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machineId: formattedMachineId,
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

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      localStorage.setItem("machineId", formattedMachineId)

      updateState({ success: "Login successful!" })

      setTimeout(() => {
        updateState({ showVerifyModal: false })
        router.push("/home")
      }, 1500)
    } catch (err: unknown) {
      updateState({
        error: err instanceof Error ? err.message : "An error occurred. Please try again.",
        showVerifyModal: false,
        showPinErrorModal: true,
      })
    } finally {
      updateState({ loading: false })
    }
  }

  // ==========================================
  // UI Components
  // ==========================================

  // PIN Error Modal Component
  function PinErrorModal() {
    return (
      <div className="fixed inset-0 z-50">
        {/* Backdrop with blur effect */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
          onClick={() => updateState({ showPinErrorModal: false, error: "" })}
        ></div>

        {/* Modal content - centered with egg design */}
        <div className="flex items-center justify-center h-full p-4">
          <div className="relative bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full p-6 border border-white/50 animate-fade-in-up">
            {/* Top egg shape decoration */}
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
              <div className="relative">
                {/* Animated rings */}
                <div
                  className="absolute inset-[-12px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-[#0e5f97]/20 animate-ping-slow"
                  style={{ animationDuration: "3s" }}
                ></div>
                <div
                  className="absolute inset-[-6px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-[#0e5f97]/30 animate-ping-slow"
                  style={{ animationDuration: "2s" }}
                ></div>

                {/* Egg shape with error fill - NO BUBBLES */}
                <div className="relative w-24 h-28 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] bg-white/90 shadow-lg overflow-hidden">
                  {/* Error fill animation - clean, no bubbles or lines */}
                  <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-red-500 to-red-400 transition-all duration-300 ease-out"></div>

                  {/* Alert icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <AlertCircle className="h-12 w-12 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]" />
                  </div>

                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shine-slow"></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center text-center mt-12">
              <h3 className="text-xl font-bold text-[#0e5f97] mb-2">PIN Error</h3>

              {/* Raw error display without HTML escaping */}
              <pre className="text-red-600 mb-5 text-sm whitespace-pre-wrap break-all max-h-32 overflow-y-auto bg-red-50/50 p-2 rounded-md w-full">
                {error || "An error occurred"}
              </pre>

              <button
                onClick={() => updateState({ showPinErrorModal: false, error: "" })}
                className="px-6 py-2 bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] hover:from-[#0c4d7a] hover:to-[#0a3d62] text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <span>OK</span>
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
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>

        {/* Modal content - centered with egg design */}
        <div className="flex items-center justify-center h-full p-4">
          <div className="relative bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full p-6 border border-white/50 animate-fade-in-up">
            {/* Top egg shape decoration */}
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
              <div className="relative">
                {/* Animated rings */}
                <div
                  className="absolute inset-[-12px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-[#0e5f97]/20 animate-ping-slow"
                  style={{ animationDuration: "3s" }}
                ></div>
                <div
                  className="absolute inset-[-6px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-[#0e5f97]/30 animate-ping-slow"
                  style={{ animationDuration: "2s" }}
                ></div>

                {/* Egg shape with dynamic fill based on state - NO BUBBLES OR LINES */}
                <div className="relative w-24 h-28 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] bg-white/90 shadow-lg overflow-hidden">
                  {success ? (
                    /* Success fill animation - clean, no bubbles */
                    <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-green-500 to-green-400 transition-all duration-300 ease-out"></div>
                  ) : (
                    /* Loading fill animation - clean, no bubbles or lines */
                    <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-[#0e5f97] to-[#0c4d7a] transition-all duration-300 ease-out"></div>
                  )}

                  {/* Icon based on state */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {success ? (
                      <Check className="h-12 w-12 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]" />
                    ) : (
                      <Loader className="h-12 w-12 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.3)] animate-spin" />
                    )}
                  </div>

                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shine-slow"></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center text-center mt-12">
              {success ? (
                <>
                  <h3 className="text-xl font-bold text-green-600 mb-2">Login Successful</h3>
                  <p className="text-green-600 mb-4">Redirecting to home page...</p>
                  <div className="w-full bg-green-100 rounded-lg p-2 mt-2">
                    <div className="h-2 bg-green-500 rounded-full animate-progress"></div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-[#0e5f97] mb-2">Verifying</h3>
                  <p className="text-[#0e5f97]/80 mb-4">Please wait while we verify your credentials...</p>
                  <div className="flex items-center justify-center gap-3 text-[#0e5f97]">
                    <div
                      className="w-3 h-3 rounded-full bg-[#0e5f97] animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-3 h-3 rounded-full bg-[#0e5f97] animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-3 h-3 rounded-full bg-[#0e5f97] animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // SavedMachineModal Component
  function SavedMachineModal() {
    return (
      <div className="fixed inset-0 z-50">
        {/* Backdrop with blur effect */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
          onClick={() => updateState({ showSavedModal: false })}
        ></div>

        {/* Modal content - centered with two-column layout */}
        <div className="flex items-center justify-center h-full p-4">
          <div className="relative bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl max-w-3xl w-full border border-white/50 animate-fade-in-up overflow-hidden">
            {/* Two-column layout */}
            <div className="flex flex-col md:flex-row">
              {/* Left column - Egg shape and decorative elements */}
              <div className="w-full md:w-2/5 bg-gradient-to-br from-[#0e5f97]/10 to-[#0e5f97]/5 p-8 flex flex-col items-center justify-center relative">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-[#0e5f97]/20 to-transparent rounded-full blur-xl"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#0e5f97]/30 to-transparent rounded-full blur-xl"></div>

                {/* Large egg shape container */}
                <div className="relative mb-6">
                  {/* Animated rings */}
                  <div
                    className="absolute inset-[-20px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border-2 border-[#0e5f97]/20 animate-ping-slow"
                    style={{ animationDuration: "3s" }}
                  ></div>
                  <div
                    className="absolute inset-[-12px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border-2 border-[#0e5f97]/30 animate-ping-slow"
                    style={{ animationDuration: "2s" }}
                  ></div>

                  {/* Egg shape with blue fill */}
                  <div className="relative w-40 h-48 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] bg-white/90 shadow-lg overflow-hidden">
                    {/* Blue fill animation */}
                    <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-[#0e5f97] to-[#0c4d7a] transition-all duration-300 ease-out"></div>

                    {/* Shield icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Shield className="h-20 w-20 text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.3)]" />
                    </div>

                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shine-slow"></div>
                  </div>
                </div>

                {/* Title text */}
                <h3 className="text-2xl font-bold text-[#0e5f97] mt-4 text-center">Saved Machine</h3>
                <p className="text-[#0e5f97]/70 text-lg mt-2 text-center">We found a previously used machine</p>
              </div>

              {/* Right column - Machine ID and buttons */}
              <div className="w-full md:w-3/5 p-8 flex flex-col justify-center">
                <div className="space-y-6">
                  {/* Machine ID display - larger for better visibility */}
                  <div>
                    <p className="text-lg font-medium text-[#0e5f97] mb-2">Machine ID</p>
                    <div className="bg-[#0e5f97]/5 border-2 border-[#0e5f97]/10 rounded-lg p-4">
                      <p className="font-mono text-xl text-[#0e5f97] break-all bg-white/80 p-3 rounded shadow-inner">
                        {savedMachineId}
                      </p>
                    </div>
                  </div>

                  {/* Larger buttons with more spacing */}
                  <div className="space-y-4">
                    <button
                      onClick={handleUseSavedMachine}
                      className="w-full h-16 bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] text-white py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg relative overflow-hidden group text-xl font-medium"
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
                      <div className="flex items-center justify-center gap-3 relative z-10">
                        <Check className="h-7 w-7" />
                        <span>Use This Machine</span>
                      </div>
                    </button>

                    <button
                      onClick={handleUseDifferentMachine}
                      className="w-full h-14 bg-white text-[#0e5f97] py-3 px-6 rounded-lg transition-colors border-2 border-[#0e5f97]/20 shadow-md hover:shadow-lg text-lg font-medium hover:bg-[#0e5f97]/5"
                    >
                      Use Different Machine
                    </button>

                    <button
                      onClick={handleClearSavedMachine}
                      className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 py-3 text-base font-medium mx-auto hover:underline"
                    >
                      <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Clear Saved Machine</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Machine ID Input Component
  function MachineIdContent() {
    // Create segments for the machine ID visualization
    const parts = ["MEGG"]
    if (yearInput) parts.push(yearInput)
    if (yearInput && seriesInput) parts.push(seriesInput)
    if (yearInput && seriesInput && unitInput) parts.push(unitInput)

    const handleFocus = () => {
      updateState({
        inputMode: "machineId",
        isMachineIdFocused: true,
      })
    }

    return (
      <div className="h-full flex flex-col">
        <div className="mb-1">
          <h2 className="text-base font-semibold text-[#0e5f97] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Machine ID
          </h2>
        </div>

        {/* Machine ID Display */}
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
                disabled={!isMachineIdComplete(yearInput, seriesInput, unitInput)}
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
                  "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnMzLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iIzBlNWY5NyIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIvPjwvZz48L3N2Zz4=')",
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
    )
  }

  // PIN Entry Component
  function PinEntry() {
    const renderPinDisplay = () => (
      <div className="flex gap-3 justify-center">
        {[...Array(4)].map((_, i) => {
          const isFilled = i < pin.length
          return (
            <div
              key={i}
              className={`relative w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold transition-all duration-300 overflow-hidden
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
              <div className={`relative z-10 w-3 h-3 rounded-full ${isFilled ? "bg-white" : "bg-[#0e5f97]/20"}`}></div>

              {/* Bottom shadow */}
              <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-black/5 rounded-full"></div>
            </div>
          )
        })}
      </div>
    )

    // Render machine ID input display
    const renderMachineIdDisplay = () => {
      let displayValue = ""
      let maxLength = 0

      if (machineIdPart === "year") {
        displayValue = yearInput
        maxLength = 4
      } else if (machineIdPart === "series") {
        displayValue = seriesInput
        maxLength = 3
      } else if (machineIdPart === "unit") {
        displayValue = unitInput
        maxLength = 3
      }

      return (
        <div className="flex gap-3 justify-center">
          {[...Array(maxLength)].map((_, i) => {
            const isFilled = i < displayValue.length
            return (
              <div
                key={i}
                className={`relative w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold transition-all duration-300 overflow-hidden
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

                {/* Digit display */}
                <div className={`relative z-10 ${isFilled ? "text-white text-xl font-bold" : ""}`}>
                  {isFilled ? displayValue[i] : ""}
                </div>

                {/* Bottom shadow */}
                <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-black/5 rounded-full"></div>
              </div>
            )
          })}
        </div>
      )
    }

    // Handle numpad button press based on current mode
    const handleNumpadPress = (digit: string) => {
      if (loading) return

      if (inputMode === "machineId") {
        if (digit === "C") {
          handleMachineIdClear()
        } else if (digit === "⌫") {
          handleMachineIdBackspace()
        } else {
          handleMachineIdInput(digit)
        }
      } else {
        if (digit === "C") {
          handlePinClear()
        } else if (digit === "⌫") {
          handlePinBackspace()
        } else {
          handlePinInput(digit)
        }
      }
    }

    return (
      <div className="flex flex-col h-full">
        <div className="text-center mb-4">
          {/* Display based on current input mode */}
          {inputMode === "machineId" ? (
            <>
              {renderMachineIdDisplay()}
              <p className="text-xs text-gray-500 italic mt-1">
                {machineIdPart === "year" && "Enter Year (4 digits)"}
                {machineIdPart === "series" && "Enter Series (3 digits)"}
                {machineIdPart === "unit" && "Enter Unit (3 digits)"}
              </p>
            </>
          ) : (
            <>
              {renderPinDisplay()}
              <p className="text-xs text-gray-500 italic mt-1">Enter your PIN to access the machine</p>
            </>
          )}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full relative">
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

          {NUMBER_PAD.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {row.map((digit, colIndex) => {
                // Special case: transform the "0" button into a login/next button when input is complete
                const isPinComplete = pin.length === 4
                const isYearComplete = yearInput.length === 4
                const isSeriesComplete = seriesInput.length === 3
                const isUnitComplete = unitInput.length === 3

                const isCurrentInputComplete =
                  (inputMode === "pin" && isPinComplete) ||
                  (inputMode === "machineId" && machineIdPart === "year" && isYearComplete) ||
                  (inputMode === "machineId" && machineIdPart === "series" && isSeriesComplete) ||
                  (inputMode === "machineId" && machineIdPart === "unit" && isUnitComplete)

                const isZeroButton = digit === "0"
                const isActionButton = isCurrentInputComplete && isZeroButton
                const isSpecial = digit === "C" || digit === "⌫" || isActionButton

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => {
                      if (isActionButton) {
                        if (inputMode === "pin") {
                          handleLogin()
                        } else if (inputMode === "machineId") {
                          // If year is complete, move to series
                          if (machineIdPart === "year" && isYearComplete) {
                            updateState({ machineIdPart: "series" })
                          }
                          // If series is complete, move to unit
                          else if (machineIdPart === "series" && isSeriesComplete) {
                            updateState({ machineIdPart: "unit" })
                          }
                          // If unit is complete, switch to PIN mode
                          else if (machineIdPart === "unit" && isUnitComplete) {
                            handleSwitchToPin()
                          }
                        }
                      } else {
                        handleNumpadPress(digit)
                      }
                    }}
                    disabled={loading || (isCurrentInputComplete && !isActionButton && !isSpecial)}
                    className={`
                    h-14 text-2xl font-medium rounded-lg transition-all duration-300 
                    relative group overflow-hidden w-full
                    ${
                      isActionButton
                        ? "bg-gradient-to-br from-[#0e5f97] to-[#0c4d7a] text-white border border-[#0e5f97]/50"
                        : isSpecial
                          ? "bg-gradient-to-br from-white to-gray-50 text-[#0e5f97] border border-[#0e5f97]/20"
                          : "bg-gradient-to-br from-white to-gray-50 text-gray-700 border border-white/50"
                    }
                    shadow-md hover:shadow-lg
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
                      {isActionButton ? (
                        <div className="flex items-center justify-center gap-1">
                          {loading ? (
                            <>
                              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span className="text-base">Verifying...</span>
                            </>
                          ) : (
                            <>
                              {inputMode === "pin" ? (
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
                              ) : (
                                <>
                                  <ChevronRight className="h-5 w-5 mr-1" />
                                  <span className="text-base font-medium">
                                    {machineIdPart === "unit" ? "Enter PIN" : "Next"}
                                  </span>
                                </>
                              )}
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
                              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
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

                    {/* Animated highlight for action button */}
                    {isActionButton && (
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
    )
  }

  return (
    <div className="min-h-screen bg-[#0e5f97] pt-6 px-4 pb-4 flex flex-col items-center relative overflow-hidden">
      {/* Dynamic background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0wIDMwaDMwdjMwSDB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwSDB2MzBoMzB6IiBzdHJva2U9InRnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwaDMwdjMwSDMweiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvP2c+PC9zdmc+')] opacity-70"></div>

      {/* Modals */}
      {showSavedModal && <SavedMachineModal />}
      {showPinErrorModal && <PinErrorModal />}
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
        <div className="relative backdrop-blur-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/50 h-[440px]">
          {/* Holographic overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

          {/* Animated edge glow */}
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl animate-border-glow"></div>
          </div>

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

          {/* Main content grid - following setup/page.tsx layout */}
          <div className="h-[440px] max-h-[440px] flex flex-col justify-between relative ">
            {/* Two-column layout - similar to setup/page.tsx PIN step */}
            <div className="grid grid-cols-12 gap-4">
              {/* Left column - Machine ID */}
              <div className="col-span-5 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 pt-4 pb-4 ps-4 pe-0 flex flex-col">
                {/* Header with Title and Back Button - matching setup page style */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-[#0e5f97] to-[#0c4d7a] rounded-full mr-2"></div>
                    <h1 className="text-xl font-bold text-[#0e5f97]">Machine Login</h1>
                  </div>
                  <Link
                    href="/"
                    className="px-4 py-2 text-[#0e5f97] text-md font-semibold bg-white/70 backdrop-blur-sm rounded-xl border border-[#0e5f97]/10 shadow hover:bg-white/90 transition-all hover:shadow-md group"
                  >
                    <span className="flex items-center">
                      <ArrowLeft className="h-4 w-4 transform transition-transform group-hover:-translate-x-1" />
                      <span className="ml-1">Back</span>
                    </span>
                  </Link>
                </div>
                {/* Machine ID Content */}
                <MachineIdContent />
              </div>

              {/* Right column - PIN Entry */}
              <div className="col-span-7 bg-white/40 backdrop-blur-sm rounded-xl border border-white/50 p-4 flex flex-col">
                <h3 className="text-base font-semibold text-[#0e5f97] flex items-center gap-2 mb-3">
                  <Key className="w-4 h-4" />
                  {inputMode === "pin" ? "Enter PIN" : "Enter Machine ID"}
                </h3>

                <div className="flex-1 flex flex-col">
                  <PinEntry />
                </div>
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
        
        @keyframes shine-slow {
          0% { transform: translateX(-100%); }
          20%, 100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
