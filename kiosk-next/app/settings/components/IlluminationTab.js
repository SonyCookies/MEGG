"use client"

import { useState } from "react"
import { Sun, Moon, Zap, Clock } from "lucide-react"

export default function IlluminationTab() {
  const [lightingMode, setLightingMode] = useState("auto")
  const [brightness, setBrightness] = useState(75)
  const [colorTemperature, setColorTemperature] = useState(5000)
  const [schedule, setSchedule] = useState({
    enabled: true,
    startTime: "08:00",
    endTime: "18:00",
  })

  const handleScheduleChange = (field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#0e5f97] mb-4 flex items-center">
        <Sun className="w-5 h-5 mr-2" />
        Illumination Settings
      </h2>

      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Lighting Mode</h3>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setLightingMode("auto")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                lightingMode === "auto" ? "bg-[#0e5f97] text-white" : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              <Zap className="w-4 h-4" />
              Auto
            </button>
            <button
              onClick={() => setLightingMode("manual")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                lightingMode === "manual" ? "bg-[#0e5f97] text-white" : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              <Sun className="w-4 h-4" />
              Manual
            </button>
            <button
              onClick={() => setLightingMode("schedule")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                lightingMode === "schedule"
                  ? "bg-[#0e5f97] text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              <Clock className="w-4 h-4" />
              Schedule
            </button>
          </div>

          {lightingMode === "schedule" && (
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-[#0e4772]">Enable Schedule</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schedule.enabled}
                    onChange={(e) => handleScheduleChange("enabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0e5f97]"></div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => handleScheduleChange("startTime", e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e5f97]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Time</label>
                  <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => handleScheduleChange("endTime", e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e5f97]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Sun className="w-4 h-4 text-[#ecb662]" />
                  Brightness
                </label>
                <span className="text-sm font-medium text-[#0e5f97]">{brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number.parseInt(e.target.value))}
                className="w-full h-2 bg-[#ecb662] rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Moon className="w-4 h-4 text-[#0e5f97]" />
                  Color Temperature
                </label>
                <span className="text-sm font-medium text-[#0e5f97]">{colorTemperature}K</span>
              </div>
              <input
                type="range"
                min="2700"
                max="6500"
                step="100"
                value={colorTemperature}
                onChange={(e) => setColorTemperature(Number.parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-amber-400 via-gray-200 to-blue-400 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Warm</span>
                <span>Neutral</span>
                <span>Cool</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Camera Illumination</h3>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Auxiliary Lighting</h4>
              <p className="text-xs text-gray-500">Additional lighting for better egg detection</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0e5f97]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Infrared Mode</h4>
              <p className="text-xs text-gray-500">For low-light conditions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0e5f97]"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

