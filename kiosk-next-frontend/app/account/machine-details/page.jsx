"use client";

import Link from "next/link";
import {
  QrCode,
  MoveLeft,
  ScanQrCode,
  BookOpenText,
  UserRound,
  Monitor,
  Pencil,
  Fingerprint,
} from "lucide-react";

import InformationPage from "./components/Information";
import OwnerDetailsPage from "./components/OwnerDetails";
import { useState } from "react";

export default function MachineDetailsPage() {
  const [activeTab, setActiveTab] = useState("information")

  return (
    <div className="h-screen overflow-hidden bg-[#0e5f97] p-3 sm:p-4 relative">
      {/* Background pattern */}
      <BackgroundElements />

      <div className="max-w-3xl mx-auto relative text-black">
        <div className="bg-gradient-to-br from-white to-[#f0f7ff] rounded-2xl p-4 h-[440px]">
          <div className="flex flex-col gap-6 h-full">
            {/* nav */}
            <div className="flex items-center justify-between ">
              {/* left of nav */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-2xl text-[#0e5f97] font-bold">
                  <QrCode className="w-8 h-8" />
                  Machine Details
                </div>
              </div>

              {/* right of nav */}
              <div className="flex items-center justify-end">
                <Link
                  href="/account"
                  className="px-6 py-3 bg-white rounded-lg shadow-sm flex items-center gap-2 text-[#0e5f97] hover:bg-[#0e5f97] hover:text-white transition-all duration-300"
                >
                  <MoveLeft className="w-5 h-5" />
                  Back
                </Link>
              </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 gap-6 ">
              {/* machine information */}
              <div className="flex flex-col gap-6 flex-1 bg-red00">
                {/* buttons */}
                <div className="flex gap-4 w-full">
                  <button
                    className={`p-4 flex w-full items-center justify-center font-medium gap-2 rounded-lg cursor-pointer transition-colors duration-300 
            ${
              activeTab === "information"
                ? "bg-[#0e5f97] text-white hover:bg-[#0e5f97]/90"
                : "bg-white text-[#0e5f97] hover:bg-gray-100 border border-[#0e5f97]/20"
            }`}
                    onClick={() => setActiveTab("information")}
                  >
                    <BookOpenText className="w-5 h-5" />
                    Information
                  </button>
                  <button
                    className={`p-4 flex w-full items-center justify-center font-medium gap-2 rounded-lg cursor-pointer transition-colors duration-300 
            ${
              activeTab === "owner"
                ? "bg-[#0e5f97] text-white hover:bg-[#0e5f97]/90"
                : "bg-white text-[#0e5f97] hover:bg-gray-100 border border-[#0e5f97]/20"
            }`}
                    onClick={() => setActiveTab("owner")}
                  >
                    <UserRound className="w-5 h-5" />
                    Owner Details
                  </button>
                </div>

                {/* render component */}
                {activeTab === "information" ? (
                  <InformationPage />
                ) : (
                  <OwnerDetailsPage />
                )}
              </div>

              {/* qr container */}
              <div className="flex flex-col p-4 w-xs rounded-lg bg-white shadow-sm gap-4 border border-[#0e5f97]/20">
                {/* header */}
                <div className="flex items-center gap-2 text-[#0e5f97]">
                  <QrCode className="w-6 h-6" />
                  <span className="text-xl font-semibold">Machine QR Code</span>
                </div>

                {/* generate qr code */}
                <div className="h-full flex flex-col items-center justify-center gap-6">
                  <ScanQrCode className="w-24 h-24 text-gray-300 animate-pulse" />
                  <div className="flex flex-col w-full gap-2">
                    <button className="w-full flex items-center justify-center bg-[#0e5f97] p-4 text-white rounded-lg cursor-pointer transition-colors duration-300 hover:bg-[#0e5f97]/90 ">
                      Generate QR Code
                    </button>
                    <span className="text-gray-500 text-sm text-center">
                      Scan to link this machine to your web account.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0wIDMwaDMwdjMwSDB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwSDB2MzBoMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwaDMwdjMwSDMweiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iLjUiLz48L2c+PC9zdmc+')] opacity-60"></div>

      {/* Animated egg shapes */}
      <div
        className="absolute top-1/4 right-1/4 w-64 h-80 bg-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] blur-3xl animate-pulse opacity-30"
        style={{ animationDuration: "8s" }}
      ></div>
      <div
        className="absolute bottom-1/4 left-1/4 w-64 h-80 bg-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] blur-3xl animate-pulse opacity-30"
        style={{ animationDuration: "10s", animationDelay: "2s" }}
      ></div>

      {/* Light beams */}
      <div className="absolute -top-20 left-1/2 w-1 h-60 bg-gradient-to-b from-cyan-300/20 to-transparent blur-md transform -translate-x-1/2 rotate-15 opacity-30"></div>
      <div className="absolute -top-20 left-1/3 w-1 h-60 bg-gradient-to-b from-cyan-300/10 to-transparent blur-md transform -translate-x-1/2 -rotate-15 opacity-30"></div>
    </div>
  );
}
