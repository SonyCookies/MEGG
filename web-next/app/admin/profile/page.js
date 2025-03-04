"use client";

import { useState } from "react";
import { Navbar } from "../../components/NavBar";
import { Sidebar } from "../../components/Sidebar";
import Image from "next/image";
import { UserPen } from "lucide-react";
import { useRouter } from "next/navigation";
import Notifications from "../../components/ui/NotificationDesktop";

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const router = useRouter();

  const handleEditProfile = () => {
    router.push("/settings?component=EditProfile");
  };

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
                {/* top container */}
                <div className="flex flex-col md:flex-row gap-6 items-center p-6 rounded-2xl shadow bg-white border">
                  <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-6 bg-red-00 flex-1 bg-ed-500">
                    <div className="relative rounded-full w-28 h-28 border border-blue-500 overflow-hidden">
                      <Image
                        src="/default.png"
                        alt="Profile"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>

                    <div className="flex flex-col md:flex-row lg:flex-col xl:flex-row gap-6 lg:gap-4 xl:gap-6 items-center lg:items-start xl:items-center justify-between bg-blue-0 flex-1">
                      <div className="flex flex-col gap-1 text-center md:text-start">
                        {/* name */}
                        <h1 className="font-semibold text-2xl">
                          Edward Gatbonton
                        </h1>
                        {/* email */}
                        <span className="text-gray-500 text-sm">
                          edwardgatbonton13@gmail.com
                        </span>
                      </div>

                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleEditProfile}
                          className="px-4 py-2 rounded-lg bg-blue-500 text-white transition-colors duration-150 hover:bg-blue-600 flex items-center gap-4"
                        >
                          <UserPen className="w-5 h-5" />
                          Edit profile
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* button */}
                </div>

                {/* main container */}

                <div className="flex flex-col p-6 rounded-2xl shadow bg-white border gap-10">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-medium">Basic information</h3>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-4 md:col-span-2 p-4 rounded-lg group hover:bg-gray-300/20 transition-colors duration-150 border flex flex-col gap-1">
                        <span className="text-sm text-gray-500  transition-colors duration-150">
                          Fullname
                        </span>
                        <h3 className="font-medium text-lg  transition-colors duration-150">
                          Edward Gatbonton
                        </h3>
                      </div>

                      <div className="col-span-4 md:col-span-2 p-4 rounded-lg group hover:bg-gray-300/20 transition-colors duration-150 border flex flex-col gap-1">
                        <span className="text-sm text-gray-500  transition-colors duration-150">
                          Gender
                        </span>
                        <h3 className="font-medium text-lg  transition-colors duration-150">
                          Male
                        </h3>
                      </div>

                      <div className="col-span-4 md:col-span-2 p-4 rounded-lg group hover:bg-gray-300/20 transition-colors duration-150 border flex flex-col gap-1">
                        <span className="text-sm text-gray-500  transition-colors duration-150">
                          Birthday
                        </span>
                        <h3 className="font-medium text-lg  transition-colors duration-150">
                          September 26, 2003
                        </h3>
                      </div>

                      <div className="col-span-4 md:col-span-2 p-4 rounded-lg group hover:bg-gray-300/20 transition-colors duration-150 border flex flex-col gap-1">
                        <span className="text-sm text-gray-500  transition-colors duration-150">
                          Age
                        </span>
                        <h3 className="font-medium text-lg  transition-colors duration-150">
                          21
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-medium">Contact details</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 md:col-span-1 p-4 rounded-lg group hover:bg-gray-300/20 transition-colors duration-150 border flex flex-col gap-1">
                        <span className="text-sm text-gray-500  transition-colors duration-150">
                          Email
                        </span>
                        <h3 className="font-medium text-lg  transition-colors duration-150">
                          edwardgatbonton13@gmail.com
                        </h3>
                      </div>

                      <div className="col-span-2 md:col-span-1 p-4 rounded-lg group hover:bg-gray-300/20 transition-colors duration-150 border flex flex-col gap-1">
                        <span className="text-sm text-gray-500  transition-colors duration-150">
                          Phone
                        </span>
                        <h3 className="font-medium text-lg  transition-colors duration-150">
                          +63 916 256 1433
                        </h3>
                      </div>

                      <div className="col-span-2 p-4 rounded-lg group hover:bg-gray-300/20 transition-colors duration-150 border flex flex-col gap-1">
                        <span className="text-sm text-gray-500  transition-colors duration-150">
                          Residential address
                        </span>
                        <h3 className="font-medium text-lg  transition-colors duration-150">
                          Poblacion 4, Victoria, Oriental Mindoro
                        </h3>
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
