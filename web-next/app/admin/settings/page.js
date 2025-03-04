"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation"; // Import this
import { Navbar } from "../../components/NavBar";
import { Sidebar } from "../../components/Sidebar";
import SettingsMenu from "./components/SettingsMenu";

// Import the components
import EditProfile from "./components/ui/EditProfile";
import ChangePassword from "./components/ui/ChangePassword";
import DeleteAccount from "./components/ui/DeleteAccount";
import AddMachines from "./components/ui/AddMachines";
import ModifyMachines from "./components/ui/ModifyMachines";
import NotificationSettings from "./components/ui/NotificationSettings"

export default function EditProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Read query from URL
  const searchParams = useSearchParams();
  const componentFromURL = searchParams.get("component");

  // Set selected component based on URL query
  const [selectedComponent, setSelectedComponent] = useState(
    componentFromURL || "EditProfile"
  );

  useEffect(() => {
    if (componentFromURL) {
      setSelectedComponent(componentFromURL);
    }
  }, [componentFromURL]);

  // Function to render the selected component
  const renderComponent = () => {
    switch (selectedComponent) {
      case "EditProfile":
        return <EditProfile />;
      case "ChangePassword":
        return <ChangePassword />;
      case "DeleteAccount":
        return <DeleteAccount />;
      case "AddMachines":
        return <AddMachines />;
      case "ModifyMachines":
        return <ModifyMachines />;
      case "NotificationSettings":
        return <NotificationSettings />;
      default:
        return <EditProfile />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col gap-6 bg-gray-300/10 p-4 lg:p-6">
      <Navbar
        sidebarOpen={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        toggleSidebar={() => setSidebarOpen((prev) => !prev)}
        toggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
      />

      <main>
        <div className="container mx-auto">
          <div className="flex gap-6">
            <Sidebar
              sidebarOpen={sidebarOpen}
              mobileSidebarOpen={mobileSidebarOpen}
              toggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
            />

            <div className="w-full">
              <div className="xl:overflow-hidden rounded-2xl xl:shadow xl:bg-white xl:border flex flex-col xl:flex-row gap-6 xl:gap-0">
                <SettingsMenu
                  setSelectedComponent={setSelectedComponent}
                  selectedComponent={selectedComponent}
                />
                {renderComponent()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}