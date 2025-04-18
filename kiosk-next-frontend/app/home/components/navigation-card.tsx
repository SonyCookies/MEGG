import Link from "next/link"
import Image from "next/image"

interface NavigationCardProps {
  href: string
  icon: string
  title: string
  accentPosition: "top" | "right" | "bottom" | "left"
  compact?: boolean // Add compact prop for kiosk mode
}

export default function NavigationCard({ href, icon, title, accentPosition, compact = false }: NavigationCardProps) {
  // Determine accent border position
  const accentBorder = {
    top: "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#0e5f97]/50 to-transparent opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:h-1.5",
    right:
      "absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#0e5f97]/50 to-transparent opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:w-1.5",
    bottom:
      "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#0e5f97]/50 to-transparent opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:h-1.5",
    left: "absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#0e5f97]/50 to-transparent opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:w-1.5",
  }

  return (
    <Link
      href={href}
      className={`bg-gradient-to-br from-white to-[#f0f7ff] rounded-lg shadow-md ${
        compact ? "p-3" : "p-4 sm:p-6"
      } flex flex-col items-center justify-center text-center 
                transition-all duration-300 
                hover:shadow-lg hover:shadow-[#0e5f97]/20
                active:shadow-sm active:translate-y-0.5 active:scale-[0.98]
                relative overflow-hidden border border-[#0e5f97]/10 group h-full`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br from-[#0e5f97]/5 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute -top-8 -left-8 w-32 h-32 bg-gradient-to-tl from-[#0e5f97]/5 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Accent border */}
        <div className={accentBorder[accentPosition]}></div>
      </div>

      <div
        className={`bg-[#ffffff] ${
          compact ? "p-2 mb-2" : "p-3 sm:p-4 mb-3 sm:mb-4"
        } rounded-full flex items-center justify-center border border-[#0e5f97]/10 relative overflow-hidden shadow-md`}
        style={{ width: compact ? "60px" : "80px", height: compact ? "60px" : "80px", maxWidth: "100%" }}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#0e5f97]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>

        {/* Icon with scale effect on hover */}
        <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
          <Image
            src={icon || "/placeholder.svg"}
            alt={title}
            width={compact ? 45 : 60}
            height={compact ? 45 : 60}
            className="object-contain"
          />
        </div>
      </div>

      {/* Text with gradient effect on hover */}
      <div className="relative">
        <span
          className={`font-medium text-gray-800 transition-all duration-300 group-hover:text-[#0e5f97] group-hover:font-semibold ${compact ? "text-base" : ""}`}
        >
          {title}
        </span>
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-[#0e5f97]/50 to-transparent group-hover:w-full transition-all duration-300"></div>
      </div>
    </Link>
  )
}
