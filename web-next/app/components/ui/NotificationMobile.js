"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, Ellipsis, Trash, Check } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { auth } from "../../config/firebaseConfig"
import { getUserNotifications, markNotificationAsRead, deleteNotification } from "../../lib/notifications/NotificationsService.js"

export default function NotificationMobile({ notificationOpen, setNotificationOpen }) {
  const [activeAction, setActiveAction] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationRef = useRef(null)

  const router = useRouter()

  const handleNotification = (notificationId) => {
    // Mark as read when clicked
    if (notificationId) {
      markNotificationAsRead(notificationId)
        .then(() => {
          // Update the notification in the state
          setNotifications((prevNotifications) =>
            prevNotifications.map((notification) =>
              notification.id === notificationId ? { ...notification, read: true } : notification,
            ),
          )

          // Update unread count
          setUnreadCount((prev) => Math.max(0, prev - 1))
        })
        .catch((error) => console.error("Error marking notification as read:", error))
    }

    router.push("/admin/notifications")
  }

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await markNotificationAsRead(notificationId)

      // Update the notification in the state
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification,
        ),
      )

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1))

      // Close the action dropdown
      setActiveAction(null)
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await deleteNotification(notificationId)

      // Remove the notification from the state
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.id !== notificationId),
      )

      // Update unread count if it was unread
      const wasUnread = notifications.find((n) => n.id === notificationId && !n.read)
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }

      // Close the action dropdown
      setActiveAction(null)
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const user = auth.currentUser
        if (user) {
          const userNotifications = await getUserNotifications(user.uid)
          setNotifications(userNotifications)

          // Count unread notifications
          const unreadNotifications = userNotifications.filter((n) => !n.read).length
          setUnreadCount(unreadNotifications)
        }
      } catch (error) {
        console.error("Error loading notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    if (notificationOpen) {
      loadNotifications()
    }
  }, [notificationOpen])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target) &&
        !e.target.closest(".notification-toggle")
      ) {
        setNotificationOpen(false)
        setActiveAction(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [setNotificationOpen])

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`

    return date.toLocaleDateString()
  }

  return (
    <>
      {/* Notification Button */}
      <button
        onClick={() => setNotificationOpen((prev) => !prev)}
        className="p-2 hover:bg-gray-300/20 rounded-lg flex xl:hidden relative notification-toggle"
      >
        <Bell />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
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

            {/* Loading State */}
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No notifications yet</div>
            ) : (
              <>
                {/* Notifications List */}
                <div className="divide-y overflow-visible">
                  {(showAll ? notifications : notifications.slice(0, 5)).map((notification, index, array) => {
                    const isLast = index === array.length - 1

                    return (
                      <div key={notification.id} className="relative">
                        <div
                          role="button"
                          onClick={() => handleNotification(notification.id)}
                          className={`${notification.read ? "bg-white" : "bg-blue-50"} transition-colors duration-150 hover:bg-gray-300/20 group p-4 flex items-center justify-between w-full`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative rounded-full w-12 h-12 border border-blue-500 overflow-hidden">
                              <Image
                                src={notification.profileImage || "/default.png"}
                                alt="Profile"
                                fill
                                className="object-cover"
                                priority
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-start">{notification.message}</span>
                              <span className="text-xs text-gray-500">{formatDate(notification.createdAt)}</span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveAction(activeAction === notification.id ? null : notification.id)
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
                            {!notification.read && (
                              <button
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-300/20"
                              >
                                <Check className="w-4 h-4" /> Mark as Read
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-gray-300/20"
                            >
                              <Trash className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
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
      )}
    </>
  )
}

