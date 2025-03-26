import { getToken, onMessage, isSupported } from "firebase/messaging"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "../../config/firebaseConfig"

// FCM Vapid Key from your Firebase console
const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

// Initialize Firebase Cloud Messaging
let messaging = null

// Check if FCM is supported in this browser
export const isFCMSupported = async () => {
  return await isSupported()
}

// Initialize messaging if it hasn't been initialized yet
const initializeMessaging = async () => {
  try {
    // Check if FCM is supported
    const fcmSupported = await isFCMSupported()
    if (!fcmSupported) {
      console.log("Firebase Cloud Messaging is not supported in this browser")
      return false
    }

    // Import firebase/app dynamically to avoid SSR issues
    const { getApp } = await import("firebase/app")

    try {
      // Get the existing Firebase app instance
      const app = getApp()

      // Initialize messaging with the existing app
      if (!messaging) {
        const { getMessaging: getMessagingImport } = await import("firebase/messaging")
        messaging = getMessagingImport(app)
      }

      return true
    } catch (error) {
      console.error("Error getting Firebase app:", error)
      return false
    }
  } catch (error) {
    console.error("Error initializing messaging:", error)
    return false
  }
}

// Request permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    const initialized = await initializeMessaging()
    if (!initialized) {
      // If FCM initialization fails, we can still use browser notifications
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }

    // Request permission
    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      console.log("Notification permission denied")
      return false
    }

    // Get FCM token
    try {
      const currentToken = await getToken(messaging, { vapidKey })

      if (currentToken) {
        console.log("FCM Token:", currentToken)

        // Save the token to Firestore
        const user = auth.currentUser
        if (user) {
          await saveTokenToFirestore(currentToken, user.uid)
        }

        return true
      } else {
        console.log("No registration token available")
        return false
      }
    } catch (tokenError) {
      console.error("Error getting FCM token:", tokenError)
      // Even if we can't get an FCM token, we can still use browser notifications
      return permission === "granted"
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error)
    // Try to get browser notification permission as a fallback
    try {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    } catch (permError) {
      console.error("Error requesting browser notification permission:", permError)
      return false
    }
  }
}

// Save FCM token to Firestore
const saveTokenToFirestore = async (token, userId) => {
  try {
    const tokenRef = doc(db, "fcmTokens", userId)
    await setDoc(
      tokenRef,
      {
        token,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true },
    )

    console.log("Token saved to Firestore")
  } catch (error) {
    console.error("Error saving token to Firestore:", error)
  }
}

// Set up foreground message handler
export const setupForegroundMessageHandler = async () => {
  const initialized = await initializeMessaging()
  if (!initialized || !messaging) return

  onMessage(messaging, (payload) => {
    console.log("Message received in the foreground:", payload)

    // Display the notification using the Notification API
    if (payload.notification) {
      const { title, body } = payload.notification

      new Notification(title || "Notification", {
        body: body || "You have a new notification",
        icon: "/logo.png",
      })
    }
  })
}

// Show a welcome notification directly from the browser
const showWelcomeNotification = () => {
  if (Notification.permission === "granted") {
    new Notification("Welcome to MEGG TECH", {
      body: "You will now receive notifications",
      icon: "/logo.png",
    })
    return true
  }
  return false
}

// Send welcome notification when push notifications are enabled
export const sendWelcomeNotification = async (userId) => {
  try {
    console.log("Sending welcome notification for user:", userId)

    // First, show a local notification
    showWelcomeNotification()

    // Then, try to call the API to send a server-side notification
    try {
      // Try the simpler API route first
      const response = await fetch("/api/notifications/send-welcome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        console.warn("Simple API route failed, trying update-notification-settings")

        // If that fails, try the original API route
        const fallbackResponse = await fetch("/api/notifications/update-notification-settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            pushNotificationsEnabled: true,
          }),
        })

        if (!fallbackResponse.ok) {
          console.warn("Both API routes failed, but local notification was shown")
        }
      }
    } catch (apiError) {
      console.error("API call error:", apiError)
      console.log("Local notification was shown")
    }

    return true // Return true as long as we showed a notification locally
  } catch (error) {
    console.error("Error sending welcome notification:", error)

    // Try to show a local notification as a last resort
    showWelcomeNotification()

    return false
  }
}

// Unsubscribe from notifications
export const unsubscribeFromNotifications = async (userId) => {
  try {
    // Delete the token from Firestore
    const tokenRef = doc(db, "fcmTokens", userId)
    await setDoc(
      tokenRef,
      {
        token: null,
        updatedAt: new Date(),
      },
      { merge: true },
    )

    console.log("Unsubscribed from notifications")
    return true
  } catch (error) {
    console.error("Error unsubscribing from notifications:", error)
    return false
  }
}

