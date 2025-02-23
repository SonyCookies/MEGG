"use client";

import { useState } from "react";
import { Navbar } from "../../components/NavBar";
import { Sidebar } from "../../components/Sidebar";
import SettingsMenu from "./components/SettingsMenu";
import { Save, ChevronDown } from "lucide-react";

// Import the components
import EditProfile from "./components/ui/EditProfile";
import ChangePassword from "./components/ui/ChangePassword";
import DeleteAccount from "./components/ui/DeleteAccount";
import AddMachines from "./components/ui/AddMachines";
// import ModifyMachines from "./components/ui/ModifyMachines";
// import Notifications from "./components/ui/Notifications";

export default function EditProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState("EditProfile"); // Default view

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleMobileSidebar = () => setMobileSidebarOpen((prev) => !prev);

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
      // case "ModifyMachines":
      //   return <ModifyMachines />;
      // case "Notifications":
      //   return <Notifications />;
      default:
        return <EditProfile />;
    }
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
        <div className="container mx-auto">
          <div className="flex gap-6">
            <Sidebar
              sidebarOpen={sidebarOpen}
              mobileSidebarOpen={mobileSidebarOpen}
              toggleMobileSidebar={toggleMobileSidebar}
            />

            {/* right */}
            <div className="w-full">
              {/* main container */}
              <div className="xl:overflow-hidden rounded-2xl xl:shadow-md xl:bg-white flex flex-col sm:flex-row gap-6 xl:gap-0">
                {/* settings menu container*/}
                <SettingsMenu
                  setSelectedComponent={setSelectedComponent}
                  selectedComponent={selectedComponent}
                />

                {/* Display selected component */}
                {renderComponent()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}