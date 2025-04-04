"use client"
import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import { auth, db } from "../../../../config/firebaseConfig"
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore"
import { usePushNotifications } from "../../../../hooks/notifications/UsePushNotification"

export default function NotificationSettings() {
  const [globalMessage, setGlobalMessage] = useState("")
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [inAppNotifications, setInAppNotifications] = useState(false)
  const [defectAlerts, setDefectAlerts] = useState(false)
  const [machineAlerts, setMachineAlerts] = useState(false)
  const [loading, setLoading] = useState(true)

  const {
    permissionGranted,
    loading: pushLoading,
    error: pushError,
    enablePushNotifications,
    disablePushNotifications,
  } = usePushNotifications()

  // Load user notification settings
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const user = auth.currentUser
        if (user) {
          // Check if notification settings document exists
          const settingsRef = doc(db, "notificationSettings", user.uid)
          const settingsSnap = await getDoc(settingsRef)

          if (settingsSnap.exists()) {
            const data = settingsSnap.data()
            setNotificationsEnabled(data.notificationsEnabled || false)
            setPushNotificationsEnabled(data.pushNotificationsEnabled || false)
            setEmailNotifications(data.emailNotifications || false)
            setInAppNotifications(data.inAppNotifications || false)
            setDefectAlerts(data.defectAlerts || false)
            setMachineAlerts(data.machineAlerts || false)

            // If push notifications are enabled in settings but not in browser, update settings
            if (data.pushNotificationsEnabled && !permissionGranted) {
              setPushNotificationsEnabled(false)
            }
          } else {
            // Create default settings if they don't exist
            const defaultSettings = {
              notificationsEnabled: false,
              pushNotificationsEnabled: false,
              emailNotifications: false,
              inAppNotifications: false,
              defectAlerts: false,
              machineAlerts: false,
              userId: user.uid,
              createdAt: new Date(),
              updatedAt: new Date(),
            }

            // Use setDoc instead of updateDoc for new documents
            await setDoc(settingsRef, defaultSettings)
          }
        }
      } catch (error) {
        console.error("Error loading notification settings:", error)
      } finally {
        setLoading(false)
      }
    }

    loadNotificationSettings()
  }, [permissionGranted])

  // Save notification settings
  const saveNotificationSettings = async () => {
    try {
      const user = auth.currentUser
      if (!user) {
        setGlobalMessage("Please log in to save settings")
        return
      }

      const settingsRef = doc(db, "notificationSettings", user.uid)

      // Check if the document exists first
      const settingsSnap = await getDoc(settingsRef)

      const settings = {
        notificationsEnabled,
        pushNotificationsEnabled,
        emailNotifications: notificationsEnabled ? emailNotifications : false,
        inAppNotifications: notificationsEnabled ? inAppNotifications : false,
        defectAlerts: pushNotificationsEnabled ? defectAlerts : false,
        machineAlerts: pushNotificationsEnabled ? machineAlerts : false,
        userId: user.uid,
        updatedAt: new Date(),
      }

      // If document doesn't exist, add createdAt field
      if (!settingsSnap.exists()) {
        settings.createdAt = new Date()
        await setDoc(settingsRef, settings)
      } else {
        await updateDoc(settingsRef, settings)
      }

      setGlobalMessage("Notification settings saved successfully!")
      setTimeout(() => {
        setGlobalMessage("")
      }, 3000)
    } catch (error) {
      console.error("Error saving notification settings:", error)
      setGlobalMessage("Error saving notification settings")
      setTimeout(() => {
        setGlobalMessage("")
      }, 3000)
    }
  }

  const handlePushToggle = async () => {
    try {
      if (!pushNotificationsEnabled) {
        // Enable push notifications
        const granted = await enablePushNotifications()
        if (granted) {
          setPushNotificationsEnabled(true)

          // Send API request to trigger welcome notification
          const user = auth.currentUser
          if (user) {
            await fetch("/api/notifications/update-notification-settings", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: user.uid,
                pushNotificationsEnabled: true,
              }),
            })
          }
        } else {
          // Permission denied
          setGlobalMessage("Push notification permission denied")
          setTimeout(() => setGlobalMessage(""), 3000)
        }
      } else {
        // Disable push notifications
        await disablePushNotifications()
        setPushNotificationsEnabled(false)
      }
    } catch (error) {
      console.error("Error toggling push notifications:", error)
      setGlobalMessage("Error toggling push notifications")
      setTimeout(() => setGlobalMessage(""), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen h-full w-full">
        <div className="text-sm font-medium text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <form className="border-l flex flex-1 flex-col gap-10 lg:gap-8 p-8 bg-white border  xl:bg-none rounded-2xl xl:rounded-none shadow xl:shadow-none w-full">
        {/* Global validation message */}
        {globalMessage && (
          <div
            className={`border-l-4 rounded-lg px-4 py-2 w-full  ${
              globalMessage.includes("successful")
                ? "bg-green-100 border-green-500 text-green-500"
                : "bg-red-100 border-red-500 text-red-500"
            }`}
          >
            {globalMessage}
          </div>
        )}

        {/* Notifications */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between  gap-6 sm:gap-0">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-medium">Notifications</h3>
                <span className="text-gray-500 text-sm">Enable your preferred notifications.</span>
              </div>

              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {notificationsEnabled && (
              <div className="flex flex-col xl:flex-row gap-4 xl:gap-8">
                <div className="w-full bg-gray-300/20 text-sm mb-4 xl:mb-0 p-6 rounded-lg">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="text-lg">Email notifications</p>
                        <span className="text-gray-500">Users receive alerts via email for important events</span>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={emailNotifications}
                          onChange={() => setEmailNotifications(!emailNotifications)}
                        />
                        <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="text-lg">In-app notifications</p>
                        <span className="text-gray-500">Users receive alerts in-app for important events</span>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={inAppNotifications}
                          onChange={() => setInAppNotifications(!inAppNotifications)}
                        />
                        <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Push Notifications */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between  gap-6 sm:gap-0">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-medium">Push notifications</h3>
                <span className="text-gray-500 text-sm">Users can toggle push notifications on or off.</span>
              </div>

              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushNotificationsEnabled}
                  onChange={handlePushToggle}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {pushError && <div className="text-red-500 text-sm mt-2">{pushError}</div>}

            {pushNotificationsEnabled && (
              <div className="flex flex-col xl:flex-row gap-4 xl:gap-8">
                <div className="w-full bg-gray-300/20 text-sm mb-4 xl:mb-0 p-6 rounded-lg">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="text-lg">Defect alerts</p>
                        <span className="text-gray-500">Users receive alerts of defected eggs</span>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={defectAlerts}
                          onChange={() => setDefectAlerts(!defectAlerts)}
                        />
                        <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="text-lg">Machine alerts</p>
                        <span className="text-gray-500">Users receive alerts of machines activity</span>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={machineAlerts}
                          onChange={() => setMachineAlerts(!machineAlerts)}
                        />
                        <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={saveNotificationSettings}
            className="px-4 py-2 rounded-lg bg-blue-500 transition-colors duration-150 hover:bg-blue-600 text-white flex items-center gap-4"
          >
            <Save className="w-5 h-5" />
            Save settings
          </button>
        </div>
      </form>
    </>
  )
}

