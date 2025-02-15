"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Sliders, Weight, WrenchIcon } from "lucide-react"

export default function MachineSettings() {
  const [sortingSpeed, setSortingSpeed] = useState(50)
  const [eggSizes, setEggSizes] = useState({
    small: 50,
    medium: 60,
    large: 70,
    xl: 80,
    jumbo: 90,
  })

  const handleSpeedChange = (e) => {
    setSortingSpeed(e.target.value)
  }

  const handleEggSizeChange = (size, value) => {
    setEggSizes((prev) => ({ ...prev, [size]: value }))
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/home" className="text-[#0e5f97] hover:text-[#0e4772] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-[#0e5f97]">Machine Settings</h1>
          <div className="w-6 h-6" /> {/* Placeholder for symmetry */}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sorting Speed */}
          <div className="bg-[#fcfcfd] rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-[#0e5f97] mb-4 flex items-center">
              <Sliders className="w-5 h-5 mr-2" />
              Sorting Speed
            </h2>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={sortingSpeed}
                onChange={handleSpeedChange}
                className="w-full h-2 bg-[#ecb662] rounded-lg appearance-none cursor-pointer"
              />
              <span className="ml-4 text-[#171717] font-medium">{sortingSpeed}%</span>
            </div>
          </div>

          {/* Egg Size Settings */}
          <div className="bg-[#fcfcfd] rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-[#0e5f97] mb-4 flex items-center">
              <Weight className="w-5 h-5 mr-2" />
              Desired Gram per Size
            </h2>
            <div className="space-y-4">
              {Object.entries(eggSizes).map(([size, value]) => (
                <div key={size} className="flex items-center justify-between">
                  <label htmlFor={size} className="capitalize text-[#171717]">
                    {size}
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      id={size}
                      value={value}
                      onChange={(e) => handleEggSizeChange(size, e.target.value)}
                      className="w-16 px-2 py-1 border border-[#0e5f97] rounded-md text-right"
                    />
                    <span className="ml-2 text-[#171717]">g</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Machine Checkup */}
          <div className="md:col-span-2 bg-[#fcfcfd] rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-[#0e5f97] mb-4 flex items-center">
              <WrenchIcon className="w-5 h-5 mr-2" />
              Machine Checkup
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#ecb662] bg-opacity-20 p-4 rounded-lg">
                <h3 className="font-medium text-[#171717] mb-2">Last Maintenance</h3>
                <p className="text-[#171717]">2023-06-15</p>
              </div>
              <div className="bg-[#ecb662] bg-opacity-20 p-4 rounded-lg">
                <h3 className="font-medium text-[#171717] mb-2">Next Scheduled Maintenance</h3>
                <p className="text-[#171717]">2023-09-15</p>
              </div>
              <div className="bg-[#ecb662] bg-opacity-20 p-4 rounded-lg">
                <h3 className="font-medium text-[#171717] mb-2">Machine Status</h3>
                <p className="text-[#0e5f97] font-medium">Operational</p>
              </div>
              <div className="bg-[#ecb662] bg-opacity-20 p-4 rounded-lg">
                <h3 className="font-medium text-[#171717] mb-2">Total Runtime</h3>
                <p className="text-[#171717]">1,250 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button className="bg-[#0e5f97] text-[#fcfcfd] px-6 py-2 rounded-md hover:bg-[#0e4772] transition-colors">
            Save Settings
          </button>
        </div>

        {/* System Status */}
        <div className="mt-6 bg-[#fcfcfd] rounded-lg p-4 shadow-md">
          <div className="text-sm text-center text-[#171717]/60">
            System Status: <span className="text-[#0e5f97] font-medium">Online - Settings Page</span>
          </div>
        </div>
      </div>
    </div>
  )
}

