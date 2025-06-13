// app/page.tsx
"use client"

import React, { useEffect, useState, MouseEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Settings, LogIn, Plug, Globe } from "lucide-react"

import EggLoading from "./components/egg-loading"
import { useInternetConnection, useWebSocket } from "./contexts/NetworkContext"
import WiFiButton from "./components/wifi-button"

// Define proper types for the loading context
interface LoadingContext {
  title: string
  icon: string | null
  destination: string
}

export default function Home() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [ , setHoverButton] = useState<string | null>(null)

  // Page-level loader state
  const [isLoading, setIsLoading] = useState(false)
  const [loadingContext, setLoadingContext] = useState<LoadingContext>({
    title: "",
    icon: null,
    destination: "",
  })

  // Network status
  const isOnline = useInternetConnection()
  const { readyState } = useWebSocket()
  const isWebSocketConnected = readyState === WebSocket.OPEN

  // Entrance fade-in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Click handler: show the egg, then navigate immediately
  const handleButtonClick =
    (route: string) => (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()

      setLoadingContext({
        title: route === "/login" ? "Accessing Login" : "Preparing Setup",
        icon: route === "/login" ? "login" : "setup",
        destination: route,
      })
      setIsLoading(true)

      router.push(route)
    }

  // Hide the egg when its internal animation completes
  const handleLoadingComplete = () => {
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0e5f97] pt-6 px-4 pb-4 flex flex-col items-center relative overflow-hidden">
      {/* Egg-loading overlay */}
      <EggLoading
        isLoading={isLoading}
        onComplete={handleLoadingComplete}
        context={loadingContext}
      />

      {/* Dynamic background */}
      <div
        className="absolute inset-0 bg-[url('data:image/svg+xml;base64,...')] opacity-70"
      />

      {/* Main card */}
      <div
        className={`max-w-3xl w-full transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="relative backdrop-blur-sm bg-white/90 rounded-2xl shadow-2xl overflow-hidden border border-white/50 h-[440px]">
          {/* Holographic overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay" />

          {/* Animated edge glow */}
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl animate-border-glow" />
          </div>

          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            />
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col md:flex-row relative z-10 h-full">
            {/* Left column */}
            <div className="md:w-1/2 p-4 flex items-center justify-center relative overflow-hidden h-full">
              {/* Creative background blobs */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-[#0e5f97]/20 to-transparent rounded-full blur-xl" />
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-tl from-[#0e5f97]/30 to-transparent rounded-full blur-xl" />

              <div className="flex flex-col items-center relative z-10">
                {/* Egg-shaped logo container */}
                <div className="relative group">
                  <div
                    className="absolute inset-0 rounded-full border-2 border-[#0e5f97]/20 animate-ping-slow opacity-70"
                    style={{ animationDuration: "3s" }}
                  />
                  <div
                    className="absolute inset-[-8px] rounded-full border-2 border-[#0e5f97]/10 animate-ping-slow opacity-50"
                    style={{ animationDuration: "4s" }}
                  />
                  <div className="relative bg-gradient-to-br from-white to-[#f0f7ff] p-5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] shadow-lg border border-white/50 transform hover:rotate-6 transition-transform duration-500">
                    <div className="absolute inset-0 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] bg-white/50 filter blur-md group-hover:blur-xl transition-all duration-500 opacity-70 group-hover:opacity-90" />
                    <div className="relative w-24 h-24 overflow-hidden">
                      <Image
                        src="/Logos/logoblue.png"
                        alt="MEGG Logo"
                        width={96}
                        height={96}
                        className="object-contain transform group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shine" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-black/5 blur-md rounded-full" />
                  </div>
                </div>

                {/* Brand name */}
                <div className="mt-6 text-center">
                  <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] animate-text-shimmer">
                    MEGG
                  </h1>
                  <p className="text-sm mt-1 font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#0e5f97]/70 to-[#0c4d7a]/70">
                    Machine Egg Grading System
                  </p>
                  <div className="flex justify-center gap-1.5 mt-2">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a]"
                        style={{
                          animation: "pulse-scale 1.5s infinite ease-in-out",
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2 w-[2px] z-20">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0e5f97]/30 to-transparent" />
            </div>

            {/* Right column */}
            <div className="md:w-1/2 p-4 flex flex-col justify-center space-y-8 relative h-full">
              {/* Setup button */}
              <a
                href={isOnline && isWebSocketConnected ? "/setup" : "#"}
                className={`block w-full ${!isOnline || !isWebSocketConnected ? "cursor-not-allowed" : "group"}`}
                onClick={isOnline && isWebSocketConnected ? handleButtonClick("/setup") : (e) => e.preventDefault()}
                onMouseEnter={() => isOnline && isWebSocketConnected && setHoverButton("setup")}
                onMouseLeave={() => setHoverButton(null)}
              >
                <div className={`flex items-center gap-3 px-5 py-4 bg-white rounded-xl shadow-md border border-[#0e5f97]/10 ${isOnline && isWebSocketConnected ? "group-hover:shadow-lg group-hover:scale-[1.02]" : "opacity-70"} transition-all duration-300 relative overflow-hidden`}>
                  {/* inner markup unchanged */}
                  <Settings className="h-7 w-7 text-[#0e5f97]" />
                  <span className="font-medium text-[#0e5f97] text-xl">Setup New Machine</span>
                </div>
              </a>

              {/* Login button */}
              <a
                href={isOnline && isWebSocketConnected ? "/login" : "#"}
                className={`block w-full ${!isOnline || !isWebSocketConnected ? "cursor-not-allowed" : "group"}`}
                onClick={isOnline && isWebSocketConnected ? handleButtonClick("/login") : (e) => e.preventDefault()}
                onMouseEnter={() => isOnline && isWebSocketConnected && setHoverButton("login")}
                onMouseLeave={() => setHoverButton(null)}
              >
                <div className={`flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] rounded-xl shadow-md border border-white/10 ${isOnline && isWebSocketConnected ? "group-hover:shadow-lg group-hover:scale-[1.02]" : "opacity-70"} transition-all duration-300 relative overflow-hidden`}>
                  {/* inner markup unchanged */}
                  <LogIn className="h-7 w-7 text-white" />
                  <span className="font-medium text-white text-xl">Login to Machine</span>
                </div>
              </a>
            </div>
          </div>

          {/* Connectivity indicators */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <WiFiButton />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white/80 px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                <Plug className="h-4 w-4 text-gray-600" />
                <div className={`w-2.5 h-2.5 rounded-full ${isWebSocketConnected ? "bg-green-500" : "bg-red-500"}`}>
                  <div className={`w-full h-full rounded-full ${isWebSocketConnected ? "animate-ping bg-green-400/50" : "bg-red-400/50"}`} style={{ animationDuration: "2s" }} />
                </div>
                <span className="text-xs text-gray-600 ml-1 font-medium">{isWebSocketConnected ? "Connected" : "Disconnected"}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                <Globe className="h-4 w-4 text-gray-600" />
                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}>
                  <div className={`w-full h-full rounded-full ${isOnline ? "animate-ping bg-green-400/50" : "bg-red-400/50"}`} style={{ animationDuration: "2s" }} />
                </div>
                <span className="text-xs text-gray-600 ml-1 font-medium">{isOnline ? "Online" : "Offline"}</span>
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
            0% {
              transform: scale(1);
              opacity: 0.8;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.4;
            }
            100% {
              transform: scale(1);
              opacity: 0.8;
            }
          }

          @keyframes shine {
            0% {
              transform: translateX(-100%);
            }
            20%,
            100% {
              transform: translateX(100%);
            }
          }

          @keyframes text-shimmer {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }

          @keyframes border-glow {
            0%,
            100% {
              box-shadow: 0 0 5px rgba(14, 95, 151, 0.3),
                0 0 10px rgba(14, 95, 151, 0.2), 0 0 15px rgba(14, 95, 151, 0.1);
            }
            50% {
              box-shadow: 0 0 10px rgba(14, 95, 151, 0.5),
                0 0 20px rgba(14, 95, 151, 0.3), 0 0 30px rgba(14, 95, 151, 0.2);
            }
          }
          
          @keyframes border-glow-red {
            0%,
            100% {
              box-shadow: 0 0 5px rgba(220, 38, 38, 0.3),
                0 0 10px rgba(220, 38, 38, 0.2), 0 0 15px rgba(220, 38, 38, 0.1);
            }
            50% {
              box-shadow: 0 0 10px rgba(220, 38, 38, 0.5),
                0 0 20px rgba(220, 38, 38, 0.3), 0 0 30px rgba(220, 38, 38, 0.2);
            }
          }

          @keyframes float {
            0%,
            100% {
              transform: translate(0, 0);
            }
            50% {
              transform: translate(10px, -10px);
            }
          }

          @keyframes float-slow {
            0%,
            100% {
              transform: translate(0, 0) rotate(0deg);
            }
            50% {
              transform: translate(5px, -5px) rotate(10deg);
            }
          }

          @keyframes float-slow-reverse {
            0%,
            100% {
              transform: translate(0, 0) rotate(0deg);
            }
            50% {
              transform: translate(-5px, -5px) rotate(-10deg);
            }
          }

          @keyframes pulse-scale {
            0%,
            100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.5);
              opacity: 0.6;
            }
          }

          @keyframes pulse-grow {
            0%,
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.3;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.1);
              opacity: 0.1;
            }
          }

          @keyframes travel-y {
            0%,
            100% {
              top: 10%;
            }
            50% {
              top: 90%;
            }
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

          @keyframes fade-in-down {
            from {
              opacity: 0;
              transform: translate(-50%, -20px);
            }
            to {
              opacity: 1;
              transform: translate(-50%, 0);
            }
          }

          .animate-fade-in-down {
            animation: fade-in-down 0.5s ease-out forwards;
          }
        `}</style>
      </div>
    )
  }
