"use client"

import { useEffect, useState } from "react"
import { Cpu, Egg, QrCode, Zap } from "lucide-react"

interface MachineLoadingProps {
  isLoading: boolean
  onComplete?: () => void
  progress?: number
  currentStage?: number
}

export default function MachineLoading({ isLoading, onComplete, progress = 0, currentStage = 0 }: MachineLoadingProps) {
  const [internalProgress, setInternalProgress] = useState(0)

  // Use external progress if provided, otherwise use internal progress
  const displayProgress = progress > 0 ? progress : internalProgress
  const stage = currentStage >= 0 ? currentStage : Math.floor(displayProgress / 25)

  const stages = [
    { icon: Cpu, text: "Initializing system..." },
    { icon: Zap, text: "Generating secure keys..." },
    { icon: QrCode, text: "Creating machine ID..." },
    { icon: Egg, text: "Finalizing registration..." },
  ]

  useEffect(() => {
    if (!isLoading) {
      setInternalProgress(0)
      return
    }

    // Only use internal animation if no external progress is provided
    if (progress === 0) {
      let interval: NodeJS.Timeout

      if (isLoading && internalProgress < 100) {
        interval = setInterval(() => {
          setInternalProgress((prev) => {
            const newProgress = prev + 1

            // Update stages based on progress
            if (newProgress >= 100) {
              clearInterval(interval)
              if (onComplete) setTimeout(onComplete, 500)
            }
            return newProgress >= 100 ? 100 : newProgress
          })
        }, 30)
      }

      return () => {
        if (interval) clearInterval(interval)
      }
    } else if (progress >= 100 && onComplete) {
      // If external progress is complete, trigger onComplete
      setTimeout(onComplete, 500)
    }
  }, [isLoading, internalProgress, progress, onComplete])

  if (!isLoading) return null

  const CurrentIcon = stages[stage].icon

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-16">
      <div className="bg-white/90 rounded-2xl p-8 max-w-sm w-full shadow-xl border border-white/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

        {/* Progress bar */}
        <div className="h-2 w-full bg-gray-200 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${displayProgress}%` }}
          ></div>
        </div>

        {/* Animated egg with machine elements */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Animated rings */}
            <div
              className="absolute inset-[-8px] rounded-full border-2 border-[#0e5f97]/20 animate-ping-slow opacity-70"
              style={{ animationDuration: "2s" }}
            ></div>
            <div
              className="absolute inset-[-16px] rounded-full border-2 border-[#0e5f97]/10 animate-ping-slow opacity-50"
              style={{ animationDuration: "3s" }}
            ></div>

            {/* Egg shape with machine elements */}
            <div className="bg-gradient-to-br from-white to-[#f0f7ff] p-5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] shadow-lg border border-white/50 relative">
              <div className="absolute inset-0 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] bg-white/50 filter blur-md opacity-70"></div>

              {/* Animated icon */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div
                  className={`absolute inset-0 bg-[#0e5f97]/10 rounded-full ${stage === 3 ? "animate-ping-slow" : ""}`}
                ></div>
                <CurrentIcon className={`h-10 w-10 text-[#0e5f97] ${stage < 3 ? "animate-pulse" : "animate-float"}`} />
              </div>

              {/* Digital circuit pattern overlay */}
              <div className="absolute inset-0 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] overflow-hidden opacity-20">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                    linear-gradient(to right, #0e5f97 1px, transparent 1px),
                    linear-gradient(to bottom, #0e5f97 1px, transparent 1px)
                  `,
                    backgroundSize: "8px 8px",
                  }}
                ></div>

                {/* Animated data points */}
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-[#0e5f97] rounded-full"
                    style={{
                      top: `${20 + Math.random() * 60}%`,
                      left: `${20 + Math.random() * 60}%`,
                      opacity: 0.7,
                      animation: `pulse-subtle 1s infinite ${i * 0.2}s`,
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status text */}
        <h3 className="text-xl font-bold text-center text-[#0e5f97] mb-2">
          {displayProgress === 100 ? "Ready!" : "Generating Machine ID"}
        </h3>

        <p className="text-sm text-center text-[#0e5f97]/70">{stages[stage].text}</p>

        {/* Progress percentage */}
        <div className="mt-4 text-center text-xs font-mono text-[#0e5f97]/60">
          {Math.round(displayProgress)}% complete
        </div>
      </div>
    </div>
  )
}
