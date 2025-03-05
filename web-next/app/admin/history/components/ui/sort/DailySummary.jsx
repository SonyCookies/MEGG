import {
  BarChart2,
  Clock,
  RefreshCw,
  Target,
  Calendar,
  TrendingUp,
  LineChart,
} from "lucide-react";

export default function DailySummary() {
  return (
    <div className="flex flex-col gap-6 bg-white border p-6 rounded-2xl shadow relative flex-1">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-medium text-gray-800">Daily Summary</h3>
          <p className="text-gray-500 text-sm">
            Track sort patterns over time
          </p>
        </div>
        <button className="text-gray-500 hover:text-gray-700 absolute top-6 right-6">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Chart Type Selection */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">Chart Type:</span>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded text-gray-400 border hover:bg-gray-100">
            <LineChart className="w-4 h-4" />
          </button>
          <button className="p-2 rounded bg-blue-500 text-white">
            <BarChart2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Period Total */}
        <div className="border rounded-lg p-4 flex">
          <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-gray-500 text-sm">Period Total</h3>
            <p className="text-4xl font-bold text-blue-600">6</p>

            <div className="flex flex-col gap-1">
              <div className="flex items-center text-xs">
                <p className="text-gray-500">Today's sort</p>
              </div>
              <div className="flex items-center text-xs text-green-500">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>Infinity% from previous 12h</span>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Daily Average */}
        <div className="border rounded-lg p-4 flex">
          <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-gray-500 text-sm">Daily Average</h3>
            <p className="text-4xl font-bold text-orange-500">6.0</p>

            <div className="flex flex-col gap-1">
              <div className="flex items-center text-xs">
                <p className="text-gray-500">Sort per day</p>
              </div>
              <div className="flex items-center text-xs opacity-0">
                <span>placeholder</span>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Peak Time */}
        <div className="border rounded-lg p-4 flex">
          <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-gray-500 text-sm">Peak Time</h3>
            <p className="text-4xl font-bold text-red-500">2-4 PM</p>

            <div className="flex flex-col gap-1">
              <div className="flex items-center text-xs">
                <p className="text-gray-500">Highest activity period</p>
              </div>
              <div className="flex items-center text-xs opacity-0">
                <span>placeholder</span>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sort Trends Chart */}
      <div className="border flex flex-col gap-6 rounded-lg p-6">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium text-gray-800">Sort Trends</h3>
          <p className="text-sm text-gray-500">
            Daily sort distribution over time
          </p>
        </div>

        {/* Chart */}
        <div className="flex flex-col gap-2">
          <div className="h-64 border rounded-lg">
            {/* Y-axis and chart area */}
            <div className="flex h-full items-end p-4 relative">
              {/* Y-axis */}
              <div className="absolute left-6 h-56 flex flex-col justify-between text-xs text-gray-500">
                <span>8</span>
                <span>6</span>
                <span>4</span>
                <span>2</span>
                <span>0</span>
              </div>

              {/* Bar */}
              <div className="ml-8 w-full flex items-end justify-center">
                <div className="flex flex-col items-center">
                  <div
                    className="w-16 bg-orange-500 rounded-t-md"
                    style={{ height: "75%" }}
                  ></div>
                  <div className="mt-2 text-xs text-gray-500">11:00 PM</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 flex items-center justify-end gap-2">
            <Clock className="w-4 h-4" />
            Last updated: 11:21:13 PM
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col lg:flex-row gap-4 justify-center">
          <div className="flex items-center gap-2 px-4 py-2 border rounded-full">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <div className="flex items-center justify-between text-sm w-full gap-1">
              <span className="">Small</span>
              <span>(22%)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 border rounded-full">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <div className="flex items-center justify-between text-sm w-full gap-1">
              <span className="">Medium</span>
              <span>(22%)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 border rounded-full">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <div className="flex items-center justify-between text-sm w-full gap-1">
              <span className="">Large</span>
              <span>(22%)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 border rounded-full">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <div className="flex items-center justify-between text-sm w-full gap-1">
              <span className="">XL</span>
              <span>(22%)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 border rounded-full">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <div className="flex items-center justify-between text-sm w-full gap-1">
              <span className="">Jumbo</span>
              <span>(22%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
