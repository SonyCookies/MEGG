// app/page.tsx
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Wifi,
  WifiOff,
  Plug,
  PlugIcon as PlugOff,
  Sun,
  Moon,
} from "lucide-react"
import { useWebSocket, useInternetConnection } from "../contexts/NetworkContext"
import StatusIndicator from "./components/status-indicator"
import NavigationCard from "./components/navigation-card"
import EggLoading from "../components/egg-loading"

export default function Home() {
  const router = useRouter()
  const { readyState } = useWebSocket()
  const isOnline = useInternetConnection()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [isDaytime, setIsDaytime] = useState(true)

  // navigation + loading state
  const [isNavigating, setIsNavigating] = useState(false)
  const [navigationContext, setNavigationContext] = useState({
    title: "",
    icon: "",
    destination: "",
  })

  // update clock & daytime flag every minute
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setCurrentTime(now)
      const h = now.getHours()
      setIsDaytime(h >= 6 && h < 18)
    }
    update()
    const timer = setInterval(update, 60_000)
    return () => clearInterval(timer)
  }, [])

  // inject keyframes once, cleanup returns void
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      @keyframes scanline {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100%); }
      }
      @keyframes flicker {
        0%,100% { opacity: 0.8; }
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

  const navigationCards = [
    { href: "/detection", icon: "/Icons/camera-focus.gif", title: "Detection", accentPosition: "top" as const },
    { href: "/settings",  icon: "/Icons/settings.gif",      title: "Settings",  accentPosition: "right" as const },
    { href: "/account",   icon: "/Icons/user.gif",          title: "Account",   accentPosition: "bottom" as const },
  ]

  // show egg + immediately navigate
  const handleNavigation = (href: string, title: string, icon: string) => {
    setNavigationContext({ title, icon, destination: href })
    setIsNavigating(true)
    router.push(href)
  }

  // hide egg when its internal animation completes
  const completeNavigation = () => {
    setIsNavigating(false)
  }

  return (
    <div className="h-screen overflow-hidden bg-[#0e5f97] p-3 sm:p-4 md:p-6 relative">
      {/* egg-loading overlay */}
      <EggLoading
        isLoading={isNavigating}
        onComplete={completeNavigation}
        context={navigationContext}
      />

      {/* background pattern & elements */}
      <BackgroundElements />

      <div className="max-w-3xl mx-auto relative">
        {/* header */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6 text-white">
          <div className="flex items-center gap-3 group">
            <div className="h-10 w-auto relative">
              <div className="absolute inset-0 bg-white rounded opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/10 to-transparent rounded blur-sm transform scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <Image
                src="/Logos/logoblue.png"
                alt="Megg Logo"
                width={40}
                height={40}
                className="object-contain p-1 rounded relative z-10"
              />
            </div>
            <h1 className="text-2xl font-bold">megg</h1>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-3">
              <StatusIndicator
                isActive={isOnline}
                activeIcon={<Wifi className="w-4 h-4 text-green-400" />}
                inactiveIcon={<WifiOff className="w-4 h-4 text-red-400" />}
              />
              <StatusIndicator
                isActive={readyState === WebSocket.OPEN}
                activeIcon={<Plug className="w-4 h-4 text-green-400" />}
                inactiveIcon={<PlugOff className="w-4 h-4 text-red-400" />}
              />
            </div>

            <div className="text-xl font-medium bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2 group">
              <div className={`transition-all duration-500 ${isDaytime ? "text-yellow-300" : "text-blue-200"}`}>
                {isDaytime ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </div>
              <span>{formattedTime}</span>
            </div>
          </div>
        </header>

        {/* navigation cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {navigationCards.map((card) => (
            <div
              key={card.href}
              onClick={() => handleNavigation(card.href, card.title, card.icon)}
            >
              <NavigationCard
                href="#"
                icon={card.icon}
                title={card.title}
                accentPosition={card.accentPosition}
              />
            </div>
          ))}
        </div>

        {/* promotional banner */}
        <PromotionalBanner />
      </div>
    </div>
  )
}

function BackgroundElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,...')] opacity-60" />
      <div
        className="absolute top-1/4 right-1/4 w-64 h-80 bg-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] blur-3xl animate-pulse opacity-30"
        style={{ animationDuration: "8s" }}
      />
      <div
        className="absolute bottom-1/4 left-1/4 w-64 h-80 bg-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] blur-3xl animate-pulse opacity-30"
        style={{ animationDuration: "10s", animationDelay: "2s" }}
      />
      <div className="absolute -top-20 left-1/2 w-1 h-60 bg-gradient-to-b from-cyan-300/20 to-transparent blur-md transform -translate-x-1/2 rotate-15 opacity-30" />
      <div className="absolute -top-20 left-1/3 w-1 h-60 bg-gradient-to-b from-cyan-300/10 to-transparent blur-md transform -translate-x-1/2 -rotate-15 opacity-30" />
    </div>
  )
}

function PromotionalBanner() {
  return (
    <div className="bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] rounded-lg shadow-l p-2 mb-6 relative overflow-hidden group">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 right-1/4 w-40 h-56 bg-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] blur-xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-32 h-40 bg-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] blur-xl animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "1s" }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,...')] opacity-10 transform rotate-12 scale-150" />
        <div className="absolute -top-20 left-1/2 w-1 h-40 bg-gradient-to-b from-cyan-300/40 to-transparent blur-md transform -translate-x-1/2 rotate-15" />
        <div className="absolute -top-20 left-1/3 w-1 h-40 bg-gradient-to-b from-cyan-300/20 to-transparent blur-md transform -translate-x-1/2 -rotate-15" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <div className="text-white text-center md:text-left">
          <h3 className="text-xl font-medium mb-2">Megg Detection System</h3>
          <p className="text-white/80 mb-3">Egg detection powered by AI</p>
        </div>

        <div className="relative mx-auto md:mx-0">
          <div className="relative w-24 sm:w-28 h-32 sm:h-36 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] rotate-12 backdrop-blur-sm border border-white/20 shadow-lg transform transition-transform group-hover:rotate-6 group-hover:scale-105 duration-500" />
            <div className="absolute inset-2 bg-gradient-to-tr from-white/20 to-white/10 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] rotate-12 backdrop-blur-sm border border-white/10" />

            <div className="relative p-2 transform -rotate-6 transition-transform group-hover:rotate-0 duration-500">
              <div className="relative w-20 h-20 overflow-hidden">
                <Image
                  src="/Logos/logowhite.png"
                  alt="Megg Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full" />
              </div>
            </div>

            <div
              className="absolute -bottom-2 -left-4 w-8 h-10 bg-gradient-to-br from-cyan-300/30 to-white/10 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] rotate-12 blur-sm animate-pulse"
              style={{ animationDuration: "3s" }}
            />
            <div
              className="absolute -top-2 -right-2 w-6 h-8 bg-gradient-to-br from-cyan-300/20 to-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] -rotate-12 blur-sm animate-pulse"
              style={{ animationDuration: "4s" }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
