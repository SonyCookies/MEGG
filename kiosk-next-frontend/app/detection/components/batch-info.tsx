"use client"

import { CircleDot, Scale, X } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"

interface BatchInfoProps {
  currentBatch: {
    id: string
    batch_number: string
    created_at: string
    total_count: number
    quality_counts: Record<string, number>
    size_counts: Record<string, number>
    weight_ranges: Record<string, string>
  }
  activeTab: "quality" | "size"
  setActiveTab: Dispatch<SetStateAction<"quality" | "size">>
  onClose: () => void
}

export function BatchInfo({ currentBatch, activeTab, setActiveTab, onClose }: BatchInfoProps) {
  // Helper function to get color for size categories
  const getSizeColorClass = (size: string) => {
    switch (size.toLowerCase()) {
      case "small":
        return {
          bg: "bg-blue-100/90",
          border: "border-blue-200",
          text: "text-blue-700",
          gradient: "from-blue-500 to-blue-600",
          fill: "bg-blue-500",
        }
      case "medium":
        return {
          bg: "bg-cyan-100/90",
          border: "border-cyan-200",
          text: "text-cyan-700",
          gradient: "from-cyan-500 to-cyan-600",
          fill: "bg-cyan-500",
        }
      case "large":
        return {
          bg: "bg-teal-100/90",
          border: "border-teal-200",
          text: "text-teal-700",
          gradient: "from-teal-500 to-teal-600",
          fill: "bg-teal-500",
        }
      case "xl":
        return {
          bg: "bg-indigo-100/90",
          border: "border-indigo-200",
          text: "text-indigo-700",
          gradient: "from-indigo-500 to-indigo-600",
          fill: "bg-indigo-500",
        }
      case "jumbo":
        return {
          bg: "bg-purple-100/90",
          border: "border-purple-200",
          text: "text-purple-700",
          gradient: "from-purple-500 to-purple-600",
          fill: "bg-purple-500",
        }
      default:
        return {
          bg: "bg-gray-100/90",
          border: "border-gray-200",
          text: "text-gray-700",
          gradient: "from-gray-500 to-gray-600",
          fill: "bg-gray-500",
        }
    }
  }

  return (
    <div className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg z-30 border-b border-[#0e5f97]/10 animate-slide-down-smooth">
      <div className="p-4">
        {/* Header with close button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0e5f97]/20 to-[#0e5f97]/5 flex items-center justify-center transform transition-transform hover:scale-110 duration-300">
              <CircleDot className="w-5 h-5 text-[#0e5f97]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0e5f97]">Batch Statistics</h3>
              <p className="text-xs text-gray-500">
                Batch {currentBatch.batch_number} • {currentBatch.total_count} eggs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-300 transform hover:rotate-90 hover:scale-110"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-gray-200 mb-4 relative">
          <button
            className={`px-4 py-2 font-medium text-sm relative transition-all duration-300 ${
              activeTab === "quality" ? "text-[#0e5f97]" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("quality")}
          >
            <div className="flex items-center gap-1.5">
              <CircleDot
                className={`w-4 h-4 transition-transform duration-300 ${activeTab === "quality" ? "scale-110" : ""}`}
              />
              <span>Quality</span>
            </div>
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm relative transition-all duration-300 ${
              activeTab === "size" ? "text-[#0e5f97]" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("size")}
          >
            <div className="flex items-center gap-1.5">
              <Scale
                className={`w-4 h-4 transition-transform duration-300 ${activeTab === "size" ? "scale-110" : ""}`}
              />
              <span>Size</span>
            </div>
          </button>

          {/* Animated underline indicator */}
          <div
            className="absolute bottom-0 h-0.5 bg-[#0e5f97] transition-all duration-300 ease-in-out"
            style={{
              left: activeTab === "quality" ? "0%" : "50%",
              width: "50%",
              transform: activeTab === "quality" ? "translateX(0%)" : "translateX(0%)",
            }}
          ></div>
        </div>

        {/* Quality tab content */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            activeTab === "quality"
              ? "opacity-100 translate-y-0"
              : "absolute opacity-0 -translate-y-4 pointer-events-none"
          }`}
          style={{ display: activeTab === "quality" ? "block" : "none" }}
        >
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(currentBatch.quality_counts).map(([type, count]) => {
              const percentage = currentBatch.total_count > 0 ? Math.round((count / currentBatch.total_count) * 100) : 0

              return (
                <div
                  key={type}
                  className={`rounded-xl p-3 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-500 border transform hover:scale-[1.02] hover:-translate-y-0.5 ${
                    type === "good"
                      ? "bg-green-50/80 hover:bg-green-50 border-green-200"
                      : type === "dirty"
                        ? "bg-yellow-50/80 hover:bg-yellow-50 border-yellow-200"
                        : type === "broken"
                          ? "bg-red-50/80 hover:bg-red-50 border-red-200"
                          : "bg-orange-50/80 hover:bg-orange-50 border-orange-200"
                  }`}
                >
                  {/* Highlight effect on hover */}
                  <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Subtle pattern background */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iIzAwMCIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIvPjwvZz48L3N2Zz4=')`,
                        backgroundSize: "20px 20px",
                      }}
                    ></div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-1 group-hover:scale-125 transition-transform duration-300 ${
                            type === "good"
                              ? "bg-green-500"
                              : type === "dirty"
                                ? "bg-yellow-500"
                                : type === "broken"
                                  ? "bg-red-500"
                                  : "bg-orange-500"
                          }`}
                        ></div>
                        <span
                          className={`text-sm font-semibold capitalize ${
                            type === "good"
                              ? "text-green-700"
                              : type === "dirty"
                                ? "text-yellow-700"
                                : type === "broken"
                                  ? "text-red-700"
                                  : "text-orange-700"
                          }`}
                        >
                          {type}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          type === "good"
                            ? "text-green-700"
                            : type === "dirty"
                              ? "text-yellow-700"
                              : type === "broken"
                                ? "text-red-700"
                                : "text-orange-700"
                        }`}
                      >
                        {percentage}%
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span
                        className={`text-xl font-bold ${
                          type === "good"
                            ? "text-green-700"
                            : type === "dirty"
                              ? "text-yellow-700"
                              : type === "broken"
                                ? "text-red-700"
                                : "text-orange-700"
                        } group-hover:scale-110 transition-transform duration-300`}
                      >
                        {count}
                      </span>
                      <div className="h-10 w-full max-w-[60px]">
                        <div className="h-full bg-white/50 rounded-md relative overflow-hidden shadow-inner">
                          <div
                            className={`absolute bottom-0 left-0 right-0 animate-fill-bar ${
                              type === "good"
                                ? "bg-gradient-to-t from-green-500 to-green-400"
                                : type === "dirty"
                                  ? "bg-gradient-to-t from-yellow-500 to-yellow-400"
                                  : type === "broken"
                                    ? "bg-gradient-to-t from-red-500 to-red-400"
                                    : "bg-gradient-to-t from-orange-500 to-orange-400"
                            }`}
                            style={{
                              height: "0%", // Start at 0% for animation
                              transition: "height 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                            }}
                            data-percentage={`${Math.max(percentage, 5)}%`}
                          >
                            {/* Bubbles effect */}
                            <div className="absolute inset-0 overflow-hidden opacity-70">
                              {[...Array(3)].map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute bg-white/30 rounded-full animate-float-bubble"
                                  style={{
                                    width: `${Math.random() * 6 + 3}px`,
                                    height: `${Math.random() * 6 + 3}px`,
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${Math.random() * 2 + 1.5}s`,
                                  }}
                                ></div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Size tab content */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            activeTab === "size" ? "opacity-100 translate-y-0" : "absolute opacity-0 -translate-y-4 pointer-events-none"
          }`}
          style={{ display: activeTab === "size" ? "block" : "none" }}
        >
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(currentBatch.size_counts).map(([size, count]) => {
              const percentage = currentBatch.total_count > 0 ? Math.round((count / currentBatch.total_count) * 100) : 0
              const colorClass = getSizeColorClass(size)
              const weightRange = currentBatch.weight_ranges[size as keyof typeof currentBatch.weight_ranges]

              return (
                <div
                  key={size}
                  className={`rounded-xl p-3 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-500 border transform hover:scale-[1.02] hover:-translate-y-0.5 ${colorClass.bg} ${colorClass.border}`}
                >
                  {/* Highlight effect on hover */}
                  <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Subtle pattern background */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iIzAwMCIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIvPjwvZz48L3N2Zz4=')`,
                        backgroundSize: "20px 20px",
                      }}
                    ></div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-1 ${colorClass.fill} group-hover:scale-125 transition-transform duration-300`}
                        ></div>
                        <span className={`text-sm font-semibold capitalize ${colorClass.text}`}>{size}</span>
                      </div>
                      <span className={`text-xs font-medium ${colorClass.text}`}>{percentage}%</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                        <span
                          className={`text-xl font-bold ${colorClass.text} group-hover:scale-110 transition-transform duration-300`}
                        >
                          {count}
                        </span>
                        <span className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-700 transition-colors duration-300">
                          {weightRange}
                        </span>
                      </div>
                      <div className="h-10 w-full max-w-[40px]">
                        <div className="h-full bg-white/50 rounded-md relative overflow-hidden shadow-inner">
                          <div
                            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${colorClass.gradient} animate-fill-bar`}
                            style={{
                              height: "0%", // Start at 0% for animation
                              transition: "height 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                            }}
                            data-percentage={`${Math.max(percentage, 5)}%`}
                          >
                            {/* Bubbles effect */}
                            <div className="absolute inset-0 overflow-hidden opacity-70">
                              {[...Array(3)].map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute bg-white/30 rounded-full animate-float-bubble"
                                  style={{
                                    width: `${Math.random() * 6 + 3}px`,
                                    height: `${Math.random() * 6 + 3}px`,
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${Math.random() * 2 + 1.5}s`,
                                  }}
                                ></div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
