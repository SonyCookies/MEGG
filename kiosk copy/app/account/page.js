"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, User, Mail, Lock, Cpu, QrCode, LinkIcon, Unlink } from "lucide-react"
import QRCode from "../register/components/QRCode"
import { generateMachineId, checkRegistrationStatus } from "../../lib/utils"

export default function AccountSettings() {
  const [notifications, setNotifications] = useState(true)
  const [machineLinked, setMachineLinked] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [machineId, setMachineId] = useState("")
  const [machineName, setMachineName] = useState("")
  const [ownerName, setOwnerName] = useState("")

  useEffect(() => {
    const fetchMachineData = async () => {
      const generatedMachineId = generateMachineId()
      setMachineId(generatedMachineId)

      const isRegistered = await checkRegistrationStatus()
      setMachineLinked(isRegistered)

      if (isRegistered) {
        // Simulating fetching additional data for a registered machine
        setMachineName("MEGG Sorter 1")
        setOwnerName("John Doe")
      }
    }
    fetchMachineData()
  }, [])

  const handleLinkUnlink = async () => {
    if (machineLinked) {
      // Unlink logic
      setMachineLinked(false)
      setMachineName("")
      setOwnerName("")
    } else {
      // Link logic
      setShowQRCode(true)
      // In a real application, you would wait for the QR code to be scanned
      // and then update the machine status
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/home" className="text-[#0e5f97] hover:text-[#0e4772] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-[#0e5f97]">Account Settings</h1>
          <div className="w-6 h-6" /> {/* Placeholder for symmetry */}
        </header>

        {/* Account Settings Form */}
        <form className="bg-[#fcfcfd] rounded-xl shadow-md p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#171717] mb-1">
                Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  className="w-full p-2 pl-10 border border-[#0e5f97] rounded-md"
                  placeholder="John Doe"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  disabled={!machineLinked}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0e5f97]" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#171717] mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  className="w-full p-2 pl-10 border border-[#0e5f97] rounded-md"
                  placeholder="john@example.com"
                  disabled={!machineLinked}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0e5f97]" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#171717] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  className="w-full p-2 pl-10 border border-[#0e5f97] rounded-md"
                  placeholder="••••••••"
                  disabled={!machineLinked}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0e5f97]" />
              </div>
            </div>
            <div>
              <label htmlFor="machineName" className="block text-sm font-medium text-[#171717] mb-1">
                Machine Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="machineName"
                  className="w-full p-2 pl-10 border border-[#0e5f97] rounded-md"
                  placeholder="MEGG Sorter 1"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  disabled={!machineLinked}
                />
                <Cpu className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0e5f97]" />
              </div>
            </div>
            <div>
              <label htmlFor="machineId" className="block text-sm font-medium text-[#171717] mb-1">
                Machine ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="machineId"
                  className="w-full p-2 pl-10 border border-[#0e5f97] rounded-md"
                  value={machineId}
                  readOnly
                />
                <QrCode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0e5f97]" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#171717]">Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notifications}
                  onChange={() => setNotifications(!notifications)}
                  disabled={!machineLinked}
                />
                <div className="w-11 h-6 bg-[#ecb662] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0e5f97] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0e5f97]"></div>
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button
              type="submit"
              className="w-1/2 bg-[#0e5f97] text-[#fcfcfd] p-2 rounded-md hover:bg-[#0e4772] transition-colors mr-2"
              disabled={!machineLinked}
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleLinkUnlink}
              className={`w-1/2 p-2 rounded-md transition-colors flex items-center justify-center ${
                machineLinked
                  ? "bg-[#fb510f] text-[#fcfcfd] hover:bg-[#d94100]"
                  : "bg-[#ecb662] text-[#171717] hover:bg-[#e0a43e]"
              }`}
            >
              {machineLinked ? (
                <>
                  <Unlink className="w-4 h-4 mr-2" />
                  Unlink Machine
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Link Machine
                </>
              )}
            </button>
          </div>
        </form>

        {/* QR Code Section */}
        {!machineLinked && (
          <div className="mt-6 bg-[#fcfcfd] rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-[#0e5f97] mb-4">Machine QR Code</h2>
            <p className="text-sm text-[#171717]/60 mb-4">
              Scan this QR code to link your machine to the MEGG mobile app or website.
            </p>
            <div className="flex flex-col items-center">
              {showQRCode ? (
                <>
                  <QRCode value={machineId} />
                  <p className="mt-4">Machine ID: {machineId}</p>
                </>
              ) : (
                <button
                  onClick={() => setShowQRCode(true)}
                  className="bg-[#0e5f97] text-[#fcfcfd] px-4 py-2 rounded-md hover:bg-[#0e4772] transition-colors"
                >
                  Show QR Code
                </button>
              )}
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="mt-6 bg-[#fcfcfd] rounded-lg p-4 shadow-md">
          <div className="text-sm text-center text-[#171717]/60">
            System Status: <span className="text-[#0e5f97] font-medium">Online - Account Settings</span>
          </div>
        </div>
      </div>
    </div>
  )
}

