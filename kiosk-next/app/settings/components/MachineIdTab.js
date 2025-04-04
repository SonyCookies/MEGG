"use client"

import { useState } from "react"
import { QrCode, Copy, Check, RefreshCw, Download } from "lucide-react"

export default function MachineIdTab() {
  const [machineId, setMachineId] = useState("MEGG-2023-A7X9B2")
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  const handleCopyId = () => {
    navigator.clipboard.writeText(machineId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerateQR = () => {
    setGenerating(true)
    // Simulate QR code regeneration
    setTimeout(() => {
      setGenerating(false)
    }, 1500)
  }

  const handleDownloadQR = () => {
    // In a real app, this would download the QR code image
    alert("QR code downloaded")
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#0e5f97] mb-4 flex items-center">
        <QrCode className="w-5 h-5 mr-2" />
        Machine ID & QR Code
      </h2>

      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Machine Identification</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Machine ID</p>
              <p className="font-medium text-[#171717]">{machineId}</p>
            </div>
            <button
              onClick={handleCopyId}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#0e5f97] text-white rounded-lg hover:bg-[#0e4772] transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy ID"}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Serial Number</p>
              <p className="font-medium text-[#171717]">SN-2023-45678</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Machine QR Code</h3>
          <div className="flex flex-col items-center">
            <div className="bg-white p-6 rounded-lg border border-gray-200 mb-4">
              {/* Placeholder for QR code */}
              <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                <QrCode className="w-24 h-24 text-[#0e5f97]" />
              </div>
            </div>
            <div className="text-sm text-gray-500 mb-4 text-center">
              Scan this QR code to link the machine to your account
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRegenerateQR}
                disabled={generating}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-[#0e5f97] text-[#0e5f97] rounded-lg hover:bg-[#0e5f97]/10 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Generating..." : "Regenerate"}
              </button>
              <button
                onClick={handleDownloadQR}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#0e5f97] text-white rounded-lg hover:bg-[#0e4772] transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

