export function EggSizeStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-3xl bg-blue-500 p-6 shadow-sm text-white">
        <div className="flex flex-col h-full justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="h-6 w-6 rounded-full bg-blue-200" />
            <p className="text-3xl font-bold">1,234,567</p>
          </div>
          <p className="text-sm opacity-90">Total Eggs Sorted</p>
        </div>
      </div>
      <div className="rounded-3xl bg-green-500 p-6 shadow-sm text-white">
        <div className="flex flex-col h-full justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="h-6 w-6 rounded-full bg-green-200" />
            <p className="text-3xl font-bold">12,345</p>
          </div>
          <p className="text-sm opacity-90">Avg. Eggs/Hour</p>
        </div>
      </div>
      <div className="rounded-3xl bg-purple-500 p-6 shadow-sm text-white">
        <div className="flex flex-col h-full justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="h-6 w-6 rounded-full bg-purple-200" />
            <p className="text-3xl font-bold">98.5%</p>
          </div>
          <p className="text-sm opacity-90">Sorting Accuracy</p>
        </div>
      </div>
      <div className="rounded-3xl bg-yellow-500 p-6 shadow-sm text-white">
        <div className="flex flex-col h-full justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="h-6 w-6 rounded-full bg-yellow-200" />
            <p className="text-3xl font-bold">Large</p>
          </div>
          <p className="text-sm opacity-90">Most Common Size</p>
        </div>
      </div>
    </div>
  )
}

