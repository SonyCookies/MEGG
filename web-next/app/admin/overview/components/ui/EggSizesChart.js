"use client"

import { useState, useRef, useEffect } from "react"

export function EggSizesChart({ timeFrame }) {
  const [hoverData, setHoverData] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const chartRef = useRef(null)
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  })

  const dailyData = [
    {
      day: "Mon",
      jumbo: 5000,
      xl: 12500,
      large: 17500,
      medium: 10000,
      small: 5000,
    },
    {
      day: "Tue",
      jumbo: 6000,
      xl: 15000,
      large: 20000,
      medium: 11000,
      small: 6000,
    },
    {
      day: "Wed",
      jumbo: 7000,
      xl: 17500,
      large: 22500,
      medium: 12000,
      small: 7000,
    },
    {
      day: "Thu",
      jumbo: 8000,
      xl: 20000,
      large: 25000,
      medium: 13000,
      small: 8000,
    },
    {
      day: "Fri",
      jumbo: 9000,
      xl: 22500,
      large: 30000,
      medium: 14000,
      small: 9000,
    },
    {
      day: "Sat",
      jumbo: 10000,
      xl: 25000,
      large: 32500,
      medium: 15000,
      small: 10000,
    },
    {
      day: "Sun",
      jumbo: 5000,
      xl: 12500,
      large: 17500,
      medium: 10000,
      small: 5000,
    },
  ]

  const monthlyData = [
    {
      month: "Jan",
      jumbo: 150000,
      xl: 375000,
      large: 525000,
      medium: 300000,
      small: 150000,
    },
    {
      month: "Feb",
      jumbo: 160000,
      xl: 400000,
      large: 550000,
      medium: 310000,
      small: 160000,
    },
    {
      month: "Mar",
      jumbo: 170000,
      xl: 425000,
      large: 600000,
      medium: 320000,
      small: 170000,
    },
    {
      month: "Apr",
      jumbo: 180000,
      xl: 450000,
      large: 625000,
      medium: 330000,
      small: 180000,
    },
    {
      month: "May",
      jumbo: 190000,
      xl: 475000,
      large: 650000,
      medium: 340000,
      small: 190000,
    },
    {
      month: "Jun",
      jumbo: 200000,
      xl: 500000,
      large: 700000,
      medium: 350000,
      small: 200000,
    },
  ]

  const data = timeFrame === "daily" ? dailyData : monthlyData
  const maxEggs = Math.max(
    ...data.map((d) => d.jumbo + d.xl + d.large + d.medium + d.small)
  )

  const colors = {
    jumbo: "#0e5f97",
    xl: "#0e4772",
    large: "#b0b0b0",
    medium: "#fb510f",
    small: "#ecb662",
  }

  const sizes = ["small", "medium", "large", "xl", "jumbo"]

  useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        const { width, height } = chartRef.current.getBoundingClientRect()
        setChartDimensions({ width, height })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    const timer = setTimeout(() => setIsVisible(true), 100)

    return () => {
      window.removeEventListener("resize", updateDimensions)
      clearTimeout(timer)
    }
  }, [])

  const handleMouseMove = (event, d) => {
    const svgRect = chartRef.current.getBoundingClientRect()
    const x = event.clientX - svgRect.left
    const y = event.clientY - svgRect.top

    setHoverData({
      x,
      y,
      label: timeFrame === "daily" ? d.day : d.month,
      sizes: d,
    })
  }

  const padding = { left: 40, right: 40, top: 20, bottom: 30 }
  const chartWidth = Math.min(
    chartDimensions.width - padding.left - padding.right,
    600
  )
  const chartHeight = chartDimensions.height - padding.top - padding.bottom
  const barWidth = Math.min((chartWidth / data.length) * 0.6, 40)

  const getTooltipPosition = (x, y) => {
    const tooltipWidth = 150
    const tooltipHeight = 150
    const margin = 10

    let left = x
    let top = y - tooltipHeight - margin

    if (left < tooltipWidth / 2 + margin) {
      left = tooltipWidth / 2 + margin
    } else if (left > chartDimensions.width - tooltipWidth / 2 - margin) {
      left = chartDimensions.width - tooltipWidth / 2 - margin
    }

    if (top < margin) {
      top = y + margin
    }

    return { left, top }
  }

  return (
    <div className="relative w-full h-[300px]" ref={chartRef}>
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * (chartWidth - barWidth)
            let accumulatedHeight = 0

            return (
              <g
                key={i}
                onMouseEnter={(event) => handleMouseMove(event, d)}
                onMouseMove={(event) => handleMouseMove(event, d)}
                onMouseLeave={() => setHoverData(null)}
              >
                {sizes.map((size, sizeIndex) => {
                  const height = (d[size] / maxEggs) * chartHeight
                  const y = chartHeight - accumulatedHeight - height
                  accumulatedHeight += height

                  return (
                    <rect
                      key={`${size}-${i}`}
                      x={x}
                      y={y - 0.5}
                      width={barWidth}
                      height={height + 1}
                      fill={colors[size]}
                      className="transition-all ease-in-out"
                      style={{
                        transform: isVisible ? "scaleY(1)" : "scaleY(0)",
                        transformOrigin: "bottom",
                        transitionDuration: "1500ms",
                        transitionDelay: `${i * 150 + sizeIndex * 75}ms`,
                      }}
                    />
                  )
                })}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  className="text-xs fill-current text-blue-600 transition-all ease-in-out"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(10px)",
                    transitionDuration: "1000ms",
                    transitionDelay: `${i * 150 + sizes.length * 75}ms`,
                  }}
                >
                  {timeFrame === "daily" ? d.day : d.month}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
      {hoverData && (
        <div
          className="absolute bg-white p-3 rounded-xl shadow-lg text-sm border border-gray-200 transition-all duration-300 ease-in-out"
          style={{
            ...getTooltipPosition(hoverData.x, hoverData.y),
            transform: "translate(-50%, 0)",
            pointerEvents: "none",
            minWidth: "150px",
            opacity: 1,
          }}
        >
          <div className="font-medium text-gray-800 text-sm border-b pb-1 mb-2">
            {hoverData.label}
          </div>
          <div className="space-y-1">
            {sizes
              .slice()
              .reverse()
              .map((size) => (
                <div
                  key={size}
                  className="flex items-center text-gray-700 text-sm"
                >
                  <span
                    className="w-3 h-3 rounded-full mr-2 border border-gray-400"
                    style={{ backgroundColor: colors[size] }}
                  ></span>
                  <span className="capitalize font-medium">{size}:</span>
                  <span className="ml-auto text-black">
                    {hoverData.sizes[size].toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
