"use client";

import { useState } from "react";
import { Navbar } from "../../components/NavBar";
import { Sidebar } from "../../components/Sidebar";
import Notifications from "../../components/ui/NotificationDesktop";

import {Egg} from 'lucide-react'

export default function HistoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
            <div className="w-full flex gap-6">
              <div className="flex flex-1 flex-col gap-6">
                {/* Toggle Buttons */}
                <div className="flex items-center justify-center gap-4">
                  <button className="rounded-2xl border px-8 py-4 flex items-center justify-center gap-4 transition-colors duration-150 bg-white hover:bg-gray-200">
                    <Egg className="w-5 h-5" />
                    Egg Sort
                  </button>

                  <button className="rounded-2xl border px-8 py-4 flex items-center justify-center gap-4 transition-colors duration-150 bg-white hover:bg-gray-200">
                    <Egg className="w-5 h-5" />
                    Egg Defect
                  </button>
                </div>

                {/* main content */}
                <div className="flex flex-col gap-6 bg-white border p-6 rounded-2xl shadow">
                  asdsa
                </div>
              </div>

              <Notifications />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
