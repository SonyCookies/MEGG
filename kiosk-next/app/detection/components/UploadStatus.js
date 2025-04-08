// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\detection\components\UploadStatus.js
import { WifiOff } from "lucide-react"

export default function UploadStatus({ status, isOnline }) {
  if (!status && isOnline) return null

  return (
    <div className="mt-4 relative backdrop-blur-sm bg-white/90 rounded-lg p-3 shadow-sm border border-white/50 overflow-hidden">
      {/* Holographic overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/5 to-transparent opacity-50 mix-blend-overlay"></div>

      <div className="relative z-10 flex items-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full ${
            status?.includes("success") ? "bg-blue-500 animate-pulse" : status ? "bg-yellow-500" : "bg-gray-300"
          }`}
        />
        <span className="text-sm text-[#171717]/60">Upload Status:</span>
        <span className="text-[#0e5f97] font-medium">
          {status || (isOnline ? "Waiting..." : "Will sync when online")}
        </span>
        {!isOnline && <WifiOff className="w-4 h-4 text-gray-400 ml-1" />}
      </div>
      {!isOnline && (
        <p className="text-xs text-gray-500 mt-1 ml-4 pl-2 border-l-2 border-gray-200">
          Detection data will be stored locally and synchronized when internet connection is restored.
        </p>
      )}
    </div>
  )
}
