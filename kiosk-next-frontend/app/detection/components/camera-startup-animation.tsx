"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Camera } from "lucide-react"

interface CameraStartupAnimationProps {
  isLoading: boolean
  onComplete: () => void
  progress?: number
}

const CameraStartupAnimation: React.FC<CameraStartupAnimationProps> = ({ isLoading, onComplete, progress }) => {
  const [animationProgress, setAnimationProgress] = useState(0)

  useEffect(() => {
    if (isLoading) {
      // If no progress is provided, simulate progress
      if (progress === undefined) {
        const interval = setInterval(() => {
          setAnimationProgress((prev) => {
            // Slow down as we approach 100%
            const increment = Math.max(0.5, (100 - prev) / 20)
            const newProgress = Math.min(99, prev + increment)

            return newProgress
          })
        }, 100)

        // Simulate loading time
        const timer = setTimeout(() => {
          clearInterval(interval)
          setAnimationProgress(100)
          setTimeout(onComplete, 500) // Small delay after reaching 100%
        }, 2000)

        return () => {
          clearTimeout(timer)
          clearInterval(interval)
        }
      } else {
        // Use provided progress
        setAnimationProgress(progress)
        if (progress >= 100) {
          const timer = setTimeout(onComplete, 500)
          return () => clearTimeout(timer)
        }
      }
    }
  }, [isLoading, onComplete, progress])

  if (!isLoading) {
    return null
  }

  // Calculate the fill height based on progress
  const fillHeight = `${animationProgress}%`

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        {/* Egg container */}
        <div className="relative">
          {/* Pulsing rings */}
          <div
            className="absolute inset-[-12px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-[#ffffff]/20 animate-ping-slow"
            style={{ animationDuration: "3s" }}
          ></div>
          <div
            className="absolute inset-[-6px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-[#ffffff]/30 animate-ping-slow"
            style={{ animationDuration: "2s" }}
          ></div>

          {/* Main egg shape */}
          <div className="relative w-32 h-40 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] bg-white/90 shadow-lg overflow-hidden">
            {/* Fill animation */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0e5f97] to-[#0e5f97]/80 transition-all duration-300 ease-out"
              style={{ height: fillHeight }}
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
            </div>

            {/* Camera icon in the center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-20 h-20 z-10 flex items-center justify-center">
                <div className="bg-white/30 backdrop-blur-sm p-3 rounded-full">
                  <Camera className="w-10 h-10 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]" />
                </div>
              </div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shine-slow"></div>
          </div>

          {/* Subtle shadow */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-black/10 blur-md rounded-full"></div>
        </div>

        {/* Loading text */}
        <div className="mt-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Initializing Camera</h3>
          <p className="text-white/80">Please wait...</p>

          {/* Progress bar */}
          <div className="mt-4 w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0e5f97] to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${animationProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CameraStartupAnimation
