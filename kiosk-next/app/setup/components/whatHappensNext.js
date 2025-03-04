import { Info, Check } from "lucide-react"

export function WhatHappensNext() {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="font-medium text-[#0e4772] flex items-center gap-2 mb-4">
        <Info className="w-5 h-5" />
        What Happens Next?
      </h3>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="bg-green-50 rounded-full p-1">
            <Check className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-sm text-gray-600">Your machine ID will be generated with a secure format</p>
        </div>
        <div className="flex items-start gap-3">
          <div className="bg-green-50 rounded-full p-1">
            <Check className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-sm text-gray-600">You'll set up a PIN for secure access control</p>
        </div>
        <div className="flex items-start gap-3">
          <div className="bg-green-50 rounded-full p-1">
            <Check className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-sm text-gray-600">The system will create necessary security credentials</p>
        </div>
      </div>
    </div>
  )
}

