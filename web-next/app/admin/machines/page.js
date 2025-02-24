"use client";

import { useState, useEffect } from "react";
import { Navbar } from "../../components/NavBar";
import { Sidebar } from "../../components/Sidebar";
import { Monitor, Activity, ShieldX, Dot, MonitorCog } from "lucide-react";
import Notifications from "../../components/ui/NotificationDesktop";
import Image from "next/image";

import { useRouter } from "next/navigation";

export default function MachinesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [machines, setMachines] = useState([]);

  const router = useRouter()

  const handleManageMachines = () => {
    router.push('/settings?component=AddMachines')
  }

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  // Fetch machines data (mock for now)
  useEffect(() => {
    const fetchMachines = async () => {
      // Replace this with actual API call
      const data = [
        { id: 1, name: "Machine-001", status: "online", added: "01/01/2021" },
        { id: 2, name: "Machine-002", status: "offline", added: "01/01/2021" },
      ];
      setMachines(data);
    };

    fetchMachines();
  }, []);

  const totalMachines = machines.length;
  const activeMachines = machines.filter((m) => m.status === "online").length;
  const offlineMachines = totalMachines - activeMachines;

  return (
    <div className="min-h-screen flex flex-col gap-6 bg-new-white p-4 lg:p-6">
      <Navbar
        sidebarOpen={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleMobileSidebar={toggleMobileSidebar}
      />

      <main>
        <div className="container mx-auto">
          <div className="flex gap-6">
            <Sidebar
              sidebarOpen={sidebarOpen}
              mobileSidebarOpen={mobileSidebarOpen}
              toggleMobileSidebar={toggleMobileSidebar}
            />

            <div className="w-full flex gap-6">
              <div className="flex flex-1 flex-col gap-6">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <div className="col-span-6 md:col-span-2 bg-blue-500 p-6 rounded-2xl shadow-md">
                    <h1 className="text-xl text-white flex items-center gap-2">
                      <Monitor className="w-5 h-5" /> Total:
                    </h1>
                    <h1 className="text-4xl font-medium text-white text-end">
                      {totalMachines}
                    </h1>
                  </div>
                  <div className="col-span-3 md:col-span-2 bg-new-yellow p-6 rounded-2xl shadow-md">
                    <h1 className="text-xl text-white flex items-center gap-2">
                      <Activity className="w-5 h-5" /> Active:
                    </h1>
                    <h1 className="text-4xl font-medium text-white text-end">
                      {activeMachines}
                    </h1>
                  </div>
                  <div className="col-span-3 md:col-span-2 bg-new-red p-6 rounded-2xl shadow-md">
                    <h1 className="text-xl text-white flex items-center gap-2">
                      <ShieldX className="w-5 h-5" /> Offline:
                    </h1>
                    <h1 className="text-4xl font-medium text-white text-end">
                      {offlineMachines}
                    </h1>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-medium">List of Machines</h3>

                    <button type="button" onClick={handleManageMachines} className="px-4 py-2 rounded-lg bg-blue-500 transition-colors duration-150 text-white hover:bg-blue-600 flex items-center gap-4">
                      <MonitorCog className="w-5 h-5" />
                      <span className="">Manage machines</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {machines.map((machine) => (
                      <div
                        key={machine.id}
                        className="col-span-4 md:col-span-2 bg-gray-300/20 rounded-lg shadow p-4 flex items-center hover:bg-gray-300/40 transition relative"
                      >
                        <div
                          className={`absolute top-2 right-4 text-sm flex items-center gap-1 ${
                            machine.status === "online"
                              ? "text-green-600 animate-pulse"
                              : "text-gray-500"
                          }`}
                        >
                          <Dot /> {machine.status}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="relative rounded-full w-20 h-20 border border-blue-500 overflow-hidden">
                            <Image
                              src="/default.png"
                              alt="Machine Logo"
                              fill
                              className="object-cover"
                              priority
                            />
                          </div>
                          <div className="flex flex-col gap-1 items-start">
                            <h1 className="font-medium text-l">
                              {machine.name}
                            </h1>
                            <span className="text-gray-500 text-sm">
                              Added: {machine.added}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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