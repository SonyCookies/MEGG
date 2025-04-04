"use client"

import { useState } from "react"
import { Save } from "lucide-react"
import { auth, db } from "../../../../config/firebaseConfig.js"
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth"
import { createNotification } from "../../../../lib/notifications/NotificationsService.js"
import { doc, getDoc } from "firebase/firestore"

export default function ChangePassword() {
  const [globalMessage, setGlobalMessage] = useState("")
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const validate = (name, value) => {
    const validationErrors = { ...errors }

    if (name === "newPassword") {
      validationErrors.newPassword = value.length < 8 ? "Password must be at least 8 characters long." : ""
    }

    if (name === "confirmPassword") {
      validationErrors.confirmPassword = value !== formData.newPassword ? "Passwords do not match." : ""
    }

    setErrors(validationErrors)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData({ ...formData, [name]: value })
    validate(name, value)
  }

  // Function to check if notifications are enabled
  const areNotificationsEnabled = async (userId) => {
    try {
      const settingsRef = doc(db, "notificationSettings", userId)
      const settingsSnap = await getDoc(settingsRef)

      if (settingsSnap.exists()) {
        const settings = settingsSnap.data()
        return settings.notificationsEnabled && settings.inAppNotifications
      }
      return false
    } catch (error) {
      console.error("Error checking notification settings:", error)
      return false
    }
  }

  // Function to create password change notification
  const createPasswordChangeNotification = async (userId) => {
    try {
      // Check if notifications are enabled before creating
      const notificationsEnabled = await areNotificationsEnabled(userId)
      if (!notificationsEnabled) {
        console.log("Notifications are disabled for user:", userId)
        return
      }

      // Create the notification
      await createNotification(userId, "Your password has been successfully changed", "password_changed")
    } catch (error) {
      console.error("Error creating password change notification:", error)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = {}

    // Client-side validation
    if (formData.newPassword.length < 8) {
      validationErrors.newPassword = "Password must be at least 8 characters long."
    }

    if (formData.confirmPassword !== formData.newPassword) {
      validationErrors.confirmPassword = "Passwords do not match."
    }

    if (!formData.currentPassword) {
      validationErrors.currentPassword = "Current password is required."
    }

    setErrors(validationErrors)

    if (Object.keys(validationErrors).length === 0) {
      setLoading(true)
      try {
        const user = auth.currentUser

        if (!user || !user.email) {
          throw new Error("No authenticated user found")
        }

        // Create credentials with current password
        const credential = EmailAuthProvider.credential(user.email, formData.currentPassword)

        // Reauthenticate user
        await reauthenticateWithCredential(user, credential)

        // Update password
        await updatePassword(user, formData.newPassword)

        // Create notification for password change
        await createPasswordChangeNotification(user.uid)

        // Clear form
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })

        setGlobalMessage("Password updated successfully!")
      } catch (error) {
        console.error("Error updating password:", error)

        // Handle specific Firebase errors
        if (error.code === "auth/wrong-password") {
          setErrors({ currentPassword: "Current password is incorrect" })
          setGlobalMessage("Failed to update password: Current password is incorrect")
        } else if (error.code === "auth/requires-recent-login") {
          setGlobalMessage("Please sign in again to change your password")
        } else {
          setGlobalMessage("Failed to update password. Please try again.")
        }
      } finally {
        setLoading(false)

        // Clear success message after 3 seconds
        if (!errors.currentPassword) {
          setTimeout(() => {
            setGlobalMessage("")
          }, 3000)
        }
      }
    }
  }

  return (
    <>
      <form className="border-l flex flex-1 flex-col gap-10 lg:gap-8 p-8 bg-white border xl:bg-none rounded-2xl xl:rounded-none shadow xl:shadow-none w-full">
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

        {/* basic information */}
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-medium">Change password</h3>

          <div className="flex flex-col xl:flex-row gap-4 xl:gap-8">
            <div className="w-full text-gray-500 text-sm mb-4 xl:mb-0">
              Basic details used for identification, verification, and communication.
            </div>

            <div className="w-full grid grid-cols-3 gap-4">
              <div className="col-span-3 flex flex-col gap-1 justify-center">
                <label htmlFor="currentPassword">Current password</label>
                <input
                  type="password"
                  name="currentPassword"
                  id="currentPassword"
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                  placeholder="Enter your current password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
                {errors.currentPassword && <span className="text-red-500 text-sm">{errors.currentPassword}</span>}
              </div>
              <div className="col-span-3 flex flex-col gap-1 justify-center">
                <label htmlFor="newPassword">New password</label>
                <input
                  type="password"
                  name="newPassword"
                  id="newPassword"
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                  placeholder="Enter your new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
                {errors.newPassword && <span className="text-red-500 text-sm">{errors.newPassword}</span>}
              </div>
              <div className="col-span-3 flex flex-col gap-1 justify-center">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && <span className="text-red-500 text-sm">{errors.confirmPassword}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* buttons for submit */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-500 transition-colors duration-150 hover:bg-blue-600 text-white flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? "Updating..." : "Save changes"}
          </button>
        </div>
      </form>
    </>
  )
}

