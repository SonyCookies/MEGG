"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Settings, LogIn, Plug, Globe, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
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
  const [hoverButton, setHoverButton] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [navigateTo, setNavigateTo] = useState("")
  const [loadingContext, setLoadingContext] = useState<LoadingContext>({
    title: "",
    icon: null,
    destination: "",
  })

  // Use the actual network contexts instead of local state
  const isOnline = useInternetConnection()
  const { readyState } = useWebSocket()

  // WebSocket connection status based on readyState
  const isWebSocketConnected = readyState === WebSocket.OPEN

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  const handleButtonClick = (route: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setNavigateTo(route)

    // Set loading context based on destination
    if (route === "/login") {
      setLoadingContext({
        title: "Accessing Login",
        icon: "login",
        destination: route,
      })
    } else if (route === "/setup") {
      setLoadingContext({
        title: "Preparing Setup",
        icon: "setup",
        destination: route,
      })
    }
  }

  const handleLoadingComplete = () => {
    setIsLoading(false)
    if (navigateTo) {
      router.push(navigateTo)
    }
  }

  return (
    <div className="min-h-screen bg-[#0e5f97] pt-6 px-4 pb-4 flex flex-col items-center relative overflow-hidden">
      {/* Network Disconnection Alert */}
      {(!isOnline || !isWebSocketConnected) && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md animate-fade-in-down">
          <div className="backdrop-blur-sm bg-white/90 rounded-xl shadow-2xl overflow-hidden border border-red-400/50 relative">
            {/* Holographic overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

            {/* Animated edge glow */}
            <div className="absolute inset-0 rounded-xl animate-border-glow-red"></div>

            <div className="px-4 py-3 flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500 tracking-wide">
                  Connection Lost
                </p>
                <p className="text-sm text-gray-600/90">
                  {!isOnline && !isWebSocketConnected
                    ? "Internet and WebSocket connections are unavailable"
                    : !isOnline
                      ? "Internet connection is unavailable"
                      : "WebSocket connection is unavailable"}
                </p>
              </div>
            </div>

            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8">
              <div className="absolute top-0 left-0 w-full h-full border-t-2 border-l-2 border-red-400/30 rounded-tl-xl"></div>
            </div>
            <div className="absolute top-0 right-0 w-8 h-8">
              <div className="absolute top-0 right-0 w-full h-full border-t-2 border-r-2 border-red-400/30 rounded-tr-xl"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-8 h-8">
              <div className="absolute bottom-0 left-0 w-full h-full border-b-2 border-l-2 border-red-400/30 rounded-bl-xl"></div>
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8">
              <div className="absolute bottom-0 right-0 w-full h-full border-b-2 border-r-2 border-red-400/30 rounded-br-xl"></div>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      <EggLoading isLoading={isLoading} onComplete={handleLoadingComplete} context={loadingContext} />

      {/* Dynamic background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0wIDMwaDMwdjMwSDB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwSDB2MzBoMzB6IiBzdHJva2U9InRnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwaDMwdjMwSDMweiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iLjUiLz48L2c+PC9zdmc+')] opacity-70"></div>

      {/* Main card */}
      <div
        className={`max-w-3xl w-full transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Card with glass morphism effect */}
        <div className="relative backdrop-blur-sm bg-white/90 rounded-2xl shadow-2xl overflow-hidden border border-white/50 h-[440px]">
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

          {/* Two-column layout - full height */}
          <div className="flex flex-col md:flex-row relative z-10 h-full">
            {/* Left column - Logo section with creative background */}
            <div className="md:w-1/2 p-4 flex items-center justify-center relative overflow-hidden h-full">
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
                <div className="mt-6 relative">
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
            </div>

            {/* Right column - Buttons section with creative background */}
            <div className="md:w-1/2 p-4 flex flex-col justify-center space-y-8 relative h-full">
              {/* Creative background elements */}
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-tl from-[#0e5f97]/20 to-transparent rounded-full blur-xl"></div>
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-br from-[#0e5f97]/30 to-transparent rounded-full blur-xl"></div>

              {/* Setup button with enhanced effects */}
              <a
                href={isOnline && isWebSocketConnected ? "/setup" : "#"}
                className={`block w-full ${!isOnline || !isWebSocketConnected ? "cursor-not-allowed" : "group"}`}
                onClick={isOnline && isWebSocketConnected ? handleButtonClick("/setup") : (e) => e.preventDefault()}
                onMouseEnter={() => isOnline && isWebSocketConnected && setHoverButton("setup")}
                onMouseLeave={() => setHoverButton(null)}
              >
                <div
                  className={`flex items-center gap-3 px-5 py-4 bg-white rounded-xl shadow-md border border-[#0e5f97]/10 ${
                    isOnline && isWebSocketConnected ? "group-hover:shadow-lg group-hover:scale-[1.02]" : "opacity-70"
                  } transition-all duration-300 w-full relative overflow-hidden`}
                >
                  {/* Background animation on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0e5f97]/0 via-[#0e5f97]/5 to-[#0e5f97]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full"></div>

                  {/* Icon container with enhanced effects */}
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#0e5f97]/10 rounded-full opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-150 transition-all duration-300"></div>
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0e5f97]/10 to-[#0e5f97]/5 flex items-center justify-center">
                      <Settings className="h-7 w-7 text-[#0e5f97] relative z-10 transform group-hover:rotate-90 transition-transform duration-500" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <span className="font-medium text-[#0e5f97] text-xl block">Setup New Machine</span>
                    <span className="text-sm text-[#0e5f97]/70 mt-1 block">Configure and register your device</span>
                  </div>

                  {/* Animated arrow */}
                  <div
                    className={`text-[#0e5f97]/70 transform transition-transform duration-300 ${
                      hoverButton === "setup" ? "translate-x-1" : ""
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </a>

              {/* Login button with enhanced effects */}
              <a
                href={isOnline && isWebSocketConnected ? "/login" : "#"}
                className={`block w-full ${!isOnline || !isWebSocketConnected ? "cursor-not-allowed" : "group"}`}
                onClick={isOnline && isWebSocketConnected ? handleButtonClick("/login") : (e) => e.preventDefault()}
                onMouseEnter={() => isOnline && isWebSocketConnected && setHoverButton("login")}
                onMouseLeave={() => setHoverButton(null)}
              >
                <div
                  className={`flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] rounded-xl shadow-md border border-white/10 ${
                    isOnline && isWebSocketConnected ? "group-hover:shadow-lg group-hover:scale-[1.02]" : "opacity-70"
                  } transition-all duration-300 w-full relative overflow-hidden`}
                >
                  {/* Enhanced background animation on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full"></div>

                  {/* Icon container with enhanced effects */}
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-150 transition-all duration-300"></div>
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                      <LogIn className="h-7 w-7 text-white relative z-10 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <span className="font-medium text-white text-xl block">Login to Machine</span>
                    <span className="text-sm text-white/70 mt-1 block">Access your device controls</span>
                  </div>

                  {/* Animated arrow */}
                  <div
                    className={`text-white/70 transform transition-transform duration-300 ${
                      hoverButton === "login" ? "translate-x-1" : ""
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Connectivity indicators - Better positioned */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            {/* WiFi Management Button - Left side */}
            <WiFiButton />

            {/* Other indicators - Right side */}
            <div className="flex items-center gap-2">
              {/* WebSocket indicator */}
              <div className="flex items-center gap-1.5 bg-white/80 px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                <Plug className="h-4 w-4 text-gray-600" />
                <div className={`w-2.5 h-2.5 rounded-full ${isWebSocketConnected ? "bg-green-500" : "bg-red-500"}`}>
                  <div
                    className={`w-full h-full rounded-full ${
                      isWebSocketConnected ? "animate-ping bg-green-400/50" : "bg-red-400/50"
                    }`}
                    style={{ animationDuration: "2s" }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 ml-1 font-medium">
                  {isWebSocketConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              {/* Internet indicator */}
              <div className="flex items-center gap-1.5 bg-white/80 px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                <Globe className="h-4 w-4 text-gray-600" />
                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}>
                  <div
                    className={`w-full h-full rounded-full ${
                      isOnline ? "animate-ping bg-green-400/50" : "bg-red-400/50"
                    }`}
                    style={{ animationDuration: "2s" }}
                  ></div>
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
