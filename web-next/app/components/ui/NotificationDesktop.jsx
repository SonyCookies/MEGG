"use client";
import { useState } from "react";
import Image from "next/image";
import { Ellipsis, Check, Trash, Bell, BellOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Notifications() {
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
      message: "Your invoice is ready.",
      read: true,
      profileImage: "/default.png",
    },
    {
      id: 6,
      message: "Reminder: Meeting at 3 PM.",
      read: true,
      profileImage: "/default.png",
    },
  ];

  const [activeAction, setActiveAction] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const router = useRouter();

  const handleNotification = () => {
    router.push("/admin/notifications");
  };

  return (
    <div className="w-80 xl:w-[22rem] hidden xl:block">
      <div className="flex flex-col bg-white shadow border rounded-2xl overflow-hidden divide-y">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h1 className="text-lg font-medium">Notifications</h1>
          </div>
          {notifications.length > 0 && notifications.length > 5 && !showAll && (
            <div className="rounded-full w-8 h-8 flex items-center justify-center text-sm bg-blue-500 text-white">
              {notifications.length > 99 ? "+99" : notifications.length - 5}
            </div>
          )}
        </div>

        {/* Notifications List or Empty State */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <BellOff className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No notifications
            </h3>
            <p className="text-gray-500 text-sm">
              You don't have any notifications at the moment
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y overflow-visible">
              {(showAll ? notifications : notifications.slice(0, 5)).map(
                (notification, index, array) => {
                  const isLast = index === array.length - 1;

                  return (
                    <div key={notification.id} className="relative">
                      <div
                        role="button"
                        onClick={handleNotification}
                        className="bg-white transition-colors duration-150 hover:bg-gray-300/20 group p-4 flex items-center justify-between w-full"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative rounded-full w-12 h-12 border border-blue-500 overflow-hidden">
                            <Image
                              src={
                                notification.profileImage || "/placeholder.svg"
                              }
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

                      {/* Action Dropdown (Adjusts Position if Last Item) */}
                      {activeAction === notification.id && (
                        <div
                          className={`absolute right-16 ${
                            isLast ? "bottom-8" : "top-8"
                          } 
                          bg-white border rounded-lg shadow-lg w-48 z-50 divide-y overflow-visible`}
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
          </>
        )}
      </div>
    </div>
  );
}
