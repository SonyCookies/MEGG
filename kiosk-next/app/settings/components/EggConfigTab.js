"use client"

import { useState, useEffect } from "react"
import { Weight, Egg, ArrowRight, Check, AlertCircle, ChevronRight, Info, Save, Loader2, Download } from "lucide-react"

export default function EggConfigTab() {
  // Add this function at the beginning of the component
  const extractMachineIdFromUrl = () => {
    // This is a fallback method to get the machine ID from the URL if needed
    const urlParts = window.location.pathname.split("/")
    // Look for a part that matches the pattern of a machine ID (e.g., MEGG-YYYY-XXX-NNN)
    for (const part of urlParts) {
      if (part.startsWith("MEGG-") || part.match(/^[A-Za-z0-9-]{10,}$/)) {
        return part
      }
    }
    return null
  }

  const [activeSize, setActiveSize] = useState(null)
  const [showSaveAnimation, setShowSaveAnimation] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [machineId, setMachineId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [eggSizeRanges, setEggSizeRanges] = useState({
    small: { min: null, max: null },
    medium: { min: null, max: null },
    large: { min: null, max: null },
    xl: { min: null, max: null },
    jumbo: { min: null, max: null },
  })

  const sizeOrder = ["small", "medium", "large", "xl", "jumbo"]

  const recommendedSizes = {
    small: { min: 43, max: 53 },
    medium: { min: 53, max: 63 },
    large: { min: 63, max: 73 },
    xl: { min: 73, max: 83 },
    jumbo: { min: 83, max: 120 },
  }

  const sizeLabels = {
    small: "Small",
    medium: "Medium",
    large: "Large",
    xl: "Extra Large",
    jumbo: "Jumbo",
  }

  const sizeColors = {
    small: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", accent: "bg-amber-500" },
    medium: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", accent: "bg-green-500" },
    large: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", accent: "bg-blue-500" },
    xl: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", accent: "bg-purple-500" },
    jumbo: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", accent: "bg-red-500" },
  }

  // Fetch machine ID and existing configuration on component mount
  useEffect(() => {
    // Then modify the fetchMachineData function in the useEffect:
    async function fetchMachineData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch machine ID from session
        const sessionResponse = await fetch("/api/auth/session")
        let machineIdToUse = null

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()
          console.log("Session data:", sessionData)

          if (sessionData.machineId) {
            machineIdToUse = sessionData.machineId
            console.log("Using machine ID from session:", machineIdToUse)
          }
        }

        // If no machine ID in session, try to get it from URL or cookies
        if (!machineIdToUse) {
          // Try to get from URL
          const urlMachineId = extractMachineIdFromUrl()
          if (urlMachineId) {
            machineIdToUse = urlMachineId
            console.log("Using machine ID from URL:", machineIdToUse)
          } else {
            // Try to get from cookies
            const cookies = document.cookie.split(";").map((c) => c.trim())
            const machineCookie = cookies.find((c) => c.startsWith("machine_id="))
            if (machineCookie) {
              machineIdToUse = decodeURIComponent(machineCookie.split("=")[1])
              console.log("Using machine ID from cookie:", machineIdToUse)
            }
          }
        }

        // If still no machine ID, use a fallback for development
        if (!machineIdToUse) {
          machineIdToUse = "MEGG-2025-O89-367" // Use the machine ID from your debug output
          console.log("Using fallback machine ID:", machineIdToUse)
        }

        setMachineId(machineIdToUse)

        // First try the dynamic route
        console.log("Fetching configuration from dynamic route:", `/api/egg-config/${machineIdToUse}`)
        try {
          const configResponse = await fetch(`/api/egg-config/${machineIdToUse}`)
          console.log("Dynamic route response status:", configResponse.status)

          if (configResponse.ok) {
            const configData = await configResponse.json()
            console.log("Loaded configuration from dynamic route:", configData)

            if (configData && configData.sizes) {
              setEggSizeRanges(configData.sizes)
              return // Exit early if successful
            }
          }
        } catch (err) {
          console.error("Error fetching from dynamic route:", err)
          // Continue to fallback
        }

        // If dynamic route fails, try the direct API endpoint
        console.log("Trying direct API endpoint as fallback")
        try {
          const directResponse = await fetch(`/api/egg-config-direct?machineId=${machineIdToUse}`)
          console.log("Direct API response status:", directResponse.status)

          if (directResponse.ok) {
            const directData = await directResponse.json()
            console.log("Loaded configuration from direct API:", directData)

            if (directData && directData.sizes) {
              setEggSizeRanges(directData.sizes)
              return // Exit if successful
            }
          }
        } catch (directErr) {
          console.error("Error fetching from direct API:", directErr)
          // Continue to test endpoint
        }

        // If both fail, try the test endpoint
        console.log("Trying test endpoint as last resort")
        try {
          const testResponse = await fetch(`/api/test-route/${machineIdToUse}`)
          console.log("Test endpoint response:", testResponse.status)

          if (testResponse.ok) {
            const testData = await testResponse.json()
            console.log("Test endpoint data:", testData)
            setError(
              "Could not load configuration, but test endpoint is working. This suggests an issue with the egg configuration API.",
            )
          } else {
            setError("All API endpoints failed. There may be an issue with the server configuration.")
          }
        } catch (testErr) {
          console.error("Error with test endpoint:", testErr)
          setError(`All API endpoints failed: ${testErr.message}`)
        }
      } catch (err) {
        console.error("Error fetching machine data:", err)
        setError(`Failed to load configuration: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchMachineData()
  }, [])

  // Add a fallback machine ID for testing/development
  useEffect(() => {
    if (!machineId && !loading) {
      console.log("No machine ID found in session, using fallback ID for development")
      setMachineId("test-machine-123")
    }
  }, [machineId, loading])

  const handleSizeClick = (size) => {
    setActiveSize(size === activeSize ? null : size)
  }

  const handleRangeChange = (size, field, value) => {
    const numValue = value === "" ? null : Number.parseInt(value, 10)
    if (value !== "" && (isNaN(numValue) || numValue < 0)) return

    setEggSizeRanges((prev) => {
      const newRanges = { ...prev }

      newRanges[size] = {
        ...prev[size],
        [field]: numValue,
      }

      if (field === "min" && numValue !== null && prev[size].max !== null && numValue > prev[size].max) {
        newRanges[size].max = numValue
      }

      if (field === "max" && numValue !== null && prev[size].min !== null && numValue < prev[size].min) {
        newRanges[size].min = numValue
      }

      return newRanges
    })
  }

  const loadRecommendedSizes = () => {
    setEggSizeRanges(recommendedSizes)
    setShowSaveAnimation(true)
    setTimeout(() => setShowSaveAnimation(false), 1500)
  }

  const saveConfiguration = async () => {
    if (!machineId) {
      setError("Machine ID not available. Cannot save configuration.")
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch("/api/egg-config/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machineId,
          sizes: eggSizeRanges,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save configuration")
      }

      setShowSaveAnimation(true)
      setTimeout(() => setShowSaveAnimation(false), 1500)
    } catch (err) {
      console.error("Error saving configuration:", err)
      setError("Failed to save configuration. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const getEggSizeStyle = (size) => {
    const baseSize = 60

    // If min and max are not set, use a default size
    if (eggSizeRanges[size].min === null || eggSizeRanges[size].max === null) {
      return {
        width: `${baseSize * 0.7}px`,
        height: `${baseSize * 0.9}px`,
        opacity: 0.5,
      }
    }

    const avgValue = (eggSizeRanges[size].min + eggSizeRanges[size].max) / 2
    const scaleFactor = 0.5 + (avgValue - 40) / 100
    const width = baseSize * scaleFactor
    const height = baseSize * 1.3 * scaleFactor

    return {
      width: `${width}px`,
      height: `${height}px`,
      opacity: 1,
    }
  }

  // Check if there are any gaps or overlaps in the ranges
  const validateRanges = () => {
    const issues = []

    for (let i = 0; i < sizeOrder.length - 1; i++) {
      const currentSize = sizeOrder[i]
      const nextSize = sizeOrder[i + 1]
      const currentMax = eggSizeRanges[currentSize].max
      const nextMin = eggSizeRanges[nextSize].min

      // Skip validation if any values are null
      if (currentMax === null || nextMin === null) continue

      if (currentMax < nextMin) {
        issues.push({
          type: "gap",
          between: [currentSize, nextSize],
          range: `${currentMax}g to ${nextMin}g`,
        })
      } else if (currentMax > nextMin) {
        issues.push({
          type: "overlap",
          between: [currentSize, nextSize],
          range: `${nextMin}g to ${currentMax}g`,
        })
      }
    }

    return issues
  }

  const rangeIssues = validateRanges()

  // Check if configuration is empty
  const isConfigEmpty = Object.values(eggSizeRanges).every((range) => range.min === null || range.max === null)

  // Check if all required fields are filled
  const isConfigComplete = Object.values(eggSizeRanges).every((range) => range.min !== null && range.max !== null)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-[#0e5f97] animate-spin mb-4" />
        <p className="text-gray-500">Loading egg size configuration...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#0e5f97] flex items-center">
          <Weight className="w-5 h-5 mr-2" />
          Egg Size Configuration
        </h2>

        <div className="relative">
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label="Size guide information"
          >
            <Info className="w-5 h-5 text-[#0e5f97]" />
          </button>

          {showTooltip && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-10 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-[#0e5f97] flex items-center">
                  <Egg className="w-4 h-4 mr-2" />
                  Quick Size Guide
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Industry Standards</h4>
                  <ul className="text-xs space-y-1 text-gray-600">
                    <li className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-[#0e5f97]" />
                      Small: 43-53g
                    </li>
                    <li className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-[#0e5f97]" />
                      Medium: 53-63g
                    </li>
                    <li className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-[#0e5f97]" />
                      Large: 63-73g
                    </li>
                    <li className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-[#0e5f97]" />
                      Extra Large: 73-83g
                    </li>
                    <li className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-[#0e5f97]" />
                      Jumbo: 83g+
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Range Tips</h4>
                  <ul className="text-xs space-y-1 text-gray-600">
                    <li className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" />
                      Avoid gaps between ranges
                    </li>
                    <li className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" />
                      Ranges should meet exactly (e.g., 53g, 63g)
                    </li>
                    <li className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" />
                      Consider your market's expectations
                    </li>
                    <li className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" />
                      Regularly calibrate your scale
                    </li>
                  </ul>
                </div>
              </div>

              <div className="absolute -top-2 right-3 w-4 h-4 bg-white border-t border-l border-gray-200 transform rotate-45"></div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isConfigEmpty && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-center">
          <Egg className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-blue-800 mb-2">No Egg Sizes Configured</h3>
          <p className="text-blue-600 mb-4">
            You haven't set up egg size ranges yet. Would you like to use the recommended industry standard sizes?
          </p>
          <button
            onClick={loadRecommendedSizes}
            className="px-4 py-2 bg-[#0e5f97] text-white rounded-lg hover:bg-[#0e4772] transition-colors flex items-center gap-2 mx-auto"
          >
            <Download className="w-4 h-4" />
            Load Recommended Sizes
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-medium text-gray-800">Egg Size Categories</h3>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-5 gap-3 mb-6">
            {sizeOrder.map((size) => (
              <button
                key={size}
                onClick={() => handleSizeClick(size)}
                className={`relative p-3 rounded-lg border transition-all ${
                  activeSize === size
                    ? `${sizeColors[size].border} ${sizeColors[size].bg} ${sizeColors[size].text}`
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                } flex flex-col items-center justify-center gap-2`}
              >
                <div
                  className={`egg-shape rounded-full ${activeSize === size ? sizeColors[size].accent : "bg-gray-100"}`}
                  style={getEggSizeStyle(size)}
                ></div>
                <span className="text-sm font-medium">{sizeLabels[size]}</span>
                {activeSize === size && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#0e5f97] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-800 flex items-center">
                <Egg className="w-4 h-4 mr-2 text-[#0e5f97]" />
                Weight Ranges per Size
              </h4>

              <button
                onClick={loadRecommendedSizes}
                className="text-sm text-[#0e5f97] hover:underline flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                Load Recommended
              </button>
            </div>

            <div className="space-y-3">
              {sizeOrder.map((size) => (
                <div
                  key={size}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    activeSize === size
                      ? `${sizeColors[size].bg} ${sizeColors[size].border}`
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${sizeColors[size].accent}`}></div>
                    <span className={`font-medium ${activeSize === size ? sizeColors[size].text : "text-gray-700"}`}>
                      {sizeLabels[size]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={eggSizeRanges[size].min === null ? "" : eggSizeRanges[size].min}
                        onChange={(e) => handleRangeChange(size, "min", e.target.value)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded-l-md text-right focus:outline-none focus:ring-1 focus:ring-[#0e5f97] focus:border-[#0e5f97]"
                        min="1"
                        placeholder="Min"
                        aria-label={`Minimum weight for ${sizeLabels[size]}`}
                      />
                      <div className="px-2 py-1 bg-gray-100 border-t border-b border-gray-300 text-gray-500 text-sm">
                        g
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-400" />

                    <div className="flex items-center">
                      <input
                        type="number"
                        value={eggSizeRanges[size].max === null ? "" : eggSizeRanges[size].max}
                        onChange={(e) => handleRangeChange(size, "max", e.target.value)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded-l-md text-right focus:outline-none focus:ring-1 focus:ring-[#0e5f97] focus:border-[#0e5f97]"
                        min={eggSizeRanges[size].min || 1}
                        placeholder="Max"
                        aria-label={`Maximum weight for ${sizeLabels[size]}`}
                      />
                      <div className="px-2 py-1 bg-gray-100 border-t border-b border-r border-gray-300 rounded-r-md text-gray-500 text-sm">
                        g
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {rangeIssues.length > 0 && (
        <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-5">
          <h3 className="font-medium text-amber-800 mb-3 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-amber-500" />
            Range Issues Detected
          </h3>

          <div className="space-y-3">
            {rangeIssues.map((issue, index) => (
              <div key={index} className="flex items-start gap-2 bg-white p-3 rounded-lg border border-amber-100">
                <div className="mt-0.5">
                  <ArrowRight className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-amber-700 font-medium">
                    {issue.type === "gap" ? (
                      <span>
                        Gap detected between <strong>{sizeLabels[issue.between[0]]}</strong> and{" "}
                        <strong>{sizeLabels[issue.between[1]]}</strong>: {issue.range}
                      </span>
                    ) : (
                      <span>
                        Overlap detected between <strong>{sizeLabels[issue.between[0]]}</strong> and{" "}
                        <strong>{sizeLabels[issue.between[1]]}</strong>: {issue.range}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {issue.type === "gap"
                      ? "Eggs falling in this range won't be classified."
                      : "Eggs in this range will be classified as the larger size category."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-end gap-3">
        {showSaveAnimation && (
          <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm animate-fade-in-out">
            <Check className="w-4 h-4" />
            <span>Configuration updated successfully</span>
          </div>
        )}
        <button
          onClick={saveConfiguration}
          disabled={saving || !isConfigComplete}
          className="px-4 py-2 bg-[#0e5f97] text-white rounded-lg hover:bg-[#0e4772] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Configuration
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        .egg-shape {
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          transform: rotate(-20deg);
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(10px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        
        .animate-fade-in-out {
          animation: fadeInOut 1.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}

