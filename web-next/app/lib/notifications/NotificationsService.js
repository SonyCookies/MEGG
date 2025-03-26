import { db } from "../../config/firebaseConfig"
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore"

// Check if notifications are enabled before creating
async function checkNotificationSettings(userId, type) {
  try {
    const settingsRef = doc(db, "notificationSettings", userId)
    const settingsSnap = await getDoc(settingsRef)

    if (!settingsSnap.exists()) {
      return false // No settings, default to disabled
    }

    const settings = settingsSnap.data()

    // Check if general notifications are enabled
    if (!settings.notificationsEnabled) {
      return false
    }

    // Check if in-app notifications are enabled
    if (!settings.inAppNotifications) {
      return false
    }

    // For specific notification types, check relevant settings
    if (type.includes("defect") && !settings.defectAlerts) {
      return false
    }

    if (type.includes("machine") && !settings.machineAlerts) {
      return false
    }
    if (
      type.includes("password") ||
      type.includes("machine_linked") ||
      type.includes("machine_updated") ||
      type.includes("machine_unlinked")
    ) {
      return true
    }


    return true
  } catch (error) {
    console.error("Error checking notification settings:", error)
    return false // Default to not sending on error
  }
}

// Create a new notification
export async function createNotification(userId, message, type, read = false) {
  try {
    // Check if notifications are enabled for this user and type
    const notificationsEnabled = await checkNotificationSettings(userId, type)

    if (!notificationsEnabled) {
      console.log(`Notifications disabled for user ${userId} and type ${type}`)
      return null // Don't create notification if disabled
    }

    const notificationData = {
      userId,
      message,
      type,
      read,
      createdAt: serverTimestamp(),
      profileImage: "/default.png", // Default image
    }

    // Get user profile image if available
    try {
      const userRef = doc(db, "users", userId)
      const userSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", userId)))

      if (!userSnap.empty) {
        const userData = userSnap.docs[0].data()
        if (userData.profileImageUrl) {
          notificationData.profileImage = userData.profileImageUrl
        }
      }
    } catch (error) {
      console.error("Error getting user profile image:", error)
    }

    const docRef = await addDoc(collection(db, "notifications"), notificationData)
    return docRef.id
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

// Get notifications for a user
export async function getUserNotifications(userId, limitCount = 10) {
  try {
    // Modified query to avoid requiring the composite index
    // Instead of using orderBy with where, we'll just filter by userId
    const q = query(collection(db, "notifications"), where("userId", "==", userId))

    const querySnapshot = await getDocs(q)
    let notifications = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      notifications.push({
        id: doc.id,
        message: data.message,
        read: data.read,
        profileImage: data.profileImage || "/default.png",
        type: data.type,
        createdAt: data.createdAt ? new Date(data.createdAt.toDate()).toISOString() : new Date().toISOString(),
      })
    })

    // Sort the notifications by createdAt in memory instead of in the query
    notifications.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

    // Apply the limit after sorting
    if (notifications.length > limitCount) {
      notifications = notifications.slice(0, limitCount)
    }

    return notifications
  } catch (error) {
    console.error("Error getting notifications:", error)
    throw error
  }
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId) {
  try {
    const notificationRef = doc(db, "notifications", notificationId)
    await updateDoc(notificationRef, {
      read: true,
    })
    return true
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

// Delete a notification
export async function deleteNotification(notificationId) {
  try {
    const notificationRef = doc(db, "notifications", notificationId)
    await deleteDoc(notificationRef)
    return true
  } catch (error) {
    console.error("Error deleting notification:", error)
    throw error
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId) {
  try {
    const q = query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false))

    const querySnapshot = await getDocs(q)

    const batch = []
    querySnapshot.forEach((document) => {
      const notificationRef = doc(db, "notifications", document.id)
      batch.push(updateDoc(notificationRef, { read: true }))
    })

    await Promise.all(batch)
    return true
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    throw error
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId) {
  try {
    const q = query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false))

    const querySnapshot = await getDocs(q)
    return querySnapshot.size
  } catch (error) {
    console.error("Error getting unread notification count:", error)
    throw error
  }
}

