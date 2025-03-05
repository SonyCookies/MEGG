"use client";

import { useState, useRef, useEffect } from "react";
import { BarChart2, Calendar, Layers, List, ChevronDown } from "lucide-react";

import BatchReview from "./ui/defect/BatchReview";
import DailySummary from "./ui/defect/DailySummary";
import DefectLog from "./ui/defect/DefectLog";
import Statistics from "./ui/defect/Statistics";

export default function Defect() {
  const [selectedTab, setSelectedTab] = useState("defectLog");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Tab options for the dropdown
  const tabOptions = [
    { name: "Defect Log", value: "defectLog", icon: List },
    { name: "Statistics", value: "statistics", icon: BarChart2 },
    { name: "Daily Summary", value: "dailySummary", icon: Calendar },
    { name: "Batch Review", value: "batchReview", icon: Layers },
  ];

  // Get the currently selected tab
  const selectedOption = tabOptions.find(
    (option) => option.value === selectedTab
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4">
        {/* Mobile Dropdown */}
        <div
          ref={dropdownRef}
          className="block md:hidden p-6 border shadow rounded-2xl bg-white relative"
        >
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-4 font-semibold">
              <selectedOption.icon className="w-5 h-5 text-blue-500" />
              <div className="flex items-center gap-1">
                {selectedOption.name}
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-4 border bg-white shadow rounded-2xl overflow-hidden z-40 p-6 flex flex-col gap-6 w-full">
              <div className="flex flex-col gap-2">
                <h2 className="text-sm font-medium text-gray-500">
                  View Options
                </h2>
                <div className="flex flex-col gap-1">
                  {tabOptions.map(({ name, value, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => {
                        setSelectedTab(value);
                        setDropdownOpen(false);
                      }}
                      className={`px-4 py-3 rounded-lg flex items-center gap-4 transition-colors duration-150
                        ${
                          selectedTab === value
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "hover:bg-gray-300/20"
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Tab Buttons */}
        <div className="hidden md:flex text-sm gap-4 justify-center p-6 border shadow rounded-2xl bg-white">
          <button
            className={`px-4 py-3 flex items-center gap-2 rounded-lg border transition-colors duration-150 ${
              selectedTab === "defectLog"
                ? "text-white bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600"
                : "hover:bg-gray-300/20 text-gray-500"
            }`}
            onClick={() => setSelectedTab("defectLog")}
          >
            <List className="w-5 h-5" />
            Defect Log
          </button>
          <button
            className={`px-4 py-3 flex items-center gap-2 rounded-lg border transition-colors duration-150 ${
              selectedTab === "statistics"
                ? "text-white bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600"
                : "hover:bg-gray-300/20 text-gray-500"
            }`}
            onClick={() => setSelectedTab("statistics")}
          >
            <BarChart2 className="w-5 h-5" />
            Statistics
          </button>
          <button
            className={`px-4 py-3 flex items-center gap-2 rounded-lg border transition-colors duration-150 ${
              selectedTab === "dailySummary"
                ? "text-white bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600"
                : "hover:bg-gray-300/20 text-gray-500"
            }`}
            onClick={() => setSelectedTab("dailySummary")}
          >
            <Calendar className="w-5 h-5" />
            Daily Summary
          </button>
          <button
            className={`px-4 py-3 flex items-center gap-2 rounded-lg border transition-colors duration-150 ${
              selectedTab === "batchReview"
                ? "text-white bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600"
                : "hover:bg-gray-300/20 text-gray-500"
            }`}
            onClick={() => setSelectedTab("batchReview")}
          >
            <Layers className="w-5 h-5" />
            Batch Review
          </button>
        </div>

        {/* main content - conditional rendering based on selected tab */}
        <div className="border shadow rounded-2xl bg-white">
          {selectedTab === "defectLog" && <DefectLog />}
          {selectedTab === "statistics" && <Statistics />}
          {selectedTab === "dailySummary" && <DailySummary />}
          {selectedTab === "batchReview" && <BatchReview />}
        </div>
      </div>
    </div>
  );
}
