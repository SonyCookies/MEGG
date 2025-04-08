// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\detection\components\BatchInfo.js
"use client"

import { Clock, FileText, CheckCircle, AlertCircle, CheckSquare, Archive, BarChart2 } from "lucide-react"

export default function BatchInfo({ batch, onCompleteBatch }) {
  if (!batch) return null

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  // Get defect type icon and color
  const getDefectTypeStyles = (type) => {
    switch (type.toLowerCase()) {
      case "good":
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          borderColor: "border-green-200",
        }
      case "dirty":
        return {
          icon: <AlertCircle className="w-4 h-4 text-yellow-500" />,
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-700",
          borderColor: "border-yellow-200",
        }
      case "broken":
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-500" />,
          bgColor: "bg-red-100",
          textColor: "text-red-700",
          borderColor: "border-red-200",
        }
      case "cracked":
        return {
          icon: <AlertCircle className="w-4 h-4 text-orange-500" />,
          bgColor: "bg-orange-100",
          textColor: "text-orange-700",
          borderColor: "border-orange-200",
        }
      default:
        return {
          icon: <CheckSquare className="w-4 h-4 text-blue-500" />,
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
          borderColor: "border-blue-200",
        }
    }
  }

  // Calculate percentage for each defect type
  const calculatePercentage = (count) => {
    if (batch.total_count === 0) return 0
    return Math.round((count / batch.total_count) * 100)
  }

  return (
    <div className="relative backdrop-blur-sm bg-white/90 rounded-xl shadow-lg overflow-hidden border border-white/50">
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

      <div className="relative z-10 p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0e5f97]/20 to-[#0e5f97]/10 flex items-center justify-center mr-3 border border-[#0e5f97]/20">
              <BarChart2 className="w-5 h-5 text-[#0e5f97]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0e5f97]">Batch {batch.batch_number}</h3>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                <span>{formatDate(batch.created_at)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onCompleteBatch}
            className="flex items-center gap-1 text-sm bg-gradient-to-r from-[#0e5f97] to-[#0e4772] text-white px-3 py-2 rounded-lg hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 relative overflow-hidden group"
          >
            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
            <Archive className="w-4 h-4" />
            <span>Complete</span>
          </button>
        </div>

        {batch.notes && (
          <div className="mb-4 p-3 bg-gradient-to-r from-[#0e5f97]/5 to-[#0e5f97]/10 rounded-lg border border-[#0e5f97]/10 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iIzBlNWY5NyIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIvPjwvZz48L3N2Zz4=')",
                  backgroundSize: "20px 20px",
                }}
              ></div>
            </div>
            <div className="flex items-start relative z-10">
              <FileText className="w-4 h-4 mr-2 mt-0.5 text-[#0e5f97]" />
              <div>
                <span className="text-xs font-medium text-gray-500">NOTES</span>
                <p className="text-sm text-gray-700">{batch.notes}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Total eggs processed</span>
            <span className="text-lg font-bold text-[#0e5f97]">{batch.total_count}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
              style={{ width: "100%" }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(batch.defect_counts).map(([type, count]) => {
            const { icon, bgColor, textColor, borderColor } = getDefectTypeStyles(type)
            const percentage = calculatePercentage(count)

            return (
              <div
                key={type}
                className={`${bgColor} ${borderColor} border rounded-lg p-3 transition-all hover:shadow-md relative overflow-hidden group`}
              >
                {/* Highlight effect on hover */}
                <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      {icon}
                      <span className={`ml-1 text-xs font-semibold ${textColor} capitalize`}>{type}</span>
                    </div>
                    <span className={`text-xs font-medium ${textColor}`}>{percentage}%</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className={`text-lg font-bold ${textColor}`}>{count}</span>
                    <div className="h-8 w-full max-w-[60px]">
                      <div className="h-full bg-white/50 rounded-sm relative overflow-hidden">
                        <div
                          className={`absolute bottom-0 left-0 right-0 ${bgColor} bg-opacity-70`}
                          style={{ height: `${Math.max(percentage, 5)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
