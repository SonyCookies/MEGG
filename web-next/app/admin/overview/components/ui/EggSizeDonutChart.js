"use client"

import { useState, useEffect } from "react"

export function EggSizeDonutChart() {
  const [animationProgress, setAnimationProgress] = useState(0)
  const [hoverSegment, setHoverSegment] = useState(null)

  useEffect(() => {
    const animationDuration = 1000
    const startTime = Date.now()

    const animateChart = () => {
      const elapsedTime = Date.now() - startTime
      const progress = Math.min(elapsedTime / animationDuration, 1)
      setAnimationProgress(progress)

      if (progress < 1) {
        requestAnimationFrame(animateChart)
      }
    }

    requestAnimationFrame(animateChart)
  }, [])

  const circleRadius = 40
  const circumference = 2 * Math.PI * circleRadius

  const segments = [
    { name: "Jumbo", color: "#0e5f97", percentage: 10, count: 100000, offset: 0 },
    { name: "Extra Large", color: "#0e4772", percentage: 25, count: 250000, offset: 25.12 },
    { name: "Large", color: "#b0b0b0", percentage: 35, count: 350000, offset: 87.92 },
    { name: "Medium", color: "#fb510f", percentage: 20, count: 200000, offset: 175.84 },
    { name: "Small", color: "#ecb662", percentage: 10, count: 100000, offset: 226.08 },
  ]

  const handleMouseEnter = (segment) => {
    setHoverSegment(segment)
  }

  const handleMouseLeave = () => {
    setHoverSegment(null)
  }

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <defs>
          {segments.map((segment, index) => (
            <linearGradient key={index} id={`gradient${index + 1}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={segment.color} />
              <stop offset="100%" stopColor={segment.color} stopOpacity="0.8" />
            </linearGradient>
          ))}
        </defs>
        {segments.map((segment, index) => (
          <circle
            key={index}
            cx="50"
            cy="50"
            r={circleRadius}
            fill="none"
            stroke={`url(#gradient${index + 1})`}
            strokeWidth="12"
            strokeDasharray={`${(segment.percentage / 100) * circumference} ${circumference}`}
            strokeDashoffset={-segment.offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 1s cubic-bezier(0.25, 0.1, 0.25, 1) 0ms",
              strokeDashoffset: animationProgress * -segment.offset - circumference * (1 - animationProgress),
            }}
            onMouseEnter={() => handleMouseEnter(segment)}
            onMouseLeave={handleMouseLeave}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {hoverSegment ? (
          <>
            <span className="text-2xl font-bold text-primary transition-all duration-300 ease-out">
              {hoverSegment.name}
            </span>
            <span className="text-lg font-semibold text-primary/80 transition-all duration-300 ease-out">
              {hoverSegment.percentage}%
            </span>
            <span className="text-sm text-primary/70 transition-all duration-300 ease-out">
              {hoverSegment.count.toLocaleString()} eggs
            </span>
          </>
        ) : (
          <>
            <span
              className="text-3xl font-bold text-primary transition-all duration-700 ease-out"
              style={{
                opacity: animationProgress,
                transform: `scale(${animationProgress})`,
              }}
            >
              100%
            </span>
            <span
              className="text-sm text-primary/70 transition-all duration-700 ease-out"
              style={{
                opacity: animationProgress,
                transform: `translateY(${20 - 20 * animationProgress}px)`,
              }}
            >
              Size Distribution
            </span>
          </>
        )}
      </div>
    </div>
  )
}

