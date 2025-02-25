"use client"

import { useState } from "react"
import { Settings, Copy, Check, Info, Lock, Fingerprint, CheckCheck } from "lucide-react"

export function MachineDetails({ machineId }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try{
      await navigator.clipboard.writeText(machineId)
      setCopied(true)

      setTimeout(() => {setCopied(false)}, 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }


  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Machine Details
          </h2>
          <p className="text-gray-500">Your machine has been generated</p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Machine ID</span>
              <button
                onClick={handleCopy}
                className="relative group p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {copied ?  <CheckCheck className="h-4 w-4 text-green-500" /> :
                  <Copy className="h-4 w-4"/>
                }
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
                  {copied ? "Copied!" : "Copy to clipboard"}
                </span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="font-mono text-lg">{machineId}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-[#0e5f97]/5 rounded-lg p-4">
          <h3 className="font-medium text-[#0e4772] flex items-center gap-2 mb-3">
            <Info className="w-4 h-4" />
            Security Information
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-gray-600">
              <Lock className="w-4 h-4 text-[#0e5f97] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Access Control</p>
                <p>PIN provides secure access to machine settings</p>
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-600">
              <Fingerprint className="w-4 h-4 text-[#0e5f97] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">PIN Guidelines</p>
                <p>Choose a unique 4-digit code that you haven't used before</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

