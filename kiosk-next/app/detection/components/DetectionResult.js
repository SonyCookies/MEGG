// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\detection\components\DetectionResult.js
export default function DetectionResult({ prediction, confidence }) {
  // Define color based on prediction type
  const getColorClass = (type) => {
    if (!type) return "bg-gray-100"

    switch (type.toLowerCase()) {
      case "good":
        return "bg-green-100 border-green-200"
      case "dirty":
        return "bg-yellow-100 border-yellow-200"
      case "broken":
        return "bg-red-100 border-red-200"
      case "cracked":
        return "bg-orange-100 border-orange-200"
      default:
        return "bg-blue-100 border-blue-200"
    }
  }

  const getTextColorClass = (type) => {
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

  return (
    <div className="relative backdrop-blur-sm bg-white/90 rounded-xl shadow-lg overflow-hidden border border-white/50 h-full">
      {/* Holographic overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

      {/* Animated edge glow */}
      <div className="absolute inset-0 rounded-xl">
        <div className="absolute inset-0 rounded-xl animate-border-glow"></div>
      </div>

      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#0e5f97]/30 rounded-tl-xl"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#0e5f97]/30 rounded-tr-xl"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#0e5f97]/30 rounded-bl-xl"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#0e5f97]/30 rounded-br-xl"></div>

      <div className="relative z-10 p-4">
        <h3 className="text-lg font-semibold text-[#0e5f97] mb-3">Latest Detection</h3>

        <div
          className={`p-4 rounded-lg border ${getColorClass(prediction)} transition-all duration-300 relative overflow-hidden`}
        >
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
              backgroundSize: "15px 15px",
            }}
          ></div>

          <div className="relative z-10">
            {prediction ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-lg font-bold capitalize ${getTextColorClass(prediction)}`}>{prediction}</span>
                  {confidence !== null && (
                    <span className="text-xs bg-white/90 px-2 py-1 rounded-full font-medium border shadow-sm">
                      {confidence.toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {prediction === "good"
                    ? "This egg appears to be in good condition with no visible defects."
                    : `This egg has been classified as ${prediction.toLowerCase()}.`}
                </p>
              </>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>No detection yet</p>
                <p className="text-xs mt-1">Detection results will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
