"use client";

import { useState } from "react";
import { Navbar } from "../../components/NavBar";
import { Sidebar } from "../../components/Sidebar";
import Notifications from "../../components/ui/NotificationDesktop";
import { Bug,ArrowUpWideNarrow } from "lucide-react";

import Sort from "./components/Sort";
import Defect from "./components/Defect";

export default function HistoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState("sort");

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col gap-6 bg-gray-300/10 p-4 lg:p-6">
      <Navbar
        sidebarOpen={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleMobileSidebar={toggleMobileSidebar}
      />

      {/* main */}
      <main className="">
        <div className="container mx-auto bg-ble-500">
          <div className="flex gap-6">
            <Sidebar
              sidebarOpen={sidebarOpen}
              mobileSidebarOpen={mobileSidebarOpen}
              toggleMobileSidebar={toggleMobileSidebar}
            />

            {/* right */}
            <div className=" flex w-full gap-6">
              <div className="flex flex-col flex-1 gap-6 w-full">
                {/* Toggle Buttons */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setActiveComponent("sort")}
                    className={`rounded-2xl border px-8 py-4 flex items-center justify-center gap-2 transition-colors duration-150 
                      ${
                        activeComponent === "sort"
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "bg-white hover:bg-gray-200"
                      }`}
                  >
                    <ArrowUpWideNarrow className="w-5 h-5" />
                    Sort History
                  </button>

                  <button
                    onClick={() => setActiveComponent("defect")}
                    className={`rounded-2xl border px-8 py-4 flex items-center justify-center gap-2 transition-colors duration-150 
                      ${
                        activeComponent === "defect"
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "bg-white hover:bg-gray-200"
                      }`}
                  >
                    <Bug className="w-5 h-5" />
                    Defect History
                  </button>
                </div>

                {/* Conditional rendering of components */}
                {activeComponent === "sort" ? <Sort /> : <Defect />}
              </div>

              <Notifications />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
