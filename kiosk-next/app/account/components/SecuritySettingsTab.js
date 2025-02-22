"use client"

import { useState } from "react"
import { Unlink, Lock } from "lucide-react"

export default function SecuritySettingsTab() {
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false)
  const [showLockDialog, setShowLockDialog] = useState(false)
  const [autoLockEnabled, setAutoLockEnabled] = useState(true)
  const [requirePinForSettings, setRequirePinForSettings] = useState(true)

  const handleLockMachine = async () => {
    try {
      // Here you would typically make an API call to lock the machine
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // Handle machine lock state
    } catch (error) {
      console.error("Error locking machine:", error)
    }
  }

  const handleUnlinkMachine = async () => {
    try {
      // Here you would make an API call to unlink the machine from the web account
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // Reset machine state and clear web account association
      window.location.href = "/setup" // or wherever your initial setup page is
    } catch (error) {
      console.error("Error unlinking machine:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-[#0e4772]">Security Settings</h2>
        <p className="text-gray-500">Manage your machine security preferences</p>
      </div>

      <div className="space-y-6">
        {/* Auto-lock Settings */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-base font-medium text-gray-900">Auto-lock Machine</label>
            <p className="text-sm text-gray-500">Automatically lock the machine after 30 minutes of inactivity</p>
          </div>
          <button
            role="switch"
            aria-checked={autoLockEnabled}
            onClick={() => setAutoLockEnabled(!autoLockEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${autoLockEnabled ? "bg-[#0e5f97]" : "bg-gray-200"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${autoLockEnabled ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>

        {/* PIN Requirement Settings */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-base font-medium text-gray-900">Require PIN for Settings</label>
            <p className="text-sm text-gray-500">Request PIN verification before changing sensitive settings</p>
          </div>
          <button
            role="switch"
            aria-checked={requirePinForSettings}
            onClick={() => setRequirePinForSettings(!requirePinForSettings)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${requirePinForSettings ? "bg-[#0e5f97]" : "bg-gray-200"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${requirePinForSettings ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>

        <div className="pt-6 space-y-4">
          {/* Lock Machine Button */}
          <button
            onClick={() => setShowLockDialog(true)}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Lock className="w-4 h-4 mr-2" />
            Lock Machine
          </button>

          {/* Unlink Machine Button */}
          <button
            onClick={() => setShowUnlinkDialog(true)}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-base font-medium"
          >
            <Unlink className="w-4 h-4 mr-2" />
            Unlink Machine
          </button>
        </div>
      </div>

      {/* Lock Machine Dialog */}
      {showLockDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">Lock Machine</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to lock the machine? You will need to enter your PIN to unlock it.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLockDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLockMachine}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0e5f97] rounded-lg hover:bg-[#0e4772]"
              >
                Lock Machine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlink Machine Dialog */}
      {showUnlinkDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">Unlink Machine</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to unlink this machine from your web account? This will:
            </p>
            <ul className="mt-2 text-sm text-gray-500 list-disc list-inside space-y-1">
              <li>Disconnect the machine from your web account</li>
              <li>Stop syncing data to the web interface</li>
              <li>Require re-linking via QR code to reconnect</li>
            </ul>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowUnlinkDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlinkMachine}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Unlink Machine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

