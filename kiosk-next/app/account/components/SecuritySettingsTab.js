"use client"

import { useState, useEffect } from "react"
import { Shield, Lock, AlertTriangle, CheckCircle2, X, Unlink, Clock } from "lucide-react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import { addAccessLog } from "../../utils/logging"
import { useAutoLogout } from "../../hooks/useAutoLogout"

const AUTO_LOCK_TIMES = [
  { value: 1, label: "1 minute" },
  { value: 5, label: "5 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
]

export default function SecuritySettingsTab() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    autoLogout: {
      enabled: true,
      timeout: 15,
    },
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [machineId, setMachineId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false)
  const [linkStatus, setLinkStatus] = useState({
    isLinked: false,
    linkedUsers: null,
  })

  const { handleLogout } = useAutoLogout(settings.autoLogout.enabled, settings.autoLogout.timeout)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)

        const sessionResponse = await fetch("/api/auth/session")
        const sessionData = await sessionResponse.json()

        if (!sessionResponse.ok) {
          throw new Error(sessionData.error || "Failed to verify session")
        }

        const currentMachineId = sessionData.machineId
        setMachineId(currentMachineId)

        const machineRef = doc(db, "machines", currentMachineId)
        const machineDoc = await getDoc(machineRef)

        if (machineDoc.exists()) {
          const data = machineDoc.data()
          setSettings({
            autoLogout: {
              enabled: data.autoLogoutEnabled ?? true,
              timeout: data.autoLogoutTimeout ?? 15,
            },
          })

          const linkedUsers = data.linkedUsers || {}
          setLinkStatus({
            isLinked: Object.keys(linkedUsers).length > 0,
            linkedUsers,
          })
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

  const handleSettingChange = async (section, key, value) => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      setSettings((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value,
        },
      }))

      const updateData = {
        [`${section}${key.charAt(0).toUpperCase() + key.slice(1)}`]: value,
        updatedAt: new Date().toISOString(),
      }

      const machineRef = doc(db, "machines", machineId)
      await updateDoc(machineRef, updateData)

      await addAccessLog(
        {
          action: "settings_update",
          details: `Updated ${section}.${key} to ${value}`,
          status: "success",
        },
        machineId,
      )

      setSuccess("Settings updated successfully")
    } catch (err) {
      console.error("Error updating settings:", err)
      setError("Failed to update settings")

      setSettings((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: !value,
        },
      }))
    } finally {
      setSaving(false)
    }
  }

  const handleUnlinkMachine = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const machineRef = doc(db, "machines", machineId)
      await updateDoc(machineRef, {
        linkedUsers: {},
        unlinkedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      await addAccessLog(
        {
          action: "machine_unlink",
          details: "Machine unlinked from web account",
          status: "success",
        },
        machineId,
      )

      setLinkStatus({
        isLinked: false,
        linkedUsers: null,
      })

      setSuccess("Machine successfully unlinked")
      setShowUnlinkDialog(false)
    } catch (err) {
      console.error("Error unlinking machine:", err)
      setError("Failed to unlink machine")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Security Settings
            </h2>
            <p className="text-gray-500">Configure machine security preferences</p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-6">
          {/* Auto-lock Section */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#0e5f97]" />
              <h3 className="text-lg font-medium text-[#0e4772]">Auto-lock Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="h-8 w-48 animate-shimmer rounded" />
              <div className="h-10 w-full max-w-xs animate-shimmer rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Security Settings
          </h2>
          <p className="text-gray-500">Configure machine security preferences</p>
        </div>
      </div>

      {/* Status Messages */}
      {(error || success) && (
        <div
          className={`px-4 py-3 rounded-lg border ${
            error ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {error ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <p className="text-sm font-medium">{error || success}</p>
            <button
              onClick={() => {
                setError("")
                setSuccess("")
              }}
              className="ml-auto hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Settings Sections */}
      <div className="grid gap-6">
        {/* Auto-lock Section */}
        <div className="bg-white rounded-xl border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#0e5f97]" />
              <h3 className="text-lg font-medium text-[#0e4772]">Auto-logout Settings</h3>
            </div>
            <button
              onClick={() => handleLogout("manual_logout")}
              className="px-4 py-2 text-sm font-medium text-[#0e5f97] border border-[#0e5f97] rounded-lg hover:bg-[#0e5f97]/5"
            >
              Logout Now
            </button>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-base font-medium text-gray-900">Auto-logout</label>
                <p className="text-sm text-gray-500">Automatically log out after period of inactivity</p>
              </div>
              <button
                role="switch"
                aria-checked={settings.autoLogout.enabled}
                onClick={() => handleSettingChange("autoLogout", "enabled", !settings.autoLogout.enabled)}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.autoLogout.enabled ? "bg-[#0e5f97]" : "bg-gray-200"}
                  ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.autoLogout.enabled ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>

            {settings.autoLogout.enabled && (
              <div className="pl-4 border-l-2 border-[#0e5f97]/20">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Logout after inactivity period</label>
                <select
                  value={settings.autoLogout.timeout}
                  onChange={(e) => handleSettingChange("autoLogout", "timeout", Number(e.target.value))}
                  disabled={saving}
                  className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0e5f97]"
                >
                  {AUTO_LOCK_TIMES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0e5f97]" />
            <h3 className="text-lg font-medium text-[#0e4772]">Machine Link Status</h3>
          </div>

          {linkStatus.isLinked ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Machine Linked</span>
              </div>

              <div className="space-y-4">
                {Object.entries(linkStatus.linkedUsers).map(([userId, userData]) => (
                  <div key={userId} className="space-y-1">
                    <p className="text-sm text-gray-500">Linked User</p>
                    <p className="font-medium text-gray-900">{userData.name || "Unknown"}</p>
                    <p className="text-sm text-gray-500">{userData.email || "No email provided"}</p>
                    {userData.linkedAt && (
                      <p className="text-sm text-gray-500">
                        Linked on {new Date(userData.linkedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowUnlinkDialog(true)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Unlink className="w-4 h-4" />
                Unlink Machine
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <Shield className="w-12 h-12 text-gray-300 mx-auto" />
              <h4 className="text-gray-600 font-medium mb-2">Machine Not Linked</h4>
              <p className="text-sm text-gray-500">
                This machine is not currently linked to any web account. Use the QR code in the Machine Details tab to
                link this machine.
              </p>
            </div>
          )}
        </div>
      </div>
      {showUnlinkDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Unlink className="w-5 h-5" />
              Unlink Machine
            </h3>
            <p className="mt-2 text-sm text-gray-500">Are you sure you want to unlink this machine? This will:</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-500 list-disc list-inside">
              <li>Remove all web account connections</li>
              <li>Require re-linking via QR code to reconnect</li>
              <li>Not affect local PIN access</li>
            </ul>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowUnlinkDialog(false)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlinkMachine}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Unlinking..." : "Unlink Machine"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

