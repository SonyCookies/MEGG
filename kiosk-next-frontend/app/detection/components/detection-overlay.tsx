import { CheckCircle, AlertCircle, XCircle, Camera } from "lucide-react"

export interface DetectionResult {
  prediction: string | null
  confidence: number | null
}

interface DetectionOverlayProps {
  detectionResult: DetectionResult | null
}

export function DetectionOverlay({ detectionResult }: DetectionOverlayProps) {
  // Helper functions for styling based on detection type
  const getTextColorClass = (type: string | null) => {
    if (!type) return "text-gray-700"

    switch (type.toLowerCase()) {
      case "good":
        return "text-green-700"
      case "dirty":
        return "text-yellow-700"
      case "broken":
        return "text-red-700"
      case "cracked":
        return "text-orange-700"
      default:
        return "text-blue-700"
    }
  }

  const getGradientClass = (type: string | null) => {
    if (!type) return "from-gray-500 to-gray-600"

    switch (type.toLowerCase()) {
      case "good":
        return "from-green-500 to-green-600"
      case "dirty":
        return "from-yellow-500 to-yellow-600"
      case "broken":
        return "from-red-500 to-red-600"
      case "cracked":
        return "from-orange-500 to-orange-600"
      default:
        return "from-blue-500 to-blue-600"
    }
  }

  const getResultIcon = (type: string | null) => {
    if (!type) return null

    switch (type.toLowerCase()) {
      case "good":
        return <CheckCircle className="w-6 h-6 text-white" />
      case "dirty":
        return <AlertCircle className="w-6 h-6 text-white" />
      case "broken":
        return <XCircle className="w-6 h-6 text-white" />
      case "cracked":
        return <AlertCircle className="w-6 h-6 text-white" />
      default:
        return null
    }
  }

  return (
    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10 w-[280px] max-w-[280px]">
      {detectionResult && detectionResult.prediction ? (
        <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-white/50 mb-3 animate-fade-in-right">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradientClass(
                detectionResult.prediction,
              )} flex items-center justify-center shadow-lg`}
            >
              {getResultIcon(detectionResult.prediction)}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-lg font-bold capitalize ${getTextColorClass(detectionResult.prediction)}`}>
                  {detectionResult.prediction}
                </span>
                {detectionResult.confidence !== null && (
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full font-medium border shadow-sm text-black">
                    {detectionResult.confidence.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {detectionResult.prediction === "good"
                  ? "No visible defects detected"
                  : `Classified as ${detectionResult.prediction.toLowerCase()}`}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2"></div>

          {/* Weight and Size Classification */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">Weight</span>
              <span className="text-xl font-bold text-[#0e5f97]">62g</span>
            </div>
            <div className="h-14 w-px bg-gray-200"></div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">Size</span>
              <span className="text-xl font-bold text-[#0e5f97]">Large</span>
              <span className="text-xs text-gray-500 mt-0.5">50-60g range</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-white/50 animate-fade-in-right">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-700">Awaiting Detection</p>
              <p className="text-sm text-gray-500">Position egg in the center</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2"></div>

          {/* Weight and Size Classification placeholder */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">Weight</span>
              <span className="text-xl font-bold text-gray-400">--</span>
            </div>
            <div className="h-14 w-px bg-gray-200"></div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">Size</span>
              <span className="text-xl font-bold text-gray-400">--</span>
              <span className="text-xs text-gray-500 mt-0.5 opacity-50">Classification</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
