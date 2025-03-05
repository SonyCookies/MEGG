"use client";

import { useState } from "react";
import { EggDefectsChart } from "./ui/EggDefectsChart";
import { EggSizesChart } from "./ui/EggSizesChart";
import { TotalEggDefectChart } from "./ui/TotalEggDefectChart";
import { TotalEggsChart } from "./ui/TotalEggsChart";
import { Egg, Bug } from "lucide-react";
import { EggSizeStats } from "./ui/EggSizeStats";
import { EggDefectStats } from "./ui/EggDefectStats";

export default function EggCharts() {
  const [timeFrame, setTimeFrame] = useState("daily");
  const [chartType, setChartType] = useState("total");
  const [activeTab, setActiveTab] = useState("sizing"); // "sizing" or "defects"

  return (
    <div className="flex flex-col flex-1 gap-6">
      {/* Toggle Buttons */}
      <div className="flex items-center justify-center gap-4">
        <button
          className={`rounded-2xl border px-8 py-4 flex items-center gap-2 transition-colors duration-150 ${
            activeTab === "sizing"
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-white hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("sizing")}
        >
          <Egg className="w-5 h-5" />
          Egg Sizing
        </button>

        <button
          className={`rounded-2xl border px-8 py-4 flex items-center gap-2 transition-colors duration-150 ${
            activeTab === "defects"
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-white hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("defects")}
        >
          <Bug className="w-5 h-5" />
          Egg Defects
        </button>
      </div>

      {/* Overview Card */}
      <div className="flex flex-1 flex-col gap-6 bg-white p-6 rounded-2xl border shadow">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          {/* Dynamic Title */}
          <h3 className="text-xl font-medium">
            {activeTab === "sizing"
              ? "Egg Size Overview"
              : "Egg Defects Overview"}
          </h3>

          {/* Time Frame and Chart Type Selectors */}
          <div className="flex items-start sm:items-center gap-4">
            <select
              className="w-full sm:w-auto rounded-full border border-primary/20 bg-white px-3 py-2 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
            <select
              className="w-full sm:w-auto rounded-full border border-primary/20 bg-white px-3 py-2 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
            >
              <option value="total">Total Eggs</option>
              <option value="details">
                {activeTab === "sizing" ? "Egg Sizes" : "Defect Types"}
              </option>
            </select>
          </div>
        </div>

        {/* Chart Section */}
        <div className="h-[300px]">
          {activeTab === "sizing" ? (
            chartType === "total" ? (
              <TotalEggsChart timeFrame={timeFrame} />
            ) : (
              <EggSizesChart timeFrame={timeFrame} />
            )
          ) : chartType === "total" ? (
            <TotalEggDefectChart timeFrame={timeFrame} />
          ) : (
            <EggDefectsChart timeFrame={timeFrame} />
          )}
        </div>
      </div>

      {/* Statistics Grid */}
      {activeTab === "sizing" ? <EggSizeStats/> : <EggDefectStats/>}
    </div>
  );
}
