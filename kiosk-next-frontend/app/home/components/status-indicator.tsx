import type { ReactNode } from "react"

interface StatusIndicatorProps {
  isActive: boolean
  activeIcon: ReactNode
  inactiveIcon: ReactNode
}

export default function StatusIndicator({ isActive, activeIcon, inactiveIcon }: StatusIndicatorProps) {
  return (
    <div
      className={`relative flex items-center justify-center w-9 h-9 rounded-full 
                ${
                  isActive
                    ? "bg-gradient-to-br from-green-400/20 to-green-600/20 border border-green-400/30"
                    : "bg-gradient-to-br from-red-400/20 to-red-600/20 border border-red-400/30"
                } 
                shadow-sm transition-all duration-300`}
    >
      {/* Pulsing ring effect */}
      <div
        className={`absolute inset-0 rounded-full ${isActive ? "bg-green-400/10" : "bg-red-400/10"} 
                    animate-ping opacity-75`}
      ></div>

      {/* Icon */}
      {isActive ? activeIcon : inactiveIcon}
    </div>
  )
}
