"use client";

import { useState } from "react";
import { Navbar } from "../../components/NavBar";
import { Sidebar } from "../../components/Sidebar";
import Notifications from "../../components/ui/NotificationDesktop";

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
    <div className="min-h-screen flex flex-col gap-6 bg-new-white p-4 lg:p-6">
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
                <div className="flex flex-col p-6 rounded-2xl shadow-md bg-white">
                  Content goes here (scrollable)
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