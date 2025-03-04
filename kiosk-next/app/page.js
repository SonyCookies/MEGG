"use client"
import Link from "next/link"
import { Settings, LogIn } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#0e5f97]">Machine Interface</h1>
          <p className="text-gray-500 mt-2">Choose an option to continue</p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/setup"
            className="w-full h-16 text-lg flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-[#0e5f97] border-2 border-[#0e5f97] rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5" />
            Setup New Machine
          </Link>

          <Link
            href="/login"
            className="w-full h-16 text-lg flex items-center justify-center gap-2 bg-[#0e5f97] hover:bg-[#0e4772] text-white rounded-lg transition-colors"
          >
            <LogIn className="h-5 w-5" />
            Login to Machine
          </Link>
        </div>
      </div>
    </div>
  )
}

