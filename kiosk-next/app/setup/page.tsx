"use client"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Settings, ArrowLeft, AlertCircle, Key, Check, Copy, CheckCheck, Lock, Shield, Cpu, QrCode } from "lucide-react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../firebaseConfig"
import { generateMachineQR } from "../utils/machine-utils"

const isPinValid = (pin) => {
  if (!/^\d+$/.test(pin)) return false

  return !(
    /^(.)\1{3}$/.test(pin) ||
    /^0123|1234|2345|3456|4567|5678|6789$/.test(pin) ||
    /^9876|8765|7654|6543|5432|4321|3210$/.test(pin)
  )
}

const numberPad = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["C", "0", "⌫"],
]

const setupSteps = [
  { icon: Cpu, label: "Registration" },
  { icon: QrCode, label: "Generation" },
  { icon: Shield, label: "Security" },
  { icon: Key, label: "PIN Setup" },
]

export default function SetupPage() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [state, setState] = useState({
    loading: false,
    error: "",
    success: "",
    machineId: "",
    step: "generate",
    pin: "",
    confirmPin: "",
    pinError: "",
    pinStep: "create",
    setupComplete: false,
    copied: false,
  })
  const setupSuccessfulRef = useRef(false)

  const updateState = (updates) => {
    setState((prev) => ({ ...prev, ...updates }))
  }

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100)

    // Handle beforeunload event
    const handleBeforeUnload = (e) => {
      if (state.step === "pin" && !state.success) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      clearTimeout(timer)
    }
  }, [state.step, state.success])

  const handleGenerateMachine = async () => {
    try {
      updateState({ loading: true, error: "" })
      const { machineId: newMachineId } = await generateMachineQR()

      await updateDoc(doc(db, "machines", newMachineId), {
        createdAt: new Date().toISOString(),
        pin: null,
      })

      updateState({
        machineId: newMachineId,
        step: "pin",
      })
    } catch (err) {
      console.error("Error generating machine:", err)
      updateState({
        error: "Failed to generate machine ID. Please try again.",
      })
    } finally {
      updateState({ loading: false })
    }
  }

  const handleSetupComplete = async () => {
    const { pin, confirmPin } = state

    if (pin.length !== 4) {
      updateState({ pinError: "Initial PIN must be exactly 4 digits" })
      return
    }

    if (pin !== confirmPin) {
      updateState({ pinError: "PINs do not match", confirmPin: "" })
      return
    }

    if (!isPinValid(pin)) {
      updateState({ pinError: "Please choose a less predictable PIN" })
      return
    }

    try {
      updateState({ loading: true, pinError: "" })

      const encoder = new TextEncoder()
      const pinData = encoder.encode(pin)
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const combinedData = new Uint8Array([...pinData, ...salt])
      const hashBuffer = await crypto.subtle.digest("SHA-256", combinedData)

      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashBase64 = btoa(String.fromCharCode(...hashArray))

      const saltBase64 = btoa(String.fromCharCode(...salt))

      await updateDoc(doc(db, "machines", state.machineId), {
        pin: hashBase64,
        salt: saltBase64,
        pinSetupAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        setupComplete: true,
      })

      setupSuccessfulRef.current = true
      localStorage.setItem("machineId", state.machineId)

      updateState({
        setupComplete: true,
        success: "Setup completed successfully!",
      })

      setTimeout(() => router.push("/"), 1500)
    } catch (err) {
      console.error("Error completing setup:", err)
      updateState({
        pinError: "Failed to complete setup. Please try again.",
        setupComplete: false,
      })
      setupSuccessfulRef.current = false
    } finally {
      updateState({ loading: false })
    }
  }

  const handlePinInput = (digit) => {
    const currentPin = state.pinStep === "create" ? state.pin : state.confirmPin
    const setPin =
      state.pinStep === "create" ? (pin) => updateState({ pin }) : (confirmPin) => updateState({ confirmPin })

    if (digit === "C") {
      setPin("")
    } else if (digit === "⌫") {
      setPin(currentPin.slice(0, -1))
    } else if (currentPin.length < 4) {
      setPin(currentPin + digit)
    }
  }

  const handleCopy = async (machineId) => {
    try {
      await navigator.clipboard.writeText(machineId)
      updateState({ copied: true })

      setTimeout(() => updateState({ copied: false }), 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  const renderPinDisplay = () => (
    <div className="flex gap-2 justify-center">
      {[...Array(4)].map((_, i) => {
        const isFilled = i < (state.pinStep === "confirm" ? state.confirmPin.length : state.pin.length)
        return (
          <div
            key={i}
            className={`relative w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold transition-all duration-300 overflow-hidden
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
            <div className={`relative z-10 w-2 h-2 rounded-full ${isFilled ? "bg-white" : "bg-[#0e5f97]/20"}`}></div>

            {/* Bottom shadow */}
            <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-black/5 rounded-full"></div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0e5f97] pt-12 px-4 pb-4 flex flex-col items-center relative overflow-hidden">
      {/* Dynamic background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0wIDMwaDMwdjMwSDB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwSDB2MzBoMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwaDMwdjMwSDMweiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iLjUiLz48L2c+PC9zdmc+')] opacity-70"></div>

      {/* Main content */}
      <div
        className={`${state.step === "generate" ? "max-w-md" : "max-w-3xl"} w-full transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        {/* Card with glass morphism effect */}
        <div className="relative backdrop-blur-sm bg-white/90 rounded-2xl shadow-2xl overflow-hidden border border-white/50">
          {/* Holographic overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

          {/* Animated edge glow */}
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl animate-border-glow"></div>
          </div>

          {state.step === "generate" ? (
            <div className="p-6 relative z-10">
              {/* Header with logo, title and back button */}
              <div className="flex items-center justify-between mb-5">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center text-[#0e5f97] hover:text-[#0e5f97]/80 transition-colors bg-white/50 backdrop-blur-sm p-2 rounded-full shadow-sm hover:shadow-md border border-[#0e5f97]/10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>

                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full border-2 border-[#0e5f97]/20 animate-ping-slow opacity-70"></div>
                    <div className="relative bg-gradient-to-br from-white to-[#f0f7ff] p-3 rounded-full shadow-lg border border-white/50 group">
                      <div className="relative w-10 h-10 overflow-hidden">
                        <Image
                          src="/Logos/logoblue.png"
                          alt="MEGG Logo"
                          width={40}
                          height={40}
                          className="object-contain transform group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shine"></div>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl font-bold text-[#0e5f97]">Machine Setup</h1>
                </div>

                {/* Empty div for flex spacing */}
                <div className="w-8"></div>
              </div>

              {/* Enhanced Setup steps */}
              <div className="flex justify-between mb-5 relative">
                {/* Progress line connecting all steps */}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200"></div>

                {setupSteps.map((step, index) => (
                  <div key={index} className="flex flex-col items-center relative z-10">
                    <div
                      className={`relative w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                        ${
                          index === 0
                            ? "bg-gradient-to-br from-[#0e5f97] to-[#0c4d7a] text-white shadow-md"
                            : "bg-white text-[#0e5f97]/60 border border-[#0e5f97]/20"
                        }`}
                    >
                      {/* Pulse effect for current step */}
                      {index === 0 && (
                        <div className="absolute inset-0 rounded-full border-2 border-[#0e5f97]/30 animate-ping-slow opacity-70"></div>
                      )}

                      {/* Inner highlight */}
                      <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-full"></div>

                      <step.icon className="h-5 w-5 relative z-10" />
                    </div>
                    <span className={`text-xs ${index === 0 ? "text-[#0e5f97] font-medium" : "text-gray-400"}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-5">
                {state.error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">{state.error}</p>
                  </div>
                )}

                <div className="bg-gradient-to-r from-[#0e5f97]/5 to-[#0c4d7a]/5 border border-[#0e5f97]/10 rounded-xl p-5">
                  <div className="flex items-center justify-center gap-3 text-[#0e5f97] mb-4">
                    <Settings className="h-6 w-6" />
                    <span className="text-lg font-medium">Ready to Begin Setup</span>
                  </div>

                  <button
                    onClick={handleGenerateMachine}
                    disabled={state.loading}
                    className="w-full h-12 bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] hover:from-[#0c4d7a] hover:to-[#0a3d62] text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                  >
                    {/* Button shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>

                    {state.loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating...</span>
                      </div>
                    ) : (
                      <span>Generate Machine ID</span>
                    )}
                  </button>
                </div>

                <div className="text-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <p>
                    This process will create a unique machine identifier and set up security credentials for your MEGG
                    device.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-10">
              {/* Header with logo, title, back button and progress indicator */}
              <div className="flex items-center justify-between px-8 py-3 border-b border-gray-100">
                {/* Back button and logo/title */}
                <div className="flex items-center gap-4">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center text-[#0e5f97] hover:text-[#0e5f97]/80 transition-colors bg-white/50 backdrop-blur-sm p-2 rounded-full shadow-sm hover:shadow-md border border-[#0e5f97]/10"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Link>

                  <div className="flex items-center gap-3">
                    <div className="relative bg-gradient-to-br from-white to-[#f0f7ff] p-2 rounded-full shadow-sm border border-white/50 group">
                      <div className="relative w-8 h-8 overflow-hidden">
                        <Image
                          src="/Logos/logoblue.png"
                          alt="MEGG Logo"
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      </div>
                    </div>
                    <h1 className="text-xl font-bold text-[#0e5f97]">Machine Setup</h1>
                  </div>
                </div>

                {/* Progress steps */}
                <div className="flex items-center">
                  {setupSteps.map((step, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
          ${
            index <= 2
              ? "bg-gradient-to-br from-[#0e5f97] to-[#0c4d7a] text-white shadow-md"
              : "bg-white text-[#0e5f97]/60 border border-[#0e5f97]/20"
          }`}
                      >
                        {/* Pulse effect for current step */}
                        {index === 3 && (
                          <div className="absolute inset-0 rounded-full border-2 border-[#0e5f97]/30 animate-ping-slow opacity-70"></div>
                        )}

                        {/* Inner highlight */}
                        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-full"></div>

                        <step.icon className="h-4 w-4 relative z-10" />
                      </div>

                      {index < setupSteps.length - 1 && (
                        <div className="relative w-8 h-1">
                          <div
                            className={`absolute inset-0 ${index < 2 ? "bg-[#0e5f97]" : "bg-gray-200"} rounded-full`}
                          ></div>

                          {/* Animated progress for current connection */}
                          {index === 2 && (
                            <div className="absolute inset-0 bg-[#0e5f97] rounded-full transform origin-left scale-x-0 animate-grow"></div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main content with creative layout - more compact */}
              <div className="px-8 py-3 grid grid-cols-12 gap-6">
                {/* Left column - Machine ID */}
                <div className="col-span-7 space-y-4">
                  <div className="relative">
                    <div className="absolute -top-12 -left-6 w-24 h-24 bg-[#0e5f97]/10 rounded-full blur-xl"></div>
                    <div className="relative">
                      <h3 className="text-lg font-semibold text-[#0e5f97] flex items-center gap-2 mb-3">
                        <Settings className="w-5 h-5" />
                        Machine Details
                      </h3>

                      {/* Enhanced Machine ID display */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100 shadow-md group">
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-5">
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
                              backgroundSize: "15px 15px",
                            }}
                          ></div>
                        </div>

                        {/* Header */}
                        <div className="px-3 py-2 bg-[#0e5f97]/10 border-b border-gray-200 flex items-center justify-between">
                          <span className="text-xs font-medium text-[#0e5f97]">MACHINE ID</span>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs text-green-600">Active</span>
                          </div>
                        </div>

                        {/* ID Display */}
                        <div className="p-3 relative">
                          {/* Animated highlight on hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full"></div>

                          {/* ID with monospace font */}
                          <div className="font-mono text-sm tracking-wide bg-white/80 p-2 rounded border border-gray-100 break-all">
                            {state.machineId}
                          </div>

                          {/* Copy button */}
                          <button
                            onClick={() => handleCopy(state.machineId)}
                            className="absolute right-3 bottom-3 flex items-center gap-1.5 px-2 py-1 bg-white rounded-md shadow-sm border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors group"
                          >
                            {state.copied ? (
                              <>
                                <CheckCheck className="h-3.5 w-3.5 text-green-500" />
                                <span className="text-green-600">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy ID</span>
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                                  Copy to clipboard
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security note - more compact */}
                  <div className="bg-gradient-to-br from-[#0e5f97]/5 to-[#0e5f97]/10 rounded-xl p-3 border border-[#0e5f97]/10 relative overflow-hidden">
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

                    <div className="flex items-start gap-2 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-[#0e5f97]/20 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-4 h-4 text-[#0e5f97]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#0e5f97] text-sm mb-0.5">Security Information</p>
                        <p className="text-xs text-gray-600">
                          PIN provides secure access to machine settings. Choose a unique 4-digit code that you haven't
                          used before.
                        </p>
                        <div className="mt-1 flex items-center text-xs text-[#0e5f97]/70">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>Avoid sequential numbers (1234) and repeated digits (1111)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* What's Next Section - New */}
                  <div className="bg-gradient-to-r from-[#0e5f97]/5 to-white rounded-xl border border-[#0e5f97]/10 p-3">
                    <h4 className="text-sm font-semibold text-[#0e5f97] mb-2 flex items-center gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14"></path>
                        <path d="m19 12-7 7-7-7"></path>
                      </svg>
                      What's Next
                    </h4>

                    <ul className="space-y-1.5 text-xs text-gray-600 pl-5 list-disc">
                      <li>After PIN setup, your machine will be ready for immediate use</li>
                      <li>You'll be redirected to the login screen automatically</li>
                      <li>Use your new PIN to access machine settings and controls</li>
                    </ul>
                  </div>

                  {state.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                      <p className="font-medium">{state.success}</p>
                      <p className="text-sm mt-1">Redirecting to home page...</p>
                    </div>
                  )}
                </div>

                {/* Right column - PIN Setup - reduced to 4 columns */}
                <div className="col-span-5 relative">
                  <div className="absolute -top-10 -right-6 w-32 h-32 bg-[#0e5f97]/10 rounded-full blur-xl"></div>
                  <div className="absolute bottom-0 right-10 w-20 h-20 bg-[#0e5f97]/10 rounded-full blur-xl"></div>

                  <div className="relative bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-md rounded-xl border border-white/50 shadow-lg p-4">
                    <h3 className="text-lg font-semibold text-[#0e5f97] flex items-center gap-2 mb-3">
                      <Key className="w-5 h-5" />
                      Set Up PIN
                    </h3>

                    {state.pinError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 mb-3 text-xs">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <p>{state.pinError}</p>
                      </div>
                    )}

                    <div className="text-center space-y-2 mb-4">
                      <div className="inline-flex items-center px-3 py-1 bg-[#0e5f97]/10 rounded-full mb-1">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${state.pinStep === "create" ? "bg-[#0e5f97]" : "bg-gray-300"} mr-1.5`}
                        ></div>
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${state.pinStep === "confirm" ? "bg-[#0e5f97]" : "bg-gray-300"}`}
                        ></div>
                      </div>
                      <p className="text-xs font-medium text-[#0e5f97]">
                        {state.pinStep === "confirm" ? "Confirm your PIN" : "Create a 4-digit PIN"}
                      </p>
                      {renderPinDisplay()}
                      <p className="text-xs text-gray-500 italic">
                        {state.pinStep === "create"
                          ? "Choose a secure PIN you'll remember"
                          : "Enter the same PIN again to confirm"}
                      </p>
                    </div>

                    {/* Enhanced Number Pad with 3D effects - more compact */}
                    <div className="grid grid-cols-3 gap-1.5 mb-4 max-w-[220px] mx-auto relative">
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

                      {numberPad.flat().map((digit, index) => {
                        const isSpecial = digit === "C" || digit === "⌫"
                        return (
                          <button
                            key={index}
                            onClick={() => handlePinInput(digit)}
                            disabled={state.loading}
                            className={`
                              h-10 text-sm font-medium rounded-lg transition-all duration-200 
                              relative group overflow-hidden
                              ${
                                isSpecial
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
                              {isSpecial && digit === "C" && <span className="text-xs font-semibold">CLEAR</span>}
                              {isSpecial && digit === "⌫" && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
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
                            </span>

                            {/* Bottom shadow */}
                            <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-black/5 rounded-full"></span>
                          </button>
                        )
                      })}
                    </div>

                    <div className="flex justify-center gap-3">
                      {state.pinStep === "create" && state.pin.length === 4 ? (
                        <button
                          onClick={() => updateState({ pinStep: "confirm", pinError: "", confirmPin: "" })}
                          className="bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] hover:from-[#0c4d7a] hover:to-[#0a3d62] text-white py-2 px-5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-active:opacity-100 transition-opacity"></div>
                          <div className="flex items-center gap-2 relative z-10">
                            <span className="font-medium text-sm">Confirm PIN</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      ) : (
                        state.pinStep === "confirm" && (
                          <>
                            <button
                              onClick={() => updateState({ pinStep: "create", pinError: "", confirmPin: "" })}
                              className="bg-white hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md border border-gray-200 group"
                            >
                              <div className="flex items-center gap-1.5 text-sm">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3.5 w-3.5 transform group-hover:-translate-x-1 transition-transform"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                  />
                                </svg>
                                <span>Back</span>
                              </div>
                            </button>
                            {state.confirmPin.length === 4 && (
                              <button
                                onClick={handleSetupComplete}
                                disabled={state.loading}
                                className="bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] hover:from-[#0c4d7a] hover:to-[#0a3d62] text-white py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                              >
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-active:opacity-100 transition-opacity"></div>

                                {state.loading ? (
                                  <div className="flex items-center justify-center gap-2 relative z-10 text-sm">
                                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span className="font-medium">Setting up...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 relative z-10 text-sm">
                                    <span className="font-medium">Complete Setup</span>
                                    <Check className="h-3.5 w-3.5" />
                                  </div>
                                )}
                              </button>
                            )}
                          </>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#0e5f97]/30 rounded-tl-2xl"></div>
          <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-[#0e5f97]/30 rounded-tr-2xl"></div>
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-[#0e5f97]/30 rounded-bl-2xl"></div>
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#0e5f97]/30 rounded-br-2xl"></div>
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

        @keyframes grow {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }

        .animate-grow {
          animation: grow 1.5s ease-in-out infinite alternate;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
