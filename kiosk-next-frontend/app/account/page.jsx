"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import MachineDetailsTab from "./components/AccountContent"

export default function Page() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0e5f97] p-3 sm:p-4 md:p-6 relative">
      {/* Floating back button */}
      <button
        onClick={() => router.push("/home")}
        className="absolute top-6 left-6 bg-white/10 hover:bg-white/20 p-3 rounded-full z-20"
      >
        <ChevronLeft className="w-8 h-8 text-white" />
      </button>

      <div className="max-w-3xl mx-auto">
        <div
          className="bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a]
                     rounded-lg shadow-lg overflow-hidden h-[440px] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center px-4 py-3 border-b border-white/10">
            <span className="text-white font-bold text-lg">Account</span>
          </div>

          {/* Machine Details */}
          <div className="flex-1 overflow-auto">
            <MachineDetailsTab />
          </div>
        </div>
      </div>
    </div>
  )
}
