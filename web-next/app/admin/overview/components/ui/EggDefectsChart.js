"use client"

import { useState, useRef, useEffect } from "react"

export function EggDefectsChart({ timeFrame }) {
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
      cracks: 300,
      dirt: 188,
      deformities: 150,
      bloodSpots: 75,
      other: 37,
    },
    {
      day: "Tue",
      cracks: 312,
      dirt: 195,
      deformities: 156,
      bloodSpots: 78,
      other: 39,
    },
    {
      day: "Wed",
      cracks: 288,
      dirt: 180,
      deformities: 144,
      bloodSpots: 72,
      other: 36,
    },
    {
      day: "Thu",
      cracks: 330,
      dirt: 206,
      deformities: 165,
      bloodSpots: 83,
      other: 41,
    },
    {
      day: "Fri",
      cracks: 306,
      dirt: 191,
      deformities: 153,
      bloodSpots: 77,
      other: 38,
    },
    {
      day: "Sat",
      cracks: 282,
      dirt: 176,
      deformities: 141,
      bloodSpots: 71,
      other: 35,
    },
    {
      day: "Sun",
      cracks: 270,
      dirt: 169,
      deformities: 135,
      bloodSpots: 68,
      other: 33,
    },
  ]

  const monthlyData = [
    {
      month: "Jan",
      cracks: 9000,
      dirt: 5625,
      deformities: 4500,
      bloodSpots: 2250,
      other: 1125,
    },
    {
      month: "Feb",
      cracks: 8400,
      dirt: 5250,
      deformities: 4200,
      bloodSpots: 2100,
      other: 1050,
    },
    {
      month: "Mar",
      cracks: 9600,
      dirt: 6000,
      deformities: 4800,
      bloodSpots: 2400,
      other: 1200,
    },
    {
      month: "Apr",
      cracks: 9300,
      dirt: 5813,
      deformities: 4650,
      bloodSpots: 2325,
      other: 1162,
    },
    {
      month: "May",
      cracks: 10200,
      dirt: 6375,
      deformities: 5100,
      bloodSpots: 2550,
      other: 1275,
    },
    {
      month: "Jun",
      cracks: 9900,
      dirt: 6188,
      deformities: 4950,
      bloodSpots: 2475,
      other: 1237,
    },
  ]

  const data = timeFrame === "daily" ? dailyData : monthlyData
  const maxDefects = Math.max(...data.map((d) => d.cracks + d.dirt + d.deformities + d.bloodSpots + d.other))

  const colors = {
    cracks: "#0e5f97",
    dirt: "#0e4772",
    deformities: "#b0b0b0",
    bloodSpots: "#fb510f",
    other: "#ecb662",
  }

  const defectTypes = ["other", "bloodSpots", "deformities", "dirt", "cracks"]

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
      defects: d,
    })
  }

  const padding = { left: 40, right: 40, top: 20, bottom: 30 }
  const chartWidth = Math.min(chartDimensions.width - padding.left - padding.right, 600)
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
                {defectTypes.map((defectType, defectIndex) => {
                  const height = (d[defectType] / maxDefects) * chartHeight
                  const y = chartHeight - accumulatedHeight - height
                  accumulatedHeight += height

                  return (
                    <rect
                      key={`${defectType}-${i}`}
                      x={x}
                      y={y - 0.5}
                      width={barWidth}
                      height={height + 1}
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

