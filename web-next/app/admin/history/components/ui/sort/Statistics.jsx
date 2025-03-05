import {
  BarChart2,
  Clock,
  RefreshCw,
  Target,
  Weight,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

// Function to get color based on size type
const getSizeTypeColor = (sizeType) => {
  switch (sizeType) {
    case "Small":
      return "text-blue-500";
    case "Medium":
      return "text-green-500";
    case "Large":
      return "text-yellow-500";
    case "Extra Large":
      return "text-orange-500";
    case "Jumbo":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

// Function to get background color based on size type
const getSizeTypeBgColor = (sizeType) => {
  switch (sizeType) {
    case "Small":
      return "bg-blue-100";
    case "Medium":
      return "bg-green-100";
    case "Large":
      return "bg-yellow-100";
    case "Extra Large":
      return "bg-orange-100";
    case "Jumbo":
      return "bg-red-100";
    default:
      return "bg-gray-100";
  }
};

// Function to get icon color based on size type
const getSizeTypeIconColor = (sizeType) => {
  switch (sizeType) {
    case "Small":
      return "text-blue-500";
    case "Medium":
      return "text-green-500";
    case "Large":
      return "text-yellow-500";
    case "Extra Large":
      return "text-orange-500";
    case "Jumbo":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

export default function Statistics() {
  // Most common size - this would typically come from your data analysis
  const mostCommonSize = "Jumbo";

  return (
    <div className="flex flex-col gap-6 bg-white border p-6 rounded-2xl shadow relative flex-1">
      {/* Header */}
      <div className="flex justify-between items-center ">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-medium">Statistics & Analytics</h3>

          <p className="text-gray-500 text-sm">
            View and analyze sort patterns
          </p>
        </div>
        <button className="text-gray-500 hover:text-gray-700 absolute right-6 top-6">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Time filters */}
      <div className="flex flex-col md:flex-row gap-6 justify-between ">
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-md bg-blue-500 text-white text-sm transition-colors duration-150 hover:bg-blue-600">
            24h
          </button>
          <button className="px-4 py-2 rounded-md text-gray-500 text-sm border transition-colors duration-150 hover:bg-gray-300/20">
            7d
          </button>
          <button className="px-4 py-2 rounded-md text-gray-500 text-sm border transition-colors duration-150 hover:bg-gray-300/20">
            30d
          </button>
          <button className="px-4 py-2 rounded-md text-gray-500 text-sm border transition-colors duration-150 hover:bg-gray-300/20">
            90d
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
          <span className="text-sm text-gray-500">Chart Type:</span>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded bg-blue-500 text-white transition-colors duration-150 hover:bg-blue-600">
              <BarChart2 className="w-5 h-5" />
            </button>
            <button className="p-1 rounded text-gray-400 border hover:bg-gray-300/20">
              <Clock className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Inspections */}
        <div className="border rounded-lg p-4 flex">
          <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-gray-500 text-sm mb-">Total Egg Sort</h3>
            <p className="text-4xl font-bold text-blue-500">9</p>

            <div className="flex flex-col gap-1">
              <div className="flex items-center text-xs mt-">
                <p className="text-gray-500">Total items inspected</p>
              </div>
              <div className="flex items-center text-xs text-green-500">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>100.0% from yesterday</span>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Most Common Size - with dynamic color */}
        <div className="border rounded-lg p-4 flex">
          <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-gray-500 text-sm mb-">Most Common Size</h3>
            <p
              className={`text-3xl font-bold ${getSizeTypeColor(
                mostCommonSize
              )}`}
            >
              {mostCommonSize}
            </p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center text-xs mt-">
                <p className="text-gray-500">Highest occurring size</p>
              </div>
              <div className="flex items-center text-xs mt- text-green-500">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                <span>44.4% of total</span>
              </div>
            </div>
          </div>
          <div
            className={`w-10 h-10 ${getSizeTypeBgColor(
              mostCommonSize
            )} rounded-full flex items-center justify-center ${getSizeTypeIconColor(
              mostCommonSize
            )}`}
          >
            <Weight className="w-5 h-5" />
          </div>
        </div>

        {/* Inspection Rate */}
        <div className="border rounded-lg p-4 flex">
          <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-gray-500 text-sm mb-">Inspection Rate</h3>
            <p className="text-4xl font-bold text-yellow-500">0 /hr</p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center text-xs mt-">
                <p className="text-gray-500">Average items per hour</p>
              </div>
              <div className="flex items-center text-xs mt- opacity-0">
                <span>placeholder</span>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Defect Distribution */}
      <div className="flex flex-col gap-4  ">
        <div className="flex justify-between items-center ">
          <div className="flex flex-col gap-1">
            <h3 className="font-medium text-gray-800">Sort Distribution</h3>
            <p className="text-sm text-gray-500">
              Breakdown of egg size and their frequencies
            </p>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Last updated: 9:28:37 PM
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 mt- mb- border rounded-lg">
          <div className="flex h-full items-end">
            <div className="flex flex-col items-center justify-end h-full flex-1">
              <div
                className="w-16 bg-orange-500 rounded-t-md"
                style={{ height: "70%" }}
              ></div>
              <div className="mt-2 text-xs text-gray-500 -rotate-45 origin-top-left">
                Extra Large
              </div>
            </div>
            <div className="flex flex-col items-center justify-end h-full flex-1">
              <div
                className="w-16 bg-yellow-500 rounded-t-md"
                style={{ height: "45%" }}
              ></div>
              <div className="mt-2 text-xs text-gray-500 -rotate-45 origin-top-left">
                Large
              </div>
            </div>
            <div className="flex flex-col items-center justify-end h-full flex-1">
              <div
                className="w-16 bg-blue-500 rounded-t-md"
                style={{ height: "30%" }}
              ></div>
              <div className="mt-2 text-xs text-gray-500 -rotate-45 origin-top-left">
                Small
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
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
