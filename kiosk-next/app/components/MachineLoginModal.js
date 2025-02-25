"use client"

import { useState } from "react"
import { AlertCircle, X } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebaseConfig"
import { PinAuthModal } from "../account/components/PinAuthModal"
import { addAccessLog } from "../utils/logging"

export function MachineLoginModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState("id")
  const [machineId, setMachineId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleVerifyMachine = async () => {
    try {
      setLoading(true)
      setError("")

      if (!machineId) {
        setError("Please enter a machine ID")
        return
      }

      const machineRef = doc(db, "machines", machineId)
      const machineDoc = await getDoc(machineRef)

      if (!machineDoc.exists()) {
        setError("Machine not found")
        return
      }

      await addAccessLog({
        action: "machine_login",
        status: "verify",
        details: `Machine ID verified: ${machineId}`,
      })

      setStep("pin")
    } catch (err) {
      console.error("Error verifying machine:", err)
      setError("Failed to verify machine ID. Please try again.")

      await addAccessLog({
        action: "machine_login",
        status: "error",
        details: "Failed to verify machine ID",
        error: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePinSuccess = async () => {
    try {
      localStorage.setItem("machineId", machineId)

      await addAccessLog({
        action: "machine_login",
        status: "success",
        details: "Machine login successful",
      })

      onSuccess()
    } catch (err) {
      console.error("Error completing login:", err)
      setError("Failed to complete login. Please try again.")

      await addAccessLog({
        action: "machine_login",
        status: "error",
        details: "Failed to complete login",
        error: err.message,
      })
    }
  }

  const handleClose = () => {
    setStep("id")
    setMachineId("")
    setError("")
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Login to Machine</h2>
            <p className="text-sm text-gray-500">Enter your machine ID and security PIN to continue</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {step === "id" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="machine-id" className="block text-sm font-medium text-gray-700">
                Machine ID
              </label>
              <input
                id="machine-id"
                type="text"
                placeholder="Enter your machine ID"
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e5f97] focus:border-[#0e5f97]"
              />
            </div>

            <button
              onClick={handleVerifyMachine}
              disabled={loading}
              className="w-full py-2 bg-[#0e5f97] hover:bg-[#0e4772] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : (
                "Continue"
              )}
            </button>
          </div>
        ) : (
          <PinAuthModal mode="verify" onSuccess={handlePinSuccess} canClose={false} isOpen={true} />
        )}
      </div>
    </div>
  )
}

