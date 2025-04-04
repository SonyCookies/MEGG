"use client"

import { useState } from "react"
import { RotateCcw, AlertTriangle, Trash2, RefreshCw, Save, X } from "lucide-react"

export default function ResetTab() {
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [showConfirmFactory, setShowConfirmFactory] = useState(false)
  const [resetType, setResetType] = useState("")
  const [confirmText, setConfirmText] = useState("")

  const handleReset = (type) => {
    setResetType(type)
    setConfirmText("")

    if (type === "settings") {
      setShowConfirmReset(true)
    } else if (type === "factory") {
      setShowConfirmFactory(true)
    }
  }

  const confirmReset = () => {
    // In a real app, this would reset the settings
    alert(`${resetType === "settings" ? "Settings" : "Factory"} reset completed`)
    setShowConfirmReset(false)
    setShowConfirmFactory(false)
  }

  const cancelReset = () => {
    setShowConfirmReset(false)
    setShowConfirmFactory(false)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#0e5f97] mb-4 flex items-center">
        <RotateCcw className="w-5 h-5 mr-2" />
        Reset & Factory Defaults
      </h2>

      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-700 mb-1">Warning</h3>
              <p className="text-sm text-amber-600">
                Resetting your machine will erase your custom settings. Factory reset will erase all data and return the
                machine to its original state. These actions cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Reset Options</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-[#171717] mb-1">Reset Settings</h4>
                <p className="text-sm text-gray-500">Reset all settings to default values</p>
              </div>
              <button
                onClick={() => handleReset("settings")}
                className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Settings
              </button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-[#171717] mb-1">Factory Reset</h4>
                <p className="text-sm text-gray-500">Erase all data and restore factory defaults</p>
              </div>
              <button
                onClick={() => handleReset("factory")}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Factory Reset
              </button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-[#171717] mb-1">Export Settings</h4>
                <p className="text-sm text-gray-500">Save your current settings to a file</p>
              </div>
              <button className="px-3 py-1.5 bg-[#0e5f97] text-white rounded-lg text-sm hover:bg-[#0e4772] transition-colors flex items-center gap-1">
                <Save className="w-4 h-4" />
                Export
              </button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-[#171717] mb-1">Import Settings</h4>
                <p className="text-sm text-gray-500">Load settings from a file</p>
              </div>
              <button className="px-3 py-1.5 border border-[#0e5f97] text-[#0e5f97] rounded-lg text-sm hover:bg-[#0e5f97]/10 transition-colors">
                Import
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Settings Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0e5f97] flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Reset Settings
              </h3>
              <button onClick={cancelReset} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to reset all settings to their default values? This action cannot be undone.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-600">
                  This will reset all camera, sorting, and illumination settings.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelReset}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
              >
                Reset Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Factory Reset Confirmation Modal */}
      {showConfirmFactory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Factory Reset
              </h3>
              <button onClick={cancelReset} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to perform a factory reset? This will erase ALL data and restore the machine to
                its original state.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">
                  This action is permanent and cannot be undone. All settings, calibration data, and user preferences
                  will be erased.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type "FACTORY RESET" to confirm</label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="FACTORY RESET"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelReset}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                disabled={confirmText !== "FACTORY RESET"}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Factory Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

