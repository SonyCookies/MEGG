"use client"

import { useState, useRef, useEffect } from "react"

export function TotalEggDefectChart({ timeFrame }) {
  const [hoverData, setHoverData] = useState(null)
  const [animationProgress, setAnimationProgress] = useState(0)
  const chartRef = useRef(null)
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  })

  const dailyData = [
    { day: "Mon", defects: 750 },
    { day: "Tue", defects: 780 },
    { day: "Wed", defects: 720 },
    { day: "Thu", defects: 825 },
    { day: "Fri", defects: 765 },
    { day: "Sat", defects: 705 },
    { day: "Sun", defects: 675 },
  ]

  const monthlyData = [
    { month: "Jan", defects: 22500 },
    { month: "Feb", defects: 21000 },
    { month: "Mar", defects: 24000 },
    { month: "Apr", defects: 23250 },
    { month: "May", defects: 25500 },
    { month: "Jun", defects: 24750 },
  ]

  const data = timeFrame === "daily" ? dailyData : monthlyData
  const maxDefects = Math.max(...data.map((d) => d.defects))

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
  }, [])

  const handleMouseMove = (event, d) => {
    const svgRect = chartRef.current.getBoundingClientRect()
    const x = event.clientX - svgRect.left
    const y = event.clientY - svgRect.top

    setHoverData({
      x,
      y,
      label: timeFrame === "daily" ? d.day : d.month,
      defects: d.defects,
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
    `M0,${chartHeight - (data[0].defects / maxDefects) * chartHeight} ` +
    data
      .map((d, i) => `L${(i / (data.length - 1)) * chartWidth},${chartHeight - (d.defects / maxDefects) * chartHeight}`)
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
          <linearGradient id="defectLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fb510f" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#fb510f" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          <path
            d={linePath}
            fill="none"
            stroke="#fb510f"
            strokeWidth="3"
            strokeDasharray={chartWidth}
            strokeDashoffset={chartWidth * (1 - animationProgress) - 3}
          />
          <path
            d={areaPath}
            fill="url(#defectLineGradient)"
            opacity={Math.min(1, (chartWidth - (chartWidth * (1 - animationProgress) - 3)) / chartWidth)}
          />
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * chartWidth
            const y = chartHeight - (d.defects / maxDefects) * chartHeight
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
                  fill="#0e5f97"
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
          <div className="text-black">{hoverData.defects.toLocaleString()} defects</div>
        </div>
      )}
    </div>
  )
}

