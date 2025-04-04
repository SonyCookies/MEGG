"use client"

import { useState } from "react"
import { Gauge, Clock, AlertTriangle } from "lucide-react"

export default function SortingSpeedTab({ sortingSpeed, onSpeedChange }) {
  const [showWarning, setShowWarning] = useState(false)

  const handleSpeedChange = (value) => {
    const newValue = Number.parseInt(value)
    onSpeedChange(newValue)

    // Show warning if speed is very high
    setShowWarning(newValue > 80)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#0e5f97] mb-4 flex items-center">
        <Gauge className="w-5 h-5 mr-2" />
        Sorting Speed Control
      </h2>

      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Main Conveyor Speed</h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Speed Setting</label>
                <span className="text-lg font-semibold text-[#0e5f97]">{sortingSpeed}%</span>
              </div>

              <input
                type="range"
                min="10"
                max="100"
                value={sortingSpeed}
                onChange={(e) => handleSpeedChange(e.target.value)}
                className="w-full h-2 bg-[#ecb662] rounded-lg appearance-none cursor-pointer"
              />

              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Slow</span>
                <span>Medium</span>
                <span>Fast</span>
              </div>
            </div>

            {showWarning && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">High speeds may reduce sorting accuracy</span>
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#0e5f97]" />
                <h4 className="font-medium text-[#0e4772]">Estimated Throughput</h4>
              </div>
              <p className="text-sm text-gray-700">
                {sortingSpeed < 30
                  ? "Up to 3,600"
                  : sortingSpeed < 60
                    ? "Up to 7,200"
                    : sortingSpeed < 80
                      ? "Up to 10,800"
                      : "Up to 14,400"}{" "}
                eggs per hour
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Advanced Speed Settings</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Acceleration Rate</label>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg text-sm bg-[#0e5f97] text-white">Gradual</button>
                <button className="px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-300 text-gray-700">
                  Medium
                </button>
                <button className="px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-300 text-gray-700">
                  Rapid
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Controls how quickly the conveyor reaches the target speed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deceleration Rate</label>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg text-sm bg-[#0e5f97] text-white">Gradual</button>
                <button className="px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-300 text-gray-700">
                  Medium
                </button>
                <button className="px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-300 text-gray-700">
                  Rapid
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Controls how quickly the conveyor stops.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

