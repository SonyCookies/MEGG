"use client"

import { useState, useRef, useEffect } from "react"
import { getDailyDefectData, getMonthlyDefectData } from "../../../../lib/api"

export function EggDefectsChart({ timeFrame }) {
  const [hoverData, setHoverData] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const chartRef = useRef(null)
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  })

  const colors = {
    cracks: "#0e5f97",
    good: "#CC5500",
    dirty: "#b0b0b0",
    bloodSpots: "#fb510f",
    other: "#ecb662",
  }

  const defectTypes = ["other", "bloodSpots", "dirty", "good", "cracks"]

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setIsVisible(false)

        let fetchedData = []

        try {
          fetchedData = timeFrame === "daily" ? await getDailyDefectData() : await getMonthlyDefectData()
        } catch (err) {
          console.error("Error fetching data:", err)
          // Provide fallback data if API fails
          fetchedData =
            timeFrame === "daily"
              ? [
                  { day: "Mon", cracks: 0, good: 0, dirty: 0, bloodSpots: 0, other: 0 },
                  { day: "Tue", cracks: 0, good: 0, dirty: 0, bloodSpots: 0, other: 0 },
                  { day: "Wed", cracks: 0, good: 0, dirty: 0, bloodSpots: 0, other: 0 },
                  { day: "Thu", cracks: 0, good: 0, dirty: 0, bloodSpots: 0, other: 0 },
                  { day: "Fri", cracks: 0, good: 0, dirty: 0, bloodSpots: 0, other: 0 },
                  { day: "Sat", cracks: 0, good: 0, dirty: 0, bloodSpots: 0, other: 0 },
                  { day: "Sun", cracks: 0, good: 0, dirty: 0, bloodSpots: 0, other: 0 },
                ]
              : [
                  { month: "Jan", cracks: 0, good: 0, dirty: 0, bloodSpots: 0, other: 0 },
                  { month: "Feb", cracks: 0, good: 0, dirty: 0, bloodSpots: 0, other: 0 },
                  { month: "Mar", cracks: 0, good: 0, dirty: 0, bloodSpots: 0, other: 0 },
                  { month: "Apr", cracks: 0, good: 0, dirty: 0, bloodSpots: 0, other: 0 },
                  { month: "May", cracks: 0, good: 0, dirty: 0, bloodSpots: 0, other: 0 },
                  { month: "Jun", cracks: 0, good: 0, dirty: 0, bloodSpots: 0, other: 0 },
                ]
        }

        // Validate data to ensure all properties exist and are numbers
        const validatedData = fetchedData.map((item) => {
          const validItem = {
            ...(timeFrame === "daily" ? { day: item.day || "" } : { month: item.month || "" }),
            cracks: Number(item.cracks) || 0,
            good: Number(item.good) || 0,
            dirty: Number(item.dirty) || 0,
            bloodSpots: Number(item.bloodSpots) || 0,
            other: Number(item.other) || 0,
          }
          return validItem
        })

        setData(validatedData)
        setLoading(false)

        // Small delay before animation starts
        setTimeout(() => setIsVisible(true), 100)
      } catch (err) {
        console.error("Error in fetchData:", err)
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

    // Initial update
    updateDimensions()

    // Update on resize
    window.addEventListener("resize", updateDimensions)

    // Force multiple updates to ensure dimensions are captured correctly
    const timer1 = setTimeout(updateDimensions, 100)
    const timer2 = setTimeout(updateDimensions, 500)
    const timer3 = setTimeout(updateDimensions, 1000)

    return () => {
      window.removeEventListener("resize", updateDimensions)
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  const handleMouseMove = (event, d) => {
    if (!chartRef.current) return

    const svgRect = chartRef.current.getBoundingClientRect()
    const x = event.clientX - svgRect.left
    const y = event.clientY - svgRect.top

    setHoverData({
      x,
      y,
      label: timeFrame === "daily" ? d.day : d.month,
      defects: d,
    })
  }

  // Fixed padding values
  const padding = { left: 40, right: 40, top: 20, bottom: 30 }

  // Calculate chart dimensions properly
  const chartWidth = chartDimensions.width > 0 ? chartDimensions.width - padding.left - padding.right : 500
  const chartHeight = chartDimensions.height > 0 ? chartDimensions.height - padding.top - padding.bottom : 250

  // Calculate bar width based on available space
  const barWidth = data.length > 0 ? Math.min((chartWidth / data.length) * 0.6, 40) : 30

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

  // Calculate the maximum value for scaling
  const maxDefects = Math.max(
    1, // Prevent division by zero
    ...data.map(
      (item) =>
        (Number(item.cracks) || 0) +
        (Number(item.good) || 0) +
        (Number(item.dirty) || 0) +
        (Number(item.bloodSpots) || 0) +
        (Number(item.other) || 0),
    ),
  )

  return (
    <div className="relative w-full h-[300px]" ref={chartRef}>
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${chartDimensions.width || 600} ${chartDimensions.height || 300}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y-axis labels */}
        <g transform={`translate(${padding.left - 5}, ${padding.top})`}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <text
              key={ratio}
              x={0}
              y={chartHeight * (1 - ratio)}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-xs fill-current text-gray-500"
            >
              {Math.round(maxDefects * ratio)}
            </text>
          ))}
        </g>

        {/* Bars */}
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {data.map((d, i) => {
            // Calculate bar position
            const barSpacing = chartWidth / (data.length || 1)
            const x = i * barSpacing + (barSpacing - barWidth) / 2
            let accumulatedHeight = 0

            return (
              <g
                key={i}
                onMouseEnter={(event) => handleMouseMove(event, d)}
                onMouseMove={(event) => handleMouseMove(event, d)}
                onMouseLeave={() => setHoverData(null)}
              >
                {defectTypes.map((defectType, defectIndex) => {
                  // Ensure the value is a number with a fallback to 0
                  const value = Number(d[defectType]) || 0

                  // Calculate height with safety checks
                  const height = (value / maxDefects) * chartHeight

                  // Calculate y position
                  const y = chartHeight - accumulatedHeight - height

                  // Update accumulated height
                  accumulatedHeight += height

                  return (
                    <rect
                      key={`${defectType}-${i}`}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(0, height)}
                      fill={colors[defectType]}
                      className="transition-all ease-in-out"
                      style={{
                        transform: isVisible ? "scaleY(1)" : "scaleY(0)",
                        transformOrigin: "bottom",
                        transitionDuration: "1500ms",
                        transitionDelay: `${i * 150 + defectIndex * 75}ms`,
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
                    transitionDelay: `${i * 150 + defectTypes.length * 75}ms`,
                  }}
                >
                  {timeFrame === "daily" ? d.day : d.month}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {/* Tooltip */}
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
          <div className="font-medium text-gray-800 text-sm border-b pb-1 mb-2">{hoverData.label}</div>
          <div className="space-y-1">
            {defectTypes
              .slice()
              .reverse()
              .map((defectType) => (
                <div key={defectType} className="flex items-center text-gray-700 text-sm">
                  <span
                    className="w-3 h-3 rounded-full mr-2 border border-gray-400"
                    style={{ backgroundColor: colors[defectType] }}
                  ></span>
                  <span className="capitalize font-medium">{defectType}:</span>
                  <span className="ml-auto text-black">{hoverData.defects[defectType].toLocaleString()}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

