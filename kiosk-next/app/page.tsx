"use client"
import Link from "next/link"
import Image from "next/image"
import { Settings, LogIn } from "lucide-react"
import { useEffect, useState } from "react"

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0e5f97] pt-12 px-4 pb-4 flex flex-col items-center relative overflow-hidden">
      {/* Dynamic background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0wIDMwaDMwdjMwSDB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwSDB2MzBoMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwaDMwdjMwSDMweiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iLjUiLz48L2c+PC9zdmc+')] opacity-70"></div>

      {/* Main card */}
      <div
        className={`max-w-md w-full transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        {/* Card with glass morphism effect */}
        <div className="relative backdrop-blur-sm bg-white/90 rounded-2xl shadow-2xl overflow-hidden border border-white/50">
          {/* Holographic overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

          {/* Animated edge glow */}
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl animate-border-glow"></div>
          </div>

          {/* Logo section with floating effect */}
          <div className="pt-10 pb-6 px-8 relative z-10">
            <div className="flex flex-col items-center">
              {/* Egg-shaped container for logo */}
              <div className="relative">
                {/* Animated rings */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-[#0e5f97]/20 animate-ping-slow opacity-70"
                  style={{ animationDuration: "3s" }}
                ></div>
                <div
                  className="absolute inset-[-8px] rounded-full border-2 border-[#0e5f97]/10 animate-ping-slow opacity-50"
                  style={{ animationDuration: "4s" }}
                ></div>

                {/* Egg shape with 3D effect */}
                <div className="relative bg-gradient-to-br from-white to-[#f0f7ff] p-5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] shadow-lg border border-white/50 transform hover:rotate-6 transition-transform duration-500 group">
                  {/* Logo with shine effect */}
                  <div className="relative w-24 h-24 overflow-hidden">
                    <Image
                      src="/Logos/logoblue.png"
                      alt="MEGG Logo"
                      width={96}
                      height={96}
                      className="object-contain transform group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Animated shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shine"></div>
                  </div>

                  {/* Subtle shadow under logo */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-black/5 blur-md rounded-full"></div>
                </div>
              </div>

              {/* Brand name with creative animation */}
              <div className="mt-6 relative">
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] tracking-wider animate-text-shimmer">
                  MEGG
                </h1>

                {/* Animated dots */}
                <div className="flex justify-center gap-1 mt-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#0e5f97]"
                      style={{
                        animation: "pulse 1.5s infinite ease-in-out",
                        animationDelay: `${i * 0.2}s`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Creative Yin-Yang style button layout */}
          <div className="relative z-10 px-8 pb-8">
            <div className="relative h-[180px] rounded-xl overflow-hidden">
              {/* Dividing curve */}
              <div className="absolute inset-0 z-10">
                <div className="absolute w-[200%] h-[200%] bg-white rounded-[50%] top-[25%] left-[-50%] shadow-md"></div>
                <div className="absolute w-[200%] h-[200%] bg-[#0e5f97] rounded-[50%] bottom-[25%] right-[-50%] shadow-md"></div>
              </div>

              {/* Setup button (top) */}
              <Link
                href="/setup"
                className="absolute top-0 left-0 right-0 h-1/2 flex items-center justify-center z-20 group"
              >
                <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-full shadow-md border border-[#0e5f97]/10 group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#0e5f97]/10 rounded-full opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-150 transition-all duration-300"></div>
                    <Settings className="h-6 w-6 text-[#0e5f97] relative z-10 transform group-hover:rotate-90 transition-transform duration-500" />
                  </div>
                  <span className="font-medium text-[#0e5f97]">Setup New Machine</span>
                </div>
              </Link>

              {/* Login button (bottom) - Fixed hover effect positioning */}
              <Link
                href="/login"
                className="absolute bottom-0 left-0 right-0 h-1/2 flex items-center justify-center z-20 group"
              >
                <div className="flex items-center gap-3 px-5 py-3 bg-[#0e5f97] rounded-full shadow-md border border-white/10 group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                  <div className="relative flex items-center justify-center">
                    {/* Fixed positioning of the hover effect */}
                    <div className="absolute inset-0 w-full h-full bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-150 transition-all duration-300"></div>
                    <LogIn className="h-6 w-6 -left-1 text-white relative z-10 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                  <span className="font-medium text-white">Login to Machine</span>
                </div>
              </Link>

              {/* Central dot - keeping only this one */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0e5f97] z-30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white"></div>
              </div>
            </div>
          </div>

          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#0e5f97]/30 rounded-tl-2xl"></div>
          <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-[#0e5f97]/30 rounded-tr-2xl"></div>
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-[#0e5f97]/30 rounded-bl-2xl"></div>
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#0e5f97]/30 rounded-br-2xl"></div>
        </div>
      </div>

      {/* Add keyframes for animations */}
      <style jsx global>{`
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 0.4; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); }
          20%, 100% { transform: translateX(100%); }
        }
        
        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        @keyframes border-glow {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(14, 95, 151, 0.3),
                        0 0 10px rgba(14, 95, 151, 0.2),
                        0 0 15px rgba(14, 95, 151, 0.1);
          }
          50% { 
            box-shadow: 0 0 10px rgba(14, 95, 151, 0.5),
                        0 0 20px rgba(14, 95, 151, 0.3),
                        0 0 30px rgba(14, 95, 151, 0.2);
          }
        }
        
        .animate-text-shimmer {
          background-size: 200% auto;
          animation: text-shimmer 5s infinite linear;
        }
        
        .animate-shine {
          animation: shine 2s infinite;
        }
      `}</style>
    </div>
  )
}
