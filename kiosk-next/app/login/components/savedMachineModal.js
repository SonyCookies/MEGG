"use client"

import { Shield, XCircle } from "lucide-react"

export function SavedMachineModal({ savedMachineId, onUseSaved, onUseDifferent, onClearSaved }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-[#0e4772]">
            <Shield className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Saved Machine</h2>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">You have a saved machine ID. Would you like to use it to log in?</p>

          <div className="bg-[#0e5f97]/5 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2">Saved Machine ID:</p>
            <p className="font-mono text-lg text-[#0e4772]">{savedMachineId}</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onUseSaved}
            className="w-full bg-[#0e5f97] hover:bg-[#0e4772] text-white py-2.5 px-4 rounded-lg transition-colors"
          >
            Use This Machine ID
          </button>

          <button
            onClick={onUseDifferent}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg transition-colors"
          >
            Use Different Machine ID
          </button>

          <button
            onClick={onClearSaved}
            className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 py-2"
          >
            <XCircle className="w-4 h-4" />
            <span className="text-sm">Clear Saved Machine ID</span>
          </button>
        </div>
      </div>
    </div>
  )
}

