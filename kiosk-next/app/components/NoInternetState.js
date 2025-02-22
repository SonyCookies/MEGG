import { WifiOff } from "lucide-react"

export function NoInternetState() {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-gray-50 rounded-full p-4 mb-4">
        <WifiOff className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">No Internet Connection</h3>
      <p className="text-gray-500 max-w-md">
        You're currently offline. Some features may be limited. Your data will sync automatically when you're back
        online.
      </p>
    </div>
  )
}

