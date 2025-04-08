// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\components\ConnectionStatus.js

import { Wifi, WifiOff } from "lucide-react"

export function ConnectionStatus({ isOnline, readyState }) {
  return (
    <div className="bg-gradient-to-r from-[#f0f7ff] via-[#fcfcfd] to-[#f0f7ff] rounded-lg p-4 shadow-md">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
          <span className="text-sm text-[#171717]/60">
            System Status:{" "}
            <span className={`font-medium ${isOnline ? "text-green-500" : "text-red-500"}`}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-[#171717]/60">
            WebSocket:{" "}
            <span className={`font-medium ${readyState === WebSocket.OPEN ? "text-green-500" : "text-red-500"}`}>
              {readyState === WebSocket.OPEN ? "Connected" : "Disconnected"}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

