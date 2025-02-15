"use client"

import { useState } from "react"
import Link from "next/link"
import { Camera, Settings, History, SortAsc, UserCog, Package, Play } from 'lucide-react'
import BatchModal from "./components/BatchModel"

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const navigationItems = [
    {
      name: "Defect Detection",
      icon: Camera,
      href: "/detection",
      color: "bg-[#0e5f97]",
    },
    {
      name: "Machine Settings",
      icon: Settings,
      href: "/settings",
      color: "bg-[#0e4772]",
    },
    {
      name: "Defect History",
      icon: History,
      href: "/defect-history",
      color: "bg-[#fb510f]",
    },
    {
      name: "Sorting History",
      icon: SortAsc,
      href: "/sorting-history",
      color: "bg-[#ecb662]",
    },
    {
      name: "Account",
      icon: UserCog,
      href: "/account",
      color: "bg-[#0e5f97]",
    },
    {
      name: "Inventory",
      icon: Package,
      href: "/inventory",
      color: "bg-[#0e4772]",
    },
  ]

  const handleStartClick = () => {
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4 relative">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#0e5f97]">megg</h1>
          <p className="text-sm text-[#171717]/60">Egg Sorting System</p>
        </header>

        {/* Navigation Grid */}
        <div className="grid grid-cols-3 gap-4">
          {navigationItems.map((item) => (
            <div
              key={item.name}
              className={`${item.color} rounded-xl p-4 text-[#fcfcfd] hover:opacity-90 transition-opacity shadow-md`}
            >
              <Link href={item.href} className="flex flex-col items-center justify-center min-h-[100px]">
                <item.icon className="w-8 h-8 mb-2" />
                <span className="text-center font-medium text-sm">{item.name}</span>
              </Link>
            </div>
          ))}
        </div>

        {/* System Status */}
        <div className="mt-6 bg-[#fcfcfd] rounded-lg p-4 shadow-md">
          <div className="text-sm text-center text-[#171717]/60">
            System Status: <span className="text-[#0e5f97] font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleStartClick}
        className="fixed bottom-8 right-8 bg-[#0e5f97] text-white p-4 rounded-full shadow-lg hover:bg-[#0e4772] transition-colors"
      >
        <Play className="w-6 h-6" />
      </button>

      {/* Batch Modal */}
      <BatchModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
