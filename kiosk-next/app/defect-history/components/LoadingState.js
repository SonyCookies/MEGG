// First, let's create a reusable loading component
export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0e5f97]"></div>
      <p className="text-sm text-gray-500">Loading data...</p>
    </div>
  )
}