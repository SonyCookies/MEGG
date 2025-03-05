"use client";

import { useState } from "react";
import { Navbar } from "../../components/NavBar";
import { Sidebar } from "../../components/Sidebar";
import Notifications from "../../components/ui/NotificationDesktop";
import { Dot, TriangleAlert } from "lucide-react";

import EggCharts from "./components/EggCharts";

export default function OverviewPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 🌟 State to track the selected component
  const [activeComponent, setActiveComponent] = useState("sizing"); // Default to EggSizing

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-300/10 flex flex-col gap-6 p-4 lg:p-6">
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
            <div className="w-full flex gap-6">
              {/* main content here */}
              <div className="flex flex-1 flex-col gap-6">
                {/* Data charts */}
                <EggCharts />

                {/* middle */}
                <div className="flex flex-col md:flex-row flex-1 gap-6">
                  <div className="bg-white rounded-2xl shadow border p-6 flex-1">
                    <h3 className="text-xl font-medium">Live Alerts</h3>
                  </div>

                  <div className="bg-white rounded-2xl shadow border p-6 flex-1">
                    <h3 className="text-xl font-medium">Recent Events</h3>
                  </div>
                </div>

                {/* bottom */}
                <div className="flex flex-1 gap-6">
                  <div className="flex flex-1 flex-col gap-6 rounded-2xl border shadow bg-white p-6">
                    <h3 className="text-xl font-medium">Machine Status</h3>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between border transition-colors duration-150 hover:bg-gray-300/20 p-4 rounded-lg">
                        <div className="font-medium text-lg">Sort A</div>

                        <div className="flex items-center gap-1 animate-pulse text-green-500 font-medium">
                          <Dot />
                          <div>Online</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border transition-colors duration-150 hover:bg-gray-300/20 p-4 rounded-lg">
                        <div className="font-medium text-lg">Sort B</div>

                        <div className="flex items-center gap-1 animate-pulse text-yellow-400 font-medium">
                          <TriangleAlert className="w-5 h-5" />
                          <div>Maintenance</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border transition-colors duration-150 hover:bg-gray-300/20 p-4 rounded-lg">
                        <div className="font-medium text-lg">Sort C</div>

                        <div className="flex items-center gap-1 text-gray-500 font-medium">
                          <Dot />
                          <div>Offline</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* notification */}
              <Notifications />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
