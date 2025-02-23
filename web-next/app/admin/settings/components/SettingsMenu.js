"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, CircleAlert} from "lucide-react"
import { PenIcon as UserPen, KeyRound, Trash2, MonitorIcon as MonitorCog, Monitor, Bell, LogOut } from "lucide-react"
import { auth } from "../../../config/firebaseConfig.js"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"

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
        name: "Modify machines",
        icon: MonitorCog,
        component: "ModifyMachines",
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      { name: "Notifications", icon: Bell, component: "Notifications" },
      {
        name: "Sign out",
        icon: LogOut,
        component: "SignOut",
        className: "text-red-600",
        onClick: async (router, setLoading, setShowConfirmModal) => {
          setShowConfirmModal(true)
        },
      },
    ],
  },
]

export default function SettingsMenu({ setSelectedComponent, selectedComponent }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const dropdownRef = useRef(null)
  const router = useRouter()

  const selectedItem = menuItems
    .flatMap((section) => section.items)
    .find((item) => item.component === selectedComponent)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen])

  const handleSignOut = async () => {
    try {
      setLoading(true)
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setLoading(false)
      setShowConfirmModal(false)
    }
  }

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick(router, setLoading, setShowConfirmModal)
    } else {
      setSelectedComponent(item.component)
    }
    setDropdownOpen(false)
  }

  return (
    <>
      {/* Mobile Dropdown */}
      <div ref={dropdownRef} className="block sm:hidden p-6 rounded-2xl shadow bg-white relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center justify-between"
          disabled={loading}
        >
          <div className="flex items-center gap-4 font-semibold">
            {selectedItem && <selectedItem.icon className="w-5 h-5" />}
            <div className="flex items-center gap-1 text">
              {selectedItem?.name || "Select Option"}
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 w-3/4 mt-4 border bg-white shadow rounded-2xl overflow-hidden z-40 p-6 flex flex-col gap-6">
            {menuItems.map((section) => (
              <div key={section.title} className="flex flex-col gap-2">
                <h2 className="text-sm font-medium text-gray-500">{section.title}</h2>
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <button
                      key={item.component}
                      onClick={() => handleItemClick(item)}
                      disabled={loading}
                      className={`px-4 py-3 rounded-lg flex items-center gap-4 transition-colors duration-150
                        ${
                          selectedComponent === item.component
                            ? item.activeClass || "bg-blue-500 text-white hover:bg-blue-600"
                            : "hover:bg-gray-300/20"
                        } 
                        ${item.className || ""} 
                        ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden sm:flex flex-col gap-6 p-8 bg-white xl:bg-none rounded-2xl xl:rounded-none shadow-md xl:shadow-none w-full sm:w-72">
        {menuItems.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-gray-500">{section.title}</h2>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => (
                <button
                  key={item.component}
                  onClick={() => handleItemClick(item)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg flex items-center gap-4 transition-colors duration-150
                    ${
                      selectedComponent === item.component
                        ? item.activeClass || "bg-blue-500 text-white hover:bg-blue-600"
                        : "hover:bg-gray-300/20"
                    } 
                    ${item.className || ""}
                    ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <item.icon className="w-5 h-5" />
                  {loading && item.component === "SignOut" ? "Signing out..." : item.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>


       {/* Confirmation Modal */}
       {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="p-6 lg:p-8 bg-white rounded-2xl shadow-lg z-50 w-full max-w-md flex flex-col gap-8">
            <div className="flex flex-col items-center gap-4">
              <CircleAlert className="w-12 h-12 text-red-600" />
              <div className="flex flex-col gap-1 text-center">
                <h2 className="text-xl font-semibold">Sign Out</h2>
                <p className="text-gray-500 text-sm">
                  Are you sure you want to sign out? You will need to sign in again to access your account.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg border transition-colors duration-150 hover:bg-gray-300/20 w-full"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-lg bg-red-600 transition-colors duration-150 text-white hover:bg-red-700 disabled:bg-red-300 w-full"
                disabled={loading}
              >
                {loading ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

