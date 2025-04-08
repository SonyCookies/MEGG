// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\detection\components\ErrorMessage.js

import { AlertCircle } from "lucide-react"

export default function ErrorMessage({ message }) {
  if (!message) return null

  return (
    <div
      className="mt-4 bg-gradient-to-r from-red-50 to-red-50/70 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex items-start"
      role="alert"
    >
      <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
      <div>
        <span className="font-medium">Error:</span> {message}
      </div>
    </div>
  )
}
