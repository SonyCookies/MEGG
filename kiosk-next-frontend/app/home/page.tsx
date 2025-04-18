"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Wifi, WifiOff, Plug, PlugIcon as PlugOff, Sun, Moon } from "lucide-react"
import { useWebSocket, useInternetConnection } from "../contexts/NetworkContext"
import StatusIndicator from "./components/status-indicator"
import NavigationCard from "./components/navigation-card"

export default function Home() {
  const { readyState } = useWebSocket()
  const isOnline = useInternetConnection()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isDaytime, setIsDaytime] = useState(true)

  // Update time every minute
  useEffect(() => {
    const updateTimeAndDayStatus = () => {
      const now = new Date()
      setCurrentTime(now)

      // Check if it's daytime (between 6 AM and 6 PM)
      const hours = now.getHours()
      setIsDaytime(hours >= 6 && hours < 18)
    }

    // Initial call
    updateTimeAndDayStatus()

    const timer = setInterval(updateTimeAndDayStatus, 60000)

    return () => clearInterval(timer)
  }, [])

  // Add keyframes to the document
  useEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = `
      @keyframes scanline {
        0% {
          transform: translateY(-100%);
        }
        100% {
          transform: translateY(100%);
        }
      }

      @keyframes flicker {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })

  // Navigation card data
  const navigationCards = [
    {
      href: "/detection",
      icon: "/Icons/camera-focus.gif",
      title: "Detection",
      accentPosition: "top" as const,
    },
    {
      href: "/settings",
      icon: "/Icons/settings.gif",
      title: "Settings",
      accentPosition: "right" as const,
    },
    {
      href: "/account",
      icon: "/Icons/user.gif",
      title: "Account",
      accentPosition: "bottom" as const,
    },
  ]

  return (
    <div className="h-screen overflow-hidden bg-[#0e5f97] p-3 sm:p-4 md:p-6 relative">
    {/* Background pattern */}
      <BackgroundElements />

      <div className="max-w-3xl mx-auto relative">
        {/* Header with logo, time and status indicators */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 mb-4 sm:mb-6 text-white">
          <div className="flex items-center gap-3 group my-2 sm:my-0">
            <div className="h-10 w-auto relative">
              <div className="absolute inset-0 bg-white rounded opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/10 to-transparent rounded blur-sm transform scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <Image
                src="/Logos/logoblue.png"
                alt="Megg Logo"
                width={40}
                height={40}
                className="h-full w-auto object-contain p-1 rounded relative z-10"
              />
            </div>
            <h1 className="text-2xl font-bold">megg</h1>
          </div>

          {/* Time and status indicators */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Status indicators */}
            <div className="flex items-center gap-3">
              <StatusIndicator
                isActive={isOnline}
                activeIcon={<Wifi className="w-4 h-4 text-green-400 relative z-10" />}
                inactiveIcon={<WifiOff className="w-4 h-4 text-red-400 relative z-10" />}
              />
              <StatusIndicator
                isActive={readyState === WebSocket.OPEN}
                activeIcon={<Plug className="w-4 h-4 text-green-400 relative z-10" />}
                inactiveIcon={<PlugOff className="w-4 h-4 text-red-400 relative z-10" />}
              />
            </div>

            {/* Time with sun/moon icon */}
            <div className="text-xl font-medium bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg relative overflow-hidden group flex items-center gap-2">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-300/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div
                className={`relative z-10 transition-all duration-500 ${isDaytime ? "text-yellow-300" : "text-blue-200"}`}
              >
                {isDaytime ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </div>

              <span className="relative z-10">{formattedTime}</span>
            </div>
          </div>
        </header>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {navigationCards.map((card, index) => (
            <NavigationCard
              key={index}
              href={card.href}
              icon={card.icon}
              title={card.title}
              accentPosition={card.accentPosition}
            />
          ))}
        </div>

        {/* Promotional Banner */}
        <PromotionalBanner />
      </div>
    </div>
  )
}

// Extracted components
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

function PromotionalBanner() {
  return (
    <div className="bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] rounded-lg shadow-l p-2 mb-4 relative overflow-hidden group">
      {/* Dynamic background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated egg shapes */}
        <div
          className="absolute top-1/4 right-1/4 w-40 h-56 bg-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] blur-xl animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-0 left-1/3 w-32 h-40 bg-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] blur-xl animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "1s" }}
        ></div>

        {/* Egg pattern grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9InN2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMzAgMTVjLTguMjg0IDAtMTUgMTAuNzUtMTUgMjRzMTAuNzUgMTggMjQgMThzMTgtMTAuNzUgMTgtMjRTMzcuMjg0IDE1IDM3IDE1SDMweiIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjEiLz48L2c+PC9zdmc+')] opacity-10 transform rotate-12 scale-150"></div>

        {/* Light beams */}
        <div className="absolute -top-20 left-1/2 w-1 h-40 bg-gradient-to-b from-cyan-300/40 to-transparent blur-md transform -translate-x-1/2 rotate-15"></div>
        <div className="absolute -top-20 left-1/3 w-1 h-40 bg-gradient-to-b from-cyan-300/20 to-transparent blur-md transform -translate-x-1/2 -rotate-15"></div>

        {/* Subtle cyan accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent"></div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 relative z-10">
        {/* Content side */}
        <div className="text-white relative text-center md:text-left">
          <h3 className="text-xl font-medium mb-2">Megg Detection System</h3>
          <p className="text-white/80 mb-3">Egg detection powered by AI</p>
        </div>

        {/* Logo display */}
        <div className="relative mx-auto md:mx-0">
          {/* Egg-shaped container with 3D effect */}
          <div className="relative w-24 sm:w-28 h-32 sm:h-36 flex items-center justify-center">
            {/* Layered egg shapes for 3D effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] rotate-12 backdrop-blur-sm border border-white/20 shadow-lg transform transition-transform group-hover:rotate-6 group-hover:scale-105 duration-500"></div>
            <div className="absolute inset-2 bg-gradient-to-tr from-white/20 to-white/10 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] rotate-12 backdrop-blur-sm border border-white/10"></div>

            {/* Logo container */}
            <div className="relative p-2 transform -rotate-6 transition-transform group-hover:rotate-0 duration-500">
              <div className="relative w-20 h-20 overflow-hidden">
                <Image src="/Logos/logowhite.png" alt="Megg Logo" width={80} height={80} className="object-contain" />

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
              </div>
            </div>

            {/* Small decorative eggs */}
            <div
              className="absolute -bottom-2 -left-4 w-8 h-10 bg-gradient-to-br from-cyan-300/30 to-white/10 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] rotate-12 blur-sm animate-pulse"
              style={{ animationDuration: "3s" }}
            ></div>
            <div
              className="absolute -top-2 -right-2 w-6 h-8 bg-gradient-to-br from-cyan-300/20 to-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] -rotate-12 blur-sm animate-pulse"
              style={{ animationDuration: "4s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}
