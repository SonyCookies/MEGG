"use client";

import { useState } from "react";
import { Navbar } from "../../components/NavBar";
import { Sidebar } from "../../components/Sidebar";
import Notifications from "../../components/ui/NotificationDesktop";
import { Dot, TriangleAlert } from "lucide-react";

export default function OverviewPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
                {/* top */}
                <div className="bg--500 flex flex-col md:flex-row gap-6">
                  <div className="flex flex-1 flex-col gap-6">
                    {/* Total Eggs Processed */}
                    <div className="bg-pink-500 p-6 rounded-2xl shadow border">
                      Total Eggs Processed
                    </div>

                    {/* Egg Total per Size */}
                    <div className="bg-red-500 p-6 rounded-2xl shadow border">
                      Egg Total Counts Per Size
                    </div>
                  </div>

                  {/* Egg Distribution Doughnut chart */}
                  <div className="flex flex-1 bg-blue-500 p-6 rounded-2xl border shadow">
                    Egg Distribution Doughnut chart
                  </div>
                </div>
                {/* middle */}
                <div className="grid grid-cols-4 gap-6 bg-rd-500">
                  <div className="flex flex-1 col-span-2 flex-col p-6 gap-4 bg-white border rounded-2xl shadow">
                    <h3 className="text-3xl font-semibold">2560</h3>
                    <span className="text-gray-500 text-sm">
                      Total Eggs Sorted
                    </span>
                  </div>

                  <div className="flex flex-1 col-span-2 flex-col p-6 gap-4 bg-white border rounded-2xl shadow">
                    <h3 className="text-3xl font-semibold">100</h3>
                    <span className="text-gray-500 text-sm">
                      Avg. Eggs per Hour
                    </span>
                  </div>

                  <div className="flex flex-1 col-span-2 flex-col p-6 gap-4 bg-white border rounded-2xl shadow">
                    <h3 className="text-3xl font-semibold">99.99%</h3>
                    <span className="text-gray-500 text-sm">
                      Sorting Accuracy
                    </span>
                  </div>

                  <div className="flex flex-1 col-span-2 flex-col p-6 gap-4 bg-white border rounded-2xl shadow">
                    <h3 className="text-3xl font-semibold">Large</h3>
                    <span className="text-gray-500 text-sm">
                      Most Common Size
                    </span>
                  </div>
                </div>
                {/* bottom */}
                <div className="flex items-start flex-1">
                  <div className="flex flex-1 flex-col gap-6 rounded-2xl border shadow bg-white p-6">
                    <h3 className="text-xl font-medium">Machine Status</h3>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between border transition-colors duration-150 hover:bg-gray-300/20 p-4 rounded-lg">
                        <div className="font-medium text-lg">Sort A</div>

                        <div className="flex items-center gap-1 animate-pulse text-green-500 font-medium">
                          <Dot />
                          <div className="">Online</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border transition-colors duration-150 hover:bg-gray-300/20 p-4 rounded-lg">
                        <div className="font-medium text-lg">Sort B</div>

                        <div className="flex items-center gap-1 animate-pulse text-yellow-400 font-medium">
                          <TriangleAlert className="w-5 h-5" />
                          <div className="">Maintenance</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border transition-colors duration-150 hover:bg-gray-300/20 p-4 rounded-lg">
                        <div className="font-medium text-lg">Sort B</div>

                        <div className="flex items-center gap-1 text-gray-500 font-medium">
                          <Dot/>
                          <div className="">Offline</div>
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
