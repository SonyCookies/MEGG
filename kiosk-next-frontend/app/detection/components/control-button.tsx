import type { ReactNode, ButtonHTMLAttributes } from "react"

interface ControlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string
}

export function ControlButton({ children, className = "", ...props }: ControlButtonProps) {
  return (
    <button
      className={`bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 p-3 rounded-xl shadow-lg border border-white/50 text-[#0e5f97] flex items-center justify-center transform hover:scale-105 active:scale-95 group relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Button shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full"></div>
      {children}
    </button>
  )
}
