"use client"

import { useState, useEffect } from "react"
import { LogOut, Lock, Shield, AlertCircle, Clock, Key, Info, Unlink } from "lucide-react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import { addAccessLog } from "../../utils/logging"

export default function SecuritySettingsTab({ onLogout }) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showLockDialog, setShowLockDialog] = useState(false)
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false)
  const [autoLockEnabled, setAutoLockEnabled] = useState(true)
  const [requirePinForSettings, setRequirePinForSettings] = useState(true)
  const [autoLockTime, setAutoLockTime] = useState(30) // minutes
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const machineId = localStorage.getItem("machineId")
        if (!machineId) {
          setError("Machine ID not found")
          return
        }

        const machineRef = doc(db, "machines", machineId)
        const machineDoc = await getDoc(machineRef)

        if (machineDoc.exists()) {
          const data = machineDoc.data()
          setAutoLockEnabled(data.autoLockEnabled ?? true)
          setRequirePinForSettings(data.requirePinForSettings ?? true)
          setAutoLockTime(data.autoLockTime ?? 30)
        }
      } catch (err) {
        console.error("Error fetching security settings:", err)
        setError("Failed to load security settings")
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleAutoLockToggle = async () => {
    try {
      setError("")
      setSuccess("")
      const machineId = localStorage.getItem("machineId")
      if (!machineId) throw new Error("Machine ID not found")

      const machineRef = doc(db, "machines", machineId)
      await updateDoc(machineRef, {
        autoLockEnabled: !autoLockEnabled,
        updatedAt: new Date().toISOString(),
      })

      setAutoLockEnabled(!autoLockEnabled)
      setSuccess("Auto-lock settings updated successfully")

      // Log the change
      await addAccessLog({
        action: "settings_update",
        details: `Auto-lock ${!autoLockEnabled ? "enabled" : "disabled"}`,
        status: "success",
      })
    } catch (err) {
      console.error("Error updating auto-lock settings:", err)
      setError("Failed to update auto-lock settings")
    }
  }

  const handlePinRequirementToggle = async () => {
    try {
      setError("")
      setSuccess("")
      const machineId = localStorage.getItem("machineId")
      if (!machineId) throw new Error("Machine ID not found")

      const machineRef = doc(db, "machines", machineId)
      await updateDoc(machineRef, {
        requirePinForSettings: !requirePinForSettings,
        updatedAt: new Date().toISOString(),
      })

      setRequirePinForSettings(!requirePinForSettings)
      setSuccess("PIN requirement settings updated successfully")

      // Log the change
      await addAccessLog({
        action: "settings_update",
        details: `PIN requirement for settings ${!requirePinForSettings ? "enabled" : "disabled"}`,
        status: "success",
      })
    } catch (err) {
      console.error("Error updating PIN requirement settings:", err)
      setError("Failed to update PIN requirement settings")
    }
  }

  const handleAutoLockTimeChange = async (minutes) => {
    try {
      setError("")
      setSuccess("")
      const machineId = localStorage.getItem("machineId")
      if (!machineId) throw new Error("Machine ID not found")

      const machineRef = doc(db, "machines", machineId)
      await updateDoc(machineRef, {
        autoLockTime: minutes,
        updatedAt: new Date().toISOString(),
      })

      setAutoLockTime(minutes)
      setSuccess("Auto-lock time updated successfully")

      // Log the change
      await addAccessLog({
        action: "settings_update",
        details: `Auto-lock time changed to ${minutes} minutes`,
        status: "success",
      })
    } catch (err) {
      console.error("Error updating auto-lock time:", err)
      setError("Failed to update auto-lock time")
    }
  }

  const handleLockMachine = async () => {
    try {
      setError("")
      const machineId = localStorage.getItem("machineId")
      if (!machineId) throw new Error("Machine ID not found")

      const machineRef = doc(db, "machines", machineId)
      await updateDoc(machineRef, {
        locked: true,
        lockedAt: new Date().toISOString(),
      })

      // Log the action
      await addAccessLog({
        action: "machine_lock",
        details: "Machine manually locked",
        status: "success",
      })

      setShowLockDialog(false)
      onLogout() // Redirect to login/PIN screen
    } catch (err) {
      console.error("Error locking machine:", err)
      setError("Failed to lock machine")
    }
  }

  const handleUnlinkMachine = async () => {
    try {
      setError("")
      const machineId = localStorage.getItem("machineId")
      if (!machineId) throw new Error("Machine ID not found")

      const machineRef = doc(db, "machines", machineId)
      await updateDoc(machineRef, {
        linked: false,
        unlinkedAt: new Date().toISOString(),
        linkedUsers: {},
      })

      // Log the action
      await addAccessLog({
        action: "machine_unlink",
        details: "Machine unlinked from web account",
        status: "success",
      })

      localStorage.removeItem("machineId")
      window.location.href = "/setup" // Redirect to setup page
    } catch (err) {
      console.error("Error unlinking machine:", err)
      setError("Failed to unlink machine")
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading security settings...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Security Settings
        </h2>
        <p className="text-gray-500">Manage your machine security preferences</p>
      </div>

      {/* Status Messages */}
      {(error || success) && (
        <div
          className={`px-4 py-3 rounded-lg border ${
            error ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-600"
          }`}
        >
          <div className="flex items-center gap-2">
            {error ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            <p className="text-sm">{error || success}</p>
          </div>
        </div>
      )}

      {/* Settings Groups */}
      <div className="space-y-6">
        {/* Auto-lock Settings Card */}
        <div className="bg-white rounded-xl border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-[#0e4772] flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Auto-lock Settings
              </h3>
              <p className="text-sm text-gray-500">Configure automatic machine locking</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-base font-medium text-gray-900">Auto-lock Machine</label>
                <p className="text-sm text-gray-500">
                  Automatically lock the machine after {autoLockTime} minutes of inactivity
                </p>
              </div>
              <button
                role="switch"
                aria-checked={autoLockEnabled}
                onClick={handleAutoLockToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${autoLockEnabled ? "bg-[#0e5f97]" : "bg-gray-200"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${autoLockEnabled ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>

            {autoLockEnabled && (
              <div className="flex items-center gap-4 pl-4 border-l-2 border-[#0e5f97]/20">
                <label className="text-sm text-gray-700">Lock after:</label>
                <select
                  value={autoLockTime}
                  onChange={(e) => handleAutoLockTimeChange(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e5f97]"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* PIN Settings Card */}
        <div className="bg-white rounded-xl border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-[#0e4772] flex items-center gap-2">
                <Key className="w-5 h-5" />
                PIN Settings
              </h3>
              <p className="text-sm text-gray-500">Configure PIN security options</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-base font-medium text-gray-900">Require PIN for Settings</label>
              <p className="text-sm text-gray-500">Request PIN verification before changing sensitive settings</p>
            </div>
            <button
              role="switch"
              aria-checked={requirePinForSettings}
              onClick={handlePinRequirementToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${requirePinForSettings ? "bg-[#0e5f97]" : "bg-gray-200"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${requirePinForSettings ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setShowLockDialog(true)}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Lock className="w-5 h-5 mr-2" />
            Lock Machine
          </button>

          <button
            onClick={() => setShowUnlinkDialog(true)}
            className="flex items-center justify-center px-4 py-3 border border-red-200 rounded-lg text-base font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <Unlink className="w-5 h-5 mr-2" />
            Unlink Machine
          </button>

          <button
            onClick={() => setShowLogoutDialog(true)}
            className="flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-base font-medium col-span-full transition-colors"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Lock Machine Dialog */}
      {showLockDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Lock Machine
            </h3>
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
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Unlink className="w-5 h-5" />
              Unlink Machine
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to unlink this machine from your web account? This will:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-500 list-disc list-inside">
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

      {/* Logout Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Confirm Logout
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to logout? You will need to enter your PIN to access the machine again.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

