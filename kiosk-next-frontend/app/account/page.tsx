"use client"

import Link from "next/link"
import { QrCode, MoveLeft, LockKeyholeOpen, Wrench, Settings } from "lucide-react"


export default function AccountPage() {
    return (
        <div className="h-screen overflow-hidden bg-[#0e5f97] p-3 sm:p-4 relative">

            {/* Background pattern */}
            <BackgroundElements />

            <div className="max-w-3xl mx-auto relative">
                <div className="bg-gradient-to-br from-white to-[#f0f7ff] rounded-2xl p-4 h-[440px]">
                    <div className="flex flex-col gap-6 h-full">
                        {/* nav */}
                        <div className="flex items-center justify-between text-black">
                            {/* left of nav */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 text-2xl text-[#0e5f97] font-bold">
                                    <Wrench className="w-8 h-8" />
                                    Account Management
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

                        {/* options */}
                        <div className=" h-full w-md mx-auto flex flex-col gap-4">
                            <Link href="/account/machine-details" className="p-4 flex flex-1 items-center justify-center text-xl bg-[#0e5f97]  transition-all duration-300 hover:scale-105 active:scale-90 rounded-xl font-semibold gap-3">
                                <QrCode className="w-8 h-8" />
                                Machine Details
                            </Link>
                            <Link href="/account/pin-authentication" className="p-4 flex flex-1 items-center justify-center text-xl bg-[#0e5f97]  transition-all duration-300 hover:scale-105 active:scale-90 rounded-xl font-semibold gap-3">
                                <LockKeyholeOpen className="w-8 h-8" />

                                PIN Authentication
                            </Link>
                            <Link href="/account/security-settings" className="p-4 flex flex-1 items-center justify-center text-xl bg-[#0e5f97]  transition-all duration-300 hover:scale-105 active:scale-90 rounded-xl font-semibold gap-3">
                                <Settings className="w-8 h-8" />
                                Security Settings
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
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
    )
}


