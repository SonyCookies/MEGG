"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  X,
  Package,
  Monitor,
  History,
} from "lucide-react";

export function Sidebar({ mobileSidebarOpen, toggleMobileSidebar }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/overview", icon: LayoutDashboard, label: "Overview" },
    { href: "/admin/inventory", icon: Package, label: "Inventory" },
    { href: "/admin/machines", icon: Monitor, label: "Machines" },
    { href: "/admin/history", icon: History, label: "History" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  const isActive = (href) => pathname === href;

  return (
    <>
      {/* sidebar desktop */}
      <aside className="transition-all duration-300 ease-in-out hidden lg:flex sticky top-28 self-start w-80">
        <div className="p-6 flex flex-col gap-2 bg-white border rounded-2xl shadow w-full">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 rounded-lg  justify-start px-4 py-2 ${
                isActive(item.href)
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "hover:bg-gray-300/20"
              } `}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
          {/* <button
            className={`flex items-center gap-4 rounded-lg hover:bg-gray-300/20  ${
              sidebarOpen ? "justify-start px-4 py-2" : "justify-center p-2"
            }`}
          >
            <Settings className="w-5 h-5" />
            {sidebarOpen && <span>Settings</span>}

          </button> */}
        </div>
      </aside>

      {/* sidebar mobile */}
      {mobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={toggleMobileSidebar}
          ></div>

          {/* Sidebar */}
          <div
            className={`fixed top-0 left-0 h-screen w-72 bg-white shadow-lg transition-all ease-linear duration-300 z-50 ${
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="p-4 flex flex-col gap-2">
              {/* Close Button */}
              <button
                onClick={toggleMobileSidebar}
                className="p-2 rounded-lg hover:bg-gray-300/20 self-end"
              >
                <X />
              </button>

              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
                    isActive(item.href)
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "hover:bg-gray-300/20"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
