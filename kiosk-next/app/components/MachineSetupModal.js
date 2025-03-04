"use client"

import { useState } from "react"
import { AlertCircle, Check, Copy, Settings, X } from "lucide-react"
import { generateMachineQR } from "../utils/machine-utils"
import { PinAuthModal } from "../account/components/PinAuthModal"
import { addAccessLog } from "../utils/logging"

export function MachineSetupModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState("generate")
  const [machineId, setMachineId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGenerateMachine = async () => {
    try {
      setLoading(true)
      setError("")

      const { machineId: newMachineId } = await generateMachineQR()
      setMachineId(newMachineId)

      await addAccessLog({
        action: "machine_setup",
        status: "success",
        details: `Machine ID generated: ${newMachineId}`,
      })

      setStep("pin")
    } catch (err) {
      console.error("Error generating machine:", err)
      setError("Failed to generate machine ID. Please try again.")

      await addAccessLog({
        action: "machine_setup",
        status: "error",
        details: "Failed to generate machine ID",
        error: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyMachineId = () => {
    navigator.clipboard.writeText(machineId)
  }

  const handlePinSuccess = async () => {
    try {
      localStorage.setItem("machineId", machineId)

      await addAccessLog({
        action: "machine_setup",
        status: "complete",
        details: "Machine setup completed successfully",
      })

      onSuccess()
    } catch (err) {
      console.error("Error completing setup:", err)
      setError("Failed to complete setup. Please try again.")

      await addAccessLog({
        action: "machine_setup",
        status: "error",
        details: "Failed to complete setup",
        error: err.message,
      })
    }
  }

  const handleClose = () => {
    setStep("generate")
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
            <h2 className="text-xl font-semibold">Setup New Machine</h2>
            <p className="text-sm text-gray-500">Generate a new machine ID and set up security PIN</p>
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

        {step === "generate" ? (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-center gap-3 text-[#0e5f97]">
                <Settings className="h-8 w-8" />
                <span className="text-lg font-medium">New Machine Setup</span>
              </div>
            </div>

            <button
              onClick={handleGenerateMachine}
              disabled={loading}
              className="w-full h-12 text-lg bg-[#0e5f97] hover:bg-[#0e4772] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </div>
              ) : (
                "Generate Machine ID"
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Machine ID</span>
                  <button onClick={handleCopyMachineId} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="font-mono text-lg">{machineId}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#ecb662]/10 border border-[#ecb662] text-[#ecb662] px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">Important</p>
              </div>
              <p className="mt-1 text-sm">
                Please save this Machine ID. You will need it to access the machine in the future.
              </p>
            </div>

            <PinAuthModal mode="setup" onSuccess={handlePinSuccess} canClose={false} isOpen={true} />
          </div>
        )}
      </div>
    </div>
  )
}

