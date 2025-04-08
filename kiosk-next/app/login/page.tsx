"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Shield, Info, Lock, Key, AlertCircle, Check, XCircle } from "lucide-react"
import { addAccessLog } from "../utils/logging"

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

  const handleUseSavedMachine = () => {
    setMachineId(savedMachineId)
    setShowSavedModal(false)
  }

  const handleUseDifferentMachine = () => {
    setShowSavedModal(false)
  }

  const handleClearSavedMachine = () => {
    localStorage.removeItem("machineId")
    setSavedMachineId("")
    setShowSavedModal(false)
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

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ machineId, pin }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      localStorage.setItem("machineId", machineId)

      setSuccess("Login successful!")
      setTimeout(() => router.push("/home"), 1500)
    } catch (err) {
      console.error("Error during login:", err)
      setError(err.message || "An error occurred. Please try again.")

      await addAccessLog(
        {
          action: "login",
          status: "error",
          details: "Error during login",
          error: err.message,
        },
        machineId,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0e5f97] pt-12 px-4 pb-4 flex flex-col items-center relative overflow-hidden">
      {/* Dynamic background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0wIDMwaDMwdjMwSDB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwSDB2MzBoMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwaDMwdjMwSDMweiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iLjUiLz48L2c+PC9zdmc+')] opacity-70"></div>

      {showSavedModal && <SavedMachineModal />}

      {/* Main content */}
      <div
        className={`max-w-3xl w-full transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        {/* Card with glass morphism effect */}
        <div className="relative backdrop-blur-sm bg-white/90 rounded-2xl shadow-2xl overflow-hidden border border-white/50">
          {/* Holographic overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

          {/* Animated edge glow */}
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl animate-border-glow"></div>
          </div>

          <div className="relative z-10 p-6">
            {/* Header with logo, title and back button */}
            <div className="flex items-center justify-between mb-6">
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
                <h1 className="text-2xl font-bold text-[#0e5f97]">Machine Login</h1>
              </div>

              {/* Empty div for flex spacing */}
              <div className="w-8"></div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MachineIdInput />
              <PinEntry />
            </div>
          </div>

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
      `}</style>
    </div>
  )

  // MachineIdInput Component
  function MachineIdInput() {
    const maxAttempts = 5

    const formatMachineId = (value) => {
      const cleaned = value.replace(/[^A-Z0-9]/gi, "").toUpperCase()

      let formatted = ""

      formatted += cleaned.slice(0, 4)
      if (cleaned.length > 4) {
        formatted += "-"
        formatted += cleaned.slice(4, 8)
        if (cleaned.length > 8) {
          formatted += "-"
          formatted += cleaned.slice(8, 11)
          if (cleaned.length > 11) {
            formatted += "-"
            formatted += cleaned.slice(11, 14)
          }
        }
      }

      return formatted
    }

    const handleChange = (e) => {
      const formatted = formatMachineId(e.target.value)
      setMachineId(formatted)
    }

    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-md rounded-xl border border-white/50 shadow-lg p-5 relative overflow-hidden">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
              backgroundSize: "15px 15px",
            }}
          ></div>

          <div className="relative z-10">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-[#0e5f97] flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Machine ID
              </h2>
              <p className="text-gray-500 text-sm">Enter your unique machine identifier</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <input
                    id="machine-id"
                    type="text"
                    placeholder="MEGG-2025-94M-019"
                    value={machineId}
                    onChange={handleChange}
                    maxLength={17}
                    className="w-full px-3 py-2.5 border border-[#0e5f97]/20 bg-white/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e5f97] focus:border-[#0e5f97] font-mono shadow-sm transition-all duration-200"
                    style={{ letterSpacing: "0.5px" }}
                  />
                  <div className="absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full"></div>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  Format: XXXX-XXXX-XXX-XXX
                </p>
              </div>

              <div className="bg-gradient-to-r from-[#0e5f97]/5 to-[#0e5f97]/10 rounded-lg p-4 border border-[#0e5f97]/10 relative overflow-hidden">
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
                  <h3 className="font-medium text-[#0e5f97] flex items-center gap-2 mb-3 text-sm">
                    <Info className="w-4 h-4" />
                    Security Notice
                  </h3>
                  <div className="flex items-start gap-3 text-xs text-gray-600">
                    <Lock className="w-4 h-4 text-[#0e5f97] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">Account Protection</p>
                      <p>Your account will be temporarily locked after {maxAttempts} failed attempts.</p>
                    </div>
                  </div>
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

    return (
      <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-md rounded-xl border border-white/50 shadow-lg p-5 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
            backgroundSize: "15px 15px",
          }}
        ></div>

        <div className="relative z-10">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-[#0e5f97] flex items-center gap-2">
              <Key className="w-5 h-5" />
              Enter PIN
            </h2>
            <p className="text-gray-500 text-sm">Enter your 4-digit security PIN</p>
          </div>

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            {/* PIN Display */}
            <div className="text-center space-y-3">
              {renderPinDisplay()}
              <p className="text-xs text-gray-500 italic">Enter your secure PIN</p>
            </div>

            {/* Enhanced Number Pad with 3D effects - more compact */}
            <div className="grid grid-cols-3 gap-1.5 max-w-[220px] mx-auto relative">
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
                <div key={rowIndex} className="contents">
                  {row.map((digit, colIndex) => {
                    const isSpecial = digit === "C" || digit === "⌫"
                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => {
                          if (digit === "C") handleClear()
                          else if (digit === "⌫") handleBackspace()
                          else handlePinInput(digit)
                        }}
                        disabled={loading || !machineId}
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
              ))}
            </div>

            {/* Login Button */}
            {pin.length === 4 && (
              <button
                onClick={handleLogin}
                disabled={loading || !machineId}
                className="w-full h-11 bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] hover:from-[#0c4d7a] hover:to-[#0a3d62] text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>

                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <span>Login</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // SavedMachineModal Component
  function SavedMachineModal() {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="relative backdrop-blur-sm bg-white/90 rounded-2xl shadow-2xl overflow-hidden border border-white/50 max-w-md w-full">
          {/* Holographic overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

          {/* Animated edge glow */}
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl animate-border-glow"></div>
          </div>

          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#0e5f97]/30 rounded-tl-2xl"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#0e5f97]/30 rounded-tr-2xl"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#0e5f97]/30 rounded-bl-2xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#0e5f97]/30 rounded-br-2xl"></div>

          <div className="relative z-10 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-[#0e5f97]">
                <Shield className="w-6 h-6" />
                <h2 className="text-xl font-semibold">Saved Machine</h2>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">You have a saved machine ID. Would you like to use it to log in?</p>

              <div className="bg-gradient-to-r from-[#0e5f97]/5 to-[#0e5f97]/10 rounded-lg p-4 border border-[#0e5f97]/10 relative overflow-hidden">
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
                  <p className="text-sm text-gray-500 mb-2">Saved Machine ID:</p>
                  <div className="font-mono text-[#0e5f97] bg-white/80 p-2 rounded border border-gray-100 break-all">
                    {savedMachineId}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleUseSavedMachine}
                className="w-full h-11 bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] hover:from-[#0c4d7a] hover:to-[#0a3d62] text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg relative overflow-hidden group"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>

                <div className="flex items-center justify-center gap-2 relative z-10">
                  <Check className="h-4 w-4" />
                  <span>Use This Machine ID</span>
                </div>
              </button>

              <button
                onClick={handleUseDifferentMachine}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 py-2.5 px-4 rounded-lg transition-colors border border-gray-200 shadow-sm"
              >
                Use Different Machine ID
              </button>

              <button
                onClick={handleClearSavedMachine}
                className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 py-2 group"
              >
                <XCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Clear Saved Machine ID</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
