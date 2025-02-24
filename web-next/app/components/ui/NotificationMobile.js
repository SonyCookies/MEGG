"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Ellipsis, Trash, Check } from "lucide-react";
import Image from "next/image";

export default function NotificationMobile({
  notificationOpen,
  setNotificationOpen,
}) {
  const [activeAction, setActiveAction] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const notificationRef = useRef(null);

  const notifications = [
    {
      id: 1,
      message: "New order received!",
      read: false,
      profileImage: "/default.png",
    },
    {
      id: 2,
      message: "Stock is running low.",
      read: true,
      profileImage: "/default.png",
    },
    {
      id: 3,
      message: "System update available.",
      read: false,
      profileImage: "/default.png",
    },
    {
      id: 4,
      message: "New message from John.",
      read: true,
      profileImage: "/default.png",
    },
    {
      id: 5,
      message: "New message from John.",
      read: true,
      profileImage: "/default.png",
    },
    {
      id: 6,
      message: "New message from John.",
      read: true,
      profileImage: "/default.png",
    },
    {
      id: 7,
      message: "New message from John.",
      read: true,
      profileImage: "/default.png",
    },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target) &&
        !e.target.closest(".notification-toggle")
      ) {
        setNotificationOpen(false);
        setActiveAction(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setNotificationOpen]);

  return (
    <>
      {/* Notification Button */}
      <button
        onClick={() => setNotificationOpen((prev) => !prev)}
        className="p-2 hover:bg-gray-300/20 rounded-lg flex lg:hidden relative notification-toggle"
      >
        <Bell />
      </button>

      {/* Notification Dropdown */}
      {notificationOpen && (
        <div
          ref={notificationRef}
          className="absolute bg-white rounded-2xl shadow right-0 top-full mt-4 w-full sm:w-96 overflow-hidden border divide-y"
        >
          <div className="flex flex-col divide-y">
            {/* Header */}
            <div className="flex items-center justify-between p-6">
              <h1 className="text-lg font-medium">Notifications</h1>
              {notifications.length > 5 && !showAll && (
                <div className="rounded-full w-8 h-8 flex items-center justify-center text-xs bg-blue-500 text-white">
                  {notifications.length > 99 ? "+99" : notifications.length - 5}
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="divide-y overflow-visible">
              {(showAll ? notifications : notifications.slice(0, 5)).map(
                (notification, index, array) => {
                  const isLast = index === array.length - 1;

                  return (
                    <div key={notification.id} className="relative">
                      <div
                        role="button"
                        className="bg-white transition-colors duration-150 hover:bg-gray-300/20 group p-4 flex items-center justify-between w-full"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative rounded-full w-12 h-12 border border-blue-500 overflow-hidden">
                            <Image
                              src={notification.profileImage}
                              alt="Profile"
                              fill
                              className="object-cover"
                              priority
                            />
                          </div>
                          <span className="text-start">
                            {notification.message}
                          </span>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveAction(
                              activeAction === notification.id
                                ? null
                                : notification.id
                            );
                          }}
                          className="rounded-full px-2 py-1 bg-gray-300/40 text-gray-500 transition-colors duration-150 hover:bg-gray-300/60"
                        >
                          <Ellipsis className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Action Dropdown */}
                      {activeAction === notification.id && (
                        <div
                          className={`absolute right-16 ${
                            isLast ? "bottom-8" : "top-8"
                          } bg-white border rounded-lg shadow-lg w-48 z-50 divide-y overflow-visible`}
                        >
                          <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-300/20">
                            <Check className="w-4 h-4" /> Mark as Read
                          </button>
                          <button className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-gray-300/20">
                            <Trash className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {/* "See All" Button */}
            {notifications.length > 5 && (
              <button
                className="w-full p-4 text-blue-500 hover:bg-gray-300/20 text-center font-medium"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show Less" : "See All"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}