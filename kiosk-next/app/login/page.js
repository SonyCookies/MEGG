"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
// import { updateDoc } from "firebase/firestore"
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
    // Check for saved machine ID on component mount
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
        machineId,
        status: "error",
        details: "Error during login",
        error: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function for successful login
  // const handleSuccessfulLogin = async (machineRef) => {
  //   await addAccessLog({
  //     action: "login",
  //     machineId,
  //     status: "success",
  //     details: "Login successful",
  //   })

  //   await updateDoc(machineRef, {
  //     lastLoginAt: new Date().toISOString(),
  //     failedAttempts: 0,
  //     lockedUntil: null,
  //   })

  //   localStorage.setItem("machineId", machineId)
  //   setSuccess("Login successful!")
  //   setTimeout(() => router.push("/"), 1500)
  // }

  // Helper function for failed login
  // const handleFailedLogin = async (newAttempts, machineRef) => {
  //   if (newAttempts >= MAX_ATTEMPTS) {
  //     const lockoutTime = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  //     await updateDoc(machineRef, {
  //       failedAttempts: newAttempts,
  //       lockedUntil: lockoutTime.toISOString(),
  //       lastFailedAttempt: new Date().toISOString(),
  //     })

  //     await addAccessLog({
  //       action: "login",
  //       machineId,
  //       status: "locked",
  //       details: "Account locked due to too many failed attempts",
  //     })

  //     setError("Too many failed attempts. Account locked for 15 minutes.")
  //   } else {
  //     await updateDoc(machineRef, {
  //       failedAttempts: newAttempts,
  //       lastFailedAttempt: new Date().toISOString(),
  //     })

  //     await addAccessLog({
  //       action: "login",
  //       machineId,
  //       status: "failed",
  //       details: `Failed login attempt (${newAttempts}/${MAX_ATTEMPTS})`,
  //     })

  //     setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`)
  //   }

  //   setAttempts(newAttempts)
  //   setPin("")
  // }

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
          <MachineIdInput machineId={machineId} onMachineIdChange={setMachineId}/>

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

