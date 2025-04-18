"use client"

import type React from "react"
import Image from "next/image"

interface MachineLoadingProps {
  isLoading: boolean
  progress: number
  currentStage: number
}

const stageDescriptions = [
  "Initializing machine registration",
  "Generating security keys",
  "Creating machine identifier",
  "Finalizing registration",
]

const MachineLoading: React.FC<MachineLoadingProps> = ({ isLoading, progress, currentStage }) => {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
      <div className="flex flex-col items-center max-w-md w-full">
        {/* Egg container */}
        <div className="relative mb-6">
          {/* Pulsing rings */}
          <div
            className="absolute inset-[-12px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-[#0e5f97]/20 animate-ping-slow"
            style={{ animationDuration: "3s" }}
          ></div>
          <div
            className="absolute inset-[-6px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-[#0e5f97]/30 animate-ping-slow"
            style={{ animationDuration: "2s" }}
          ></div>

          {/* Main egg shape */}
          <div className="relative w-32 h-40 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] bg-white/90 shadow-lg overflow-hidden">
            {/* Fill animation */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0e5f97] to-[#0e5f97]/80 transition-all duration-300 ease-out"
              style={{ height: `${progress}%` }}
            >
              {/* Bubbles effect */}
              <div className="absolute inset-0 overflow-hidden opacity-70">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute bg-white/30 rounded-full animate-float-bubble"
                    style={{
                      width: `${Math.random() * 10 + 5}px`,
                      height: `${Math.random() * 10 + 5}px`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${Math.random() * 3 + 2}s`,
                    }}
                  ></div>
                ))}
              </div>

              {/* Data particles effect */}
              <div className="absolute inset-0">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute h-0.5 bg-white/40 animate-data-flow"
                    style={{
                      width: `${Math.random() * 20 + 10}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${Math.random() * 1 + 1}s`,
                    }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Single white logo - always visible */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-20 h-20 z-10">
                <Image
                  src="/Logos/logowhite.png"
                  alt="MEGG Logo"
                  fill
                  className="object-contain drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]"
                />
              </div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shine-slow"></div>
          </div>

          {/* Subtle shadow */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-black/10 blur-md rounded-full"></div>
        </div>

        {/* Generating Machine ID text */}
        <div className="text-center text-white mb-4">
          <h2 className="text-xl font-semibold">Generating Machine ID</h2>
          <p className="text-white/80 text-sm mt-1">{stageDescriptions[currentStage]}</p>
        </div>

        {/* Stage indicators */}
        <div className="flex justify-center gap-2 mb-3">
          {stageDescriptions.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentStage ? "bg-white scale-125" : index < currentStage ? "bg-white/80" : "bg-white/30"
              }`}
            ></div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  )
}

export default MachineLoading
