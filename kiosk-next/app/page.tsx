"use client"
import Link from "next/link"
import Image from "next/image"
import { Settings, LogIn, Egg } from "lucide-react"
import { useEffect, useState } from "react"

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hoverButton, setHoverButton] = useState(null)

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0e5f97] pt-6 px-4 pb-4 flex flex-col items-center relative overflow-hidden">
      {/* Dynamic background with floating particles */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0wIDMwaDMwdjMwSDB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwSDB2MzBoMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwaDMwdjMwSDMweiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iLjUiLz48L2c+PC9zdmc+')] opacity-70"></div>

      {/* Main card */}
      <div
        className={`max-w-3xl w-full transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        {/* Card with glass morphism effect */}
        <div className="relative backdrop-blur-sm bg-white/90 rounded-2xl shadow-2xl overflow-hidden border border-white/50">
          {/* Holographic overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

          {/* Animated edge glow */}
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl animate-border-glow"></div>
          </div>

          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            ></div>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col md:flex-row relative z-10">
            {/* Left column - Logo section with creative background */}
            <div className="md:w-1/2 p-6 flex items-center justify-center relative overflow-hidden">
              {/* Creative background elements */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-[#0e5f97]/20 to-transparent rounded-full blur-xl"></div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-tl from-[#0e5f97]/30 to-transparent rounded-full blur-xl"></div>

              <div className="flex flex-col items-center relative z-10">
                {/* Egg-shaped container for logo with enhanced effects */}
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

                  {/* Egg shape with enhanced 3D effect */}
                  <div className="relative bg-gradient-to-br from-white to-[#f0f7ff] p-5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] shadow-lg border border-white/50 transform hover:rotate-6 transition-transform duration-500 group">
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] bg-white/50 filter blur-md group-hover:blur-xl transition-all duration-500 opacity-70 group-hover:opacity-90"></div>

                    {/* Logo with shine effect */}
                    <div className="relative w-24 h-24 overflow-hidden">
                      <Image
                        src="/Logos/logoblue.png"
                        alt="MEGG Logo"
                        width={96}
                        height={96}
                        className="object-contain transform group-hover:scale-110 transition-transform duration-500"
                      />

                      {/* Enhanced animated shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shine"></div>
                    </div>

                    {/* Subtle shadow under logo */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-black/5 blur-md rounded-full"></div>
                  </div>
                </div>

                {/* Brand name with enhanced creative animation */}
                <div className="mt-4 relative">
                  <h1 className="text-5xl text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] tracking-wider animate-text-shimmer">
                    MEGG
                  </h1>

                  {/* Subtitle with gradient */}
                  <p className="text-sm text-center mt-1 font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#0e5f97]/70 to-[#0c4d7a]/70">
                    Machine Egg Grading System
                  </p>

                  {/* Animated dots with enhanced effect */}
                  <div className="flex justify-center gap-1.5 mt-2">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a]"
                        style={{
                          animation: "pulse-scale 1.5s infinite ease-in-out",
                          animationDelay: `${i * 0.2}s`,
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Creative divider between columns */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2 w-[2px] z-20">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0e5f97]/30 to-transparent"></div>

              {/* Center emblem */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-[#0e5f97] to-[#0c4d7a] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(14,95,151,0.6)] z-30">
                <Egg className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Right column - Buttons section with creative background */}
            <div className="md:w-1/2 p-6 flex flex-col justify-center space-y-5 relative">
              {/* Creative background elements */}
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-tl from-[#0e5f97]/20 to-transparent rounded-full blur-xl"></div>
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-br from-[#0e5f97]/30 to-transparent rounded-full blur-xl"></div>

              {/* Setup button with enhanced effects */}
              <Link
                href="/setup"
                className="block w-full group"
                onMouseEnter={() => setHoverButton("setup")}
                onMouseLeave={() => setHoverButton(null)}
              >
                <div className="flex items-center gap-4 px-6 py-4 bg-white rounded-xl shadow-md border border-[#0e5f97]/10 group-hover:shadow-lg group-hover:scale-[1.02] transition-all duration-300 w-full relative overflow-hidden">
                  {/* Background animation on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0e5f97]/0 via-[#0e5f97]/5 to-[#0e5f97]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full"></div>

                  {/* Icon container with enhanced effects */}
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#0e5f97]/10 rounded-full opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-150 transition-all duration-300"></div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0e5f97]/10 to-[#0e5f97]/5 flex items-center justify-center">
                      <Settings className="h-6 w-6 text-[#0e5f97] relative z-10 transform group-hover:rotate-90 transition-transform duration-500" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <span className="font-medium text-[#0e5f97] text-lg block">Setup New Machine</span>
                    <span className="text-xs text-[#0e5f97]/70 mt-0.5 block">Configure and register your device</span>
                  </div>

                  {/* Animated arrow */}
                  <div
                    className={`text-[#0e5f97]/70 transform transition-transform duration-300 ${hoverButton === "setup" ? "translate-x-1" : ""}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </Link>

              {/* Login button with enhanced effects */}
              <Link
                href="/login"
                className="block w-full group"
                onMouseEnter={() => setHoverButton("login")}
                onMouseLeave={() => setHoverButton(null)}
              >
                <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] rounded-xl shadow-md border border-white/10 group-hover:shadow-lg group-hover:scale-[1.02] transition-all duration-300 w-full relative overflow-hidden">
                  {/* Enhanced background animation on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full"></div>

                  {/* Icon container with enhanced effects */}
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-150 transition-all duration-300"></div>
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <LogIn className="h-6 w-6 text-white relative z-10 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <span className="font-medium text-white text-lg block">Login to Machine</span>
                    <span className="text-xs text-white/70 mt-0.5 block">Access your device controls</span>
                  </div>

                  {/* Animated arrow */}
                  <div
                    className={`text-white/70 transform transition-transform duration-300 ${hoverButton === "login" ? "translate-x-1" : ""}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </Link>

              {/* Decorative element */}
              <div className="absolute bottom-3 right-3 opacity-30">
                <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M50 0C22.4 0 0 22.4 0 50C0 77.6 22.4 100 50 100C77.6 100 100 77.6 100 50C100 22.4 77.6 0 50 0ZM50 90C27.9 90 10 72.1 10 50C10 27.9 27.9 10 50 10C72.1 10 90 27.9 90 50C90 72.1 72.1 90 50 90Z"
                    fill="#0e5f97"
                    fillOpacity="0.2"
                  />
                  <path
                    d="M50 20C33.4 20 20 33.4 20 50C20 66.6 33.4 80 50 80C66.6 80 80 66.6 80 50C80 33.4 66.6 20 50 20ZM50 70C39 70 30 61 30 50C30 39 39 30 50 30C61 30 70 39 70 50C70 61 61 70 50 70Z"
                    fill="#0e5f97"
                    fillOpacity="0.2"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Decorative corner accents with enhanced design */}
          <div className="absolute top-0 left-0 w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-t-2 border-l-2 border-[#0e5f97]/30 rounded-tl-2xl"></div>
            <div className="absolute top-2 left-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16">
            <div className="absolute top-0 right-0 w-full h-full border-t-2 border-r-2 border-[#0e5f97]/30 rounded-tr-2xl"></div>
            <div className="absolute top-2 right-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-16 h-16">
            <div className="absolute bottom-0 left-0 w-full h-full border-b-2 border-l-2 border-[#0e5f97]/30 rounded-bl-2xl"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 right-0 w-16 h-16">
            <div className="absolute bottom-0 right-0 w-full h-full border-b-2 border-r-2 border-[#0e5f97]/30 rounded-br-2xl"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
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
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(10px, -10px); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(5px, -5px) rotate(10deg); }
        }
        
        @keyframes float-slow-reverse {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-5px, -5px) rotate(-10deg); }
        }
        
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.6; }
        }
        
        @keyframes pulse-grow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.1; }
        }
        
        @keyframes travel-y {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
        
        .animate-text-shimmer {
          background-size: 200% auto;
          animation: text-shimmer 5s infinite linear;
        }
        
        .animate-shine {
          animation: shine 2s infinite;
        }
        
        .animate-float {
          animation: float 10s infinite ease-in-out;
        }
        
        .animate-pulse-grow {
          animation: pulse-grow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  )
}
