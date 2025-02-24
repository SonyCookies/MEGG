"use client"

import { useState, useRef, useEffect } from "react"

export function TotalEggsChart({ timeFrame }) {
  const [hoverData, setHoverData] = useState(null)
  const [animationProgress, setAnimationProgress] = useState(0)
  const chartRef = useRef(null)
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  })

  const dailyData = [
    { day: "Mon", eggs: 50000 },
    { day: "Tue", eggs: 52000 },
    { day: "Wed", eggs: 48000 },
    { day: "Thu", eggs: 55000 },
    { day: "Fri", eggs: 51000 },
    { day: "Sat", eggs: 47000 },
    { day: "Sun", eggs: 45000 },
  ]

  const monthlyData = [
    { month: "Jan", eggs: 1500000 },
    { month: "Feb", eggs: 1400000 },
    { month: "Mar", eggs: 1600000 },
    { month: "Apr", eggs: 1550000 },
    { month: "May", eggs: 1700000 },
    { month: "Jun", eggs: 1650000 },
  ]

  const data = timeFrame === "daily" ? dailyData : monthlyData
  const maxEggs = Math.max(...data.map((d) => d.eggs))

  useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        const { width, height } = chartRef.current.getBoundingClientRect()
        setChartDimensions({ width, height })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    // Reset animation progress when timeFrame changes
    setAnimationProgress(0)

    // Start the animation
    const animationDuration = 1500 // 1.5 seconds
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

    return () => {
      window.removeEventListener("resize", updateDimensions)
    }
  }, [timeFrame]) // Add timeFrame as a dependency

  const handleMouseMove = (event, d) => {
    const svgRect = chartRef.current.getBoundingClientRect()
    const x = event.clientX - svgRect.left
    const y = event.clientY - svgRect.top

    setHoverData({
      x,
      y,
      label: timeFrame === "daily" ? d.day : d.month,
      eggs: d.eggs,
    })
  }

  const padding = { left: 20, right: 20, top: 20, bottom: 30 }
  const chartWidth = chartDimensions.width - padding.left - padding.right
  const chartHeight = chartDimensions.height - padding.top - padding.bottom

  const getTooltipPosition = (x, y) => {
    const tooltipWidth = 120
    const tooltipHeight = 60
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

  const linePath =
    `M0,${chartHeight - (data[0].eggs / maxEggs) * chartHeight} ` +
    data
      .map((d, i) => `L${(i / (data.length - 1)) * chartWidth},${chartHeight - (d.eggs / maxEggs) * chartHeight}`)
      .join(" ")

  const areaPath = linePath + ` L${chartWidth},${chartHeight} L0,${chartHeight} Z`

  return (
    <div className="relative w-full h-[300px]" ref={chartRef}>
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0e5f97" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0e5f97" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          <path
            d={linePath}
            fill="none"
            stroke="#0e5f97"
            strokeWidth="3"
            strokeDasharray={chartWidth}
            strokeDashoffset={chartWidth * (1 - animationProgress) - 10}
          />
          <path
            d={areaPath}
            fill="url(#lineGradient)"
            opacity={Math.min(1, (chartWidth - (chartWidth * (1 - animationProgress) - 3)) / chartWidth)}
          />
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * chartWidth
            const y = chartHeight - (d.eggs / maxEggs) * chartHeight
            const pointProgress = Math.min(1, animationProgress * data.length * 1.5 - i)

            return (
              <g
                key={i}
                onMouseEnter={(event) => handleMouseMove(event, d)}
                onMouseMove={(event) => handleMouseMove(event, d)}
                onMouseLeave={() => setHoverData(null)}
              >
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#fb510f"
                  opacity={pointProgress}
                  transform={`scale(${pointProgress})`}
                />
                <text
                  x={x}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  className="text-xs"
                  fill="#0e5f97"
                  opacity={pointProgress}
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
            minWidth: "120px",
            opacity: 1,
          }}
        >
          <div className="font-medium text-gray-800 text-sm border-b pb-1 mb-1">{hoverData.label}</div>
          <div className="text-black">{hoverData.eggs.toLocaleString()} eggs</div>
        </div>
      )}
    </div>
  )
}

