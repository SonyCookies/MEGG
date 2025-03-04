// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\login\page.js

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { addAccessLog } from "../utils/logging"
import { MachineIdInput } from "./components/machineIdInput"
import { PinEntry } from "./components/pinEntry"
import { SavedMachineModal } from "./components/savedMachineModal"

export default function LoginPage() {
  const router = useRouter()
  const [machineId, setMachineId] = useState("")
  const [savedMachineId, setSavedMachineId] = useState("")
  const [showSavedModal, setShowSavedModal] = useState(false)
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("machineId")
    if (saved) {
      setSavedMachineId(saved)
      setShowSavedModal(true)
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

      await addAccessLog({
        action: "login",
        status: "error",
        details: "Error during login",
        error: err.message,
      }, machineId)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      {showSavedModal && (
        <SavedMachineModal
          savedMachineId={savedMachineId}
          onUseSaved={handleUseSavedMachine}
          onUseDifferent={handleUseDifferentMachine}
          onClearSaved={handleClearSavedMachine}
        />
      )}

      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-[#0e5f97] hover:text-[#0e4772]">
            <ArrowLeft className="h-5 w-5 mr-2" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MachineIdInput machineId={machineId} onMachineIdChange={setMachineId} />

          <PinEntry
            pin={pin}
            loading={loading}
            error={error}
            success={success}
            onPinInput={handlePinInput}
            onClear={handleClear}
            onBackspace={handleBackspace}
            onSubmit={handleLogin}
            disabled={!machineId}
          />
        </div>
      </div>
    </div>
  )
}

