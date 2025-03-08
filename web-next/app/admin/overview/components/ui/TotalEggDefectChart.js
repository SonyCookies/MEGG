"use client"

import { useState, useRef, useEffect } from "react"
import { getTotalDefectData } from "../../../../lib/api"

export function TotalEggDefectChart({ timeFrame }) {
  const [hoverData, setHoverData] = useState(null)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const chartRef = useRef(null)
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        let chartData = await getTotalDefectData(timeFrame)

        // Ensure we have data for all days
        if (timeFrame === "daily") {
          const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          chartData = daysOfWeek.map((day) => {
            const existingData = chartData.find((d) => d.day === day)
            return existingData || { day, defects: 0 }
          })
        }

        setData(chartData)
        setLoading(false)
        // Reset animation when data changes
        setAnimationProgress(0)
      } catch (err) {
        console.error("Error fetching total defect data:", err)
        setError("Failed to load defect data")
        setLoading(false)
      }
    }

    fetchData()
  }, [timeFrame])

  useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        const { width, height } = chartRef.current.getBoundingClientRect()
        setChartDimensions({ width, height })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    // Start the animation when data is loaded
    if (data.length > 0 && !loading) {
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
    }

    return () => {
      window.removeEventListener("resize", updateDimensions)
    }
  }, [data, loading])

  const handleMouseMove = (event, d) => {
    if (!chartRef.current) return

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

  if (loading) {
    return (
      <div className="relative w-full h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative w-full h-[300px] flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="relative w-full h-[300px] flex items-center justify-center">
        <div className="text-gray-500">No data available</div>
      </div>
    )
  }

  // Calculate maxDefects with a fallback to 1 to avoid division by zero
  const maxDefects = Math.max(1, ...data.map((d) => d.defects))

  // Create a continuous line path
  const linePath = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * chartWidth
      // Ensure y is a valid number by using a fallback when defects is 0
      const y = chartHeight - ((d.defects || 0) / maxDefects) * chartHeight
      return `${i === 0 ? "M" : "L"}${x},${y}`
    })
    .join(" ")

  const areaPath = `${linePath} L${chartWidth},${chartHeight} L0,${chartHeight} Z`

  // Check if all defects are 0
  const allZeroDefects = data.every((d) => d.defects === 0)

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
          {/* Only render the line if there's actual data */}
          {!allZeroDefects && (
            <>
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
            </>
          )}

          {/* Always render the data points and labels */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * chartWidth
            // For zero data, position all points at the bottom of the chart
            const y = allZeroDefects ? chartHeight : chartHeight - ((d.defects || 0) / maxDefects) * chartHeight
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

      {/* Show a "No data" message when all defects are zero */}
      {allZeroDefects && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500">No defect data for this period</div>
        </div>
      )}

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

