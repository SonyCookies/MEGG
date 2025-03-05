"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  UserPen,
  KeyRound,
  Trash2,
  MonitorCog,
  Monitor,
  Bell,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    title: "Manage Account",
    items: [
      { name: "Edit profile", icon: UserPen, component: "EditProfile" },
      { name: "Change password", icon: KeyRound, component: "ChangePassword" },
      {
        name: "Delete account",
        icon: Trash2,
        component: "DeleteAccount",
        className: "text-red-600",
        activeClass: "bg-red-600 text-white hover:bg-red-700",
      },
    ],
  },
  {
    title: "Manage Machine",
    items: [
      { name: "Add machines", icon: Monitor, component: "AddMachines" },
      {
        name: "Edit machines",
        icon: MonitorCog,
        component: "ModifyMachines",
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      { name: "Notifications", icon: Bell, component: "NotificationSettings" },
      {
        name: "Sign out",
        icon: LogOut,
        component: "SignOut",
        className: "text-red-600",
      },
    ],
  },
];

export default function SettingsMenu({
  setSelectedComponent,
  selectedComponent,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const router = useRouter();

  const signOut = () => {
    router.push("/login");
  };

  const selectedItem = menuItems
    .flatMap((section) => section.items)
    .find((item) => item.component === selectedComponent);

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
    <>
      {/* Mobile Dropdown */}
      <div
        ref={dropdownRef}
        className="block sm:block lg:block xl:hidden p-6 rounded-2xl shadow bg-white border relative"
      >
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4 font-semibold">
            <selectedItem.icon className="w-5 h-5 text-blue-500" />
            <div className="flex items-center gap-1 text">
              {selectedItem?.name || "Select Option"}
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-4 border bg-white shadow rounded-2xl overflow-hidden z-40 p-6 flex flex-col gap-6 ">
            {menuItems.map((section) => (
              <div key={section.title} className="flex flex-col gap-2">
                <h2 className="text-sm font-medium text-gray-500">
                  {section.title}
                </h2>
                <div className="flex flex-col gap-1">
                  {section.items.map(
                    ({
                      name,
                      icon: Icon,
                      component,
                      className,
                      activeClass,
                    }) => (
                      <button
                        key={component}
                        onClick={() => {
                          if (component === "SignOut") {
                            signOut();
                          } else {
                            setSelectedComponent(component);
                            setDropdownOpen(false);
                          }
                        }}
                        className={`px-4 py-3 rounded-lg flex items-center gap-4 transition-colors duration-150
                        ${
                          selectedComponent === component
                            ? activeClass ||
                              "bg-blue-500 text-white hover:bg-blue-600"
                            : "hover:bg-gray-300/20"
                        } 
                        ${className || ""}`}
                      >
                        <Icon className="w-5 h-5" />
                        {name}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden xl:flex flex-col gap-6 p-8 bg-white border xl:border xl:bg-none rounded-2xl xl:rounded-none shadow xl:shadow-none w-full sm:w-72">
        {menuItems.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-gray-500">
              {section.title}
            </h2>
            <div className="flex flex-col gap-1">
              {section.items.map(
                ({ name, icon: Icon, component, className, activeClass }) => (
                  <button
                    key={component}
                    onClick={() => {
                      if (component === "SignOut") {
                        signOut();
                      } else {
                        setSelectedComponent(component);
                      }
                    }}
                    className={`px-4 py-3 rounded-lg flex items-center gap-4 transition-colors duration-150
                        ${
                          selectedComponent === component
                            ? activeClass ||
                              "bg-blue-500 text-white hover:bg-blue-600"
                            : "hover:bg-gray-300/20"
                        } 
                        ${className || ""}`}
                  >
                    <Icon className="w-5 h-5" />
                    {name}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}