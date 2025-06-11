"use client"

import { AlertCircle, RefreshCw } from "lucide-react"

interface CameraErrorOverlayProps {
  error: string
  onRetry: () => void
}

export function CameraErrorOverlay({ error, onRetry }: CameraErrorOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl max-w-md w-full border border-white/50">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Camera Error</h3>
          <p className="text-red-600 mb-6">{error}</p>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onRetry}
              className="bg-[#0e5f97] hover:bg-[#0c4d7a] text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 w-full"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Retry Camera</span>
            </button>

            <div className="text-sm text-gray-500 mt-2">
              <p>If the problem persists:</p>
              <ul className="list-disc list-inside mt-1 text-left">
                <li>Check camera connections</li>
                <li>Ensure no other applications are using the camera</li>
                <li>Restart the application</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
