// components/egg-loading.tsx

"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"

interface LoadingContext {
  title: string
  icon: string | null
  destination: string
}

interface EggLoadingProps {
  isLoading: boolean
  onComplete: () => void
  context: LoadingContext
  progress?: number
}

const EggLoading: React.FC<EggLoadingProps> = React.memo(
  ({ isLoading, onComplete, progress }) => {
    const [pct, setPct] = useState(0)

    useEffect(() => {
      if (!isLoading) return

      if (progress !== undefined) {
        setPct(progress)
        if (progress >= 100) {
          const t = setTimeout(onComplete, 500)
          return () => clearTimeout(t)
        }
        return
      }

      let startTs: number
      function step(ts: number) {
        startTs ??= ts
        const elapsed = ts - startTs
        const next = Math.min(99, (elapsed / 2000) * 100)
        setPct(next)
        if (next < 99) {
          requestAnimationFrame(step)
        } else {
          setPct(100)
          setTimeout(onComplete, 500)
        }
      }
      requestAnimationFrame(step)
    }, [isLoading, onComplete, progress])

    if (!isLoading) return null

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
        <div className="flex flex-col items-center">
          <div className="relative">
            {/* Pulsing rings */}
            <div
              className="absolute inset-[-12px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-white/20 animate-ping-slow"
              style={{ animationDuration: "3s" }}
            />
            <div
              className="absolute inset-[-6px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-white/30 animate-ping-slow"
              style={{ animationDuration: "2s" }}
            />

            {/* Main egg container */}
            <div className="relative w-32 h-40 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] bg-white/90 shadow-lg overflow-hidden">
              {/* Fill — original height animation, with will-change hint */}
              <div
                className="absolute bottom-0 left-0 right-0 transition-all duration-300 ease-out bg-gradient-to-t from-[#0e5f97] to-[#0e5f97]/80 will-change-[height]"
                style={{ height: `${pct}%` }}
              />

              {/* Logo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-20 h-20 z-10">
                  <Image
                    src="/Logos/logowhite.png"
                    alt="MEGG Logo"
                    fill
                    priority
                    className="object-contain drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]"
                  />
                </div>
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shine-slow" />
            </div>

            {/* Subtle shadow */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-black/10 blur-md rounded-full" />
          </div>
        </div>
      </div>
    )
  }
)

EggLoading.displayName = "EggLoading";


export default EggLoading
