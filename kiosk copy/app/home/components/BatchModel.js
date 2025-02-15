"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

export default function BatchModal({ isOpen, onClose }) {
  const [batchNumber, setBatchNumber] = useState("")
  const [useDefault, setUseDefault] = useState(false)
  const [existingBatch, setExistingBatch] = useState(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      // Simulating API call to check for existing batch
      // Replace this with your actual API call
      setTimeout(() => {
        setExistingBatch("BATCH-001")
      }, 1000)
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const finalBatchNumber = useDefault ? "DEFAULT" : batchNumber
    // Handle the batch number submission
    // You can add your logic here to save the batch number or start the session
    console.log("Batch number submitted:", finalBatchNumber)
    onClose()
    // Navigate to the detection page with the batch number as a query parameter
    router.push(`/detection?batch=${encodeURIComponent(finalBatchNumber)}`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#0e5f97]">Set Batch Number</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {existingBatch && (
          <div className="mb-4 p-3 bg-yellow-100 rounded-lg">
            <p className="text-sm text-yellow-800">
              Existing batch found: {existingBatch}. Using this batch will modify its inventory.
            </p>
            <button
              onClick={() => {
                setBatchNumber(existingBatch)
                setUseDefault(false)
              }}
              className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900"
            >
              Use Existing Batch
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e5f97]"
              placeholder="Enter batch number"
              disabled={useDefault}
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useDefault}
                onChange={() => setUseDefault(!useDefault)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Use system default (auto-incrementing)</span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#0e5f97] text-white px-4 py-2 rounded-md hover:bg-[#0e4772] transition-colors"
            >
              Start Session
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

