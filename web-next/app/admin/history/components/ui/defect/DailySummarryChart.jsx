"use client"

import { useEffect, useRef } from "react"

export function DefectChart({ hourlyDistribution, chartType = "bar" }) {
  const chartRef = useRef(null)

  useEffect(() => {
    if (!hourlyDistribution || hourlyDistribution.length === 0) return

    const canvas = chartRef.current
    const ctx = canvas.getContext("2d")

    // Clear previous chart
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set dimensions
    const width = canvas.width
    const height = canvas.height
    const padding = 40
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Find max value for scaling
    const maxValue = Math.max(...hourlyDistribution.map((item) => item.total))
    const scale = chartHeight / (maxValue || 1)

    // Draw axes
    ctx.beginPath()
    ctx.strokeStyle = "#e5e7eb"
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    // Draw y-axis labels
    ctx.fillStyle = "#6b7280"
    ctx.font = "10px sans-serif"
    ctx.textAlign = "right"

    const yAxisSteps = 5
    for (let i = 0; i <= yAxisSteps; i++) {
      const value = Math.round((maxValue / yAxisSteps) * i)
      const y = height - padding - value * scale

      ctx.fillText(value.toString(), padding - 5, y + 3)

      // Draw horizontal grid line
      ctx.beginPath()
      ctx.strokeStyle = "#e5e7eb"
      ctx.setLineDash([2, 2])
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Filter to show only hours with data
    const filteredData = hourlyDistribution.filter((item) => item.total > 0)

    // Draw bars or lines
    const barWidth = chartWidth / (filteredData.length || 1)

    if (chartType === "bar") {
      // Draw bars
      filteredData.forEach((item, index) => {
        const x = padding + index * barWidth

        // Draw dirty defects (orange)
        if (item.dirty > 0) {
          const barHeight = item.dirty * scale
          ctx.fillStyle = "#f97316" // orange-500
          ctx.fillRect(x + barWidth * 0.2, height - padding - barHeight, barWidth * 0.6, barHeight)
        }

        // Draw cracked defects (yellow)
        if (item.cracked > 0) {
          const barHeight = item.cracked * scale
          ctx.fillStyle = "#facc15" // yellow-400
          ctx.fillRect(x + barWidth * 0.2, height - padding - barHeight, barWidth * 0.6, barHeight)
        }

        // Draw good defects (blue)
        if (item.good > 0) {
          const barHeight = item.good * scale
          ctx.fillStyle = "#3b82f6" // blue-500
          ctx.fillRect(x + barWidth * 0.2, height - padding - barHeight, barWidth * 0.6, barHeight)
        }

        // Draw x-axis label
        ctx.fillStyle = "#6b7280"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(item.hour, x + barWidth / 2, height - padding + 15)
      })
    } else {
      // Draw lines
      // Draw line for dirty defects
      ctx.beginPath()
      ctx.strokeStyle = "#f97316" // orange-500
      ctx.lineWidth = 2

      filteredData.forEach((item, index) => {
        const x = padding + index * barWidth + barWidth / 2
        const y = height - padding - item.dirty * scale

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      // Draw line for cracked defects
      ctx.beginPath()
      ctx.strokeStyle = "#facc15" // yellow-400
      ctx.lineWidth = 2

      filteredData.forEach((item, index) => {
        const x = padding + index * barWidth + barWidth / 2
        const y = height - padding - item.cracked * scale

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      // Draw line for good defects
      ctx.beginPath()
      ctx.strokeStyle = "#3b82f6" // blue-500
      ctx.lineWidth = 2

      filteredData.forEach((item, index) => {
        const x = padding + index * barWidth + barWidth / 2
        const y = height - padding - item.good * scale

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      // Draw x-axis labels
      filteredData.forEach((item, index) => {
        const x = padding + index * barWidth + barWidth / 2

        ctx.fillStyle = "#6b7280"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(item.hour, x, height - padding + 15)
      })
    }
  }, [hourlyDistribution, chartType])

  return <canvas ref={chartRef} width={600} height={300} className="w-full h-full" />
}

