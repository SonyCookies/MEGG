import { createNotification } from "./NotificationsService"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../config/firebaseConfig.js"

// Check if notifications are enabled for a user
async function areNotificationsEnabled(userId) {
  try {
    const settingsRef = doc(db, "notificationSettings", userId)
    const settingsSnap = await getDoc(settingsRef)

    if (settingsSnap.exists()) {
      const settings = settingsSnap.data()
      // Check if general notifications are enabled
      return settings.notificationsEnabled && settings.inAppNotifications
    }

    // Default to false if settings don't exist
    return false
  } catch (error) {
    console.error("Error checking notification settings:", error)
    return false
  }
}

// Track profile changes and create notifications
export async function trackProfileChanges(userId, oldData, newData) {
  try {
    // First check if notifications are enabled for this user
    const notificationsEnabled = await areNotificationsEnabled(userId)

    // If notifications are disabled, don't create any notifications
    if (!notificationsEnabled) {
      console.log("Notifications are disabled for user:", userId)
      return []
    }

    const changes = []

    // Check for profile image change
    if (oldData.profileImageUrl !== newData.profileImageUrl) {
      if (!oldData.profileImageUrl && newData.profileImageUrl) {
        // Profile picture added
        await createNotification(userId, "You've added a new profile picture", "profile_image_added")
        changes.push("profile picture")
      } else if (oldData.profileImageUrl && !newData.profileImageUrl) {
        // Profile picture removed
        await createNotification(userId, "You've removed your profile picture", "profile_image_removed")
        changes.push("profile picture")
      } else if (oldData.profileImageUrl && newData.profileImageUrl) {
        // Profile picture updated
        await createNotification(userId, "You've updated your profile picture", "profile_image_updated")
        changes.push("profile picture")
      }
    }

    // Check for name change
    if (oldData.fullname !== newData.fullname && newData.fullname) {
      await createNotification(userId, `You've updated your name to ${newData.fullname}`, "name_updated")
      changes.push("name")
    }

    // Check for email change
    if (oldData.email !== newData.email && newData.email) {
      await createNotification(userId, `You've updated your email to ${newData.email}`, "email_updated")
      changes.push("email")
    }

    // Check for phone change
    if (oldData.phone !== newData.phone && newData.phone) {
      await createNotification(userId, `You've updated your phone number`, "phone_updated")
      changes.push("phone")
    }

    // Check for address change
    if (oldData.address !== newData.address && newData.address) {
      await createNotification(userId, `You've updated your address`, "address_updated")
      changes.push("address")
    }

    // Check for birthday change
    if (oldData.birthday !== newData.birthday && newData.birthday) {
      await createNotification(userId, `You've updated your birthday`, "birthday_updated")
      changes.push("birthday")
    }

    // Check for gender change
    if (oldData.gender !== newData.gender && newData.gender) {
      await createNotification(userId, `You've updated your gender to ${newData.gender}`, "gender_updated")
      changes.push("gender")
    }

    return changes
  } catch (error) {
    console.error("Error tracking profile changes:", error)
    throw error
  }
}

