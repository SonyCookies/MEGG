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
    <div className="bg-white rounded-xl shadow-md p-4 h-full">
      <h3 className="text-lg font-semibold text-[#0e5f97] mb-3">Latest Detection</h3>

      <div className={`p-4 rounded-lg border ${getColorClass(prediction)} transition-all duration-300`}>
        {prediction ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-lg font-bold capitalize ${getTextColorClass(prediction)}`}>{prediction}</span>
              {confidence !== null && (
                <span className="text-xs bg-white px-2 py-1 rounded-full font-medium border">
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
  )
}

