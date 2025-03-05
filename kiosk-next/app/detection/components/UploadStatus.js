export default function UploadStatus({ status, isOnline }) {
  if (!status && isOnline) return null

  return (
    <div className="mt-4 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
      <div className="flex items-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full ${status.includes("success") ? "bg-blue-500 animate-pulse" : status ? "bg-yellow-500" : "bg-gray-300"}`}
        />
        <span className="text-sm text-[#171717]/60">Upload Status:</span>
        <span className="text-[#0e5f97] font-medium">
          {status || (isOnline ? "Waiting..." : "Will sync when online")}
        </span>
      </div>
      {!isOnline && (
        <p className="text-xs text-gray-500 mt-1 ml-4">
          Detection data will be stored locally and synchronized when internet connection is restored.
        </p>
      )}
    </div>
  )
}

