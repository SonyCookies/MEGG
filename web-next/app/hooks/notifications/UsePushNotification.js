"use client"

import { useState, useEffect } from "react"
import { auth } from "../../config/firebaseConfig"
import {
  requestNotificationPermission,
  setupForegroundMessageHandler,
  sendWelcomeNotification,
  unsubscribeFromNotifications,
  isFCMSupported,
} from "../../lib/notifications/FirebaseMessaging"

export function usePushNotifications() {
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSupported, setIsSupported] = useState(true)

  // Initialize push notifications
  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        // Check if notifications are supported
        if (!("Notification" in window)) {
          setIsSupported(false)
          setError("This browser does not support push notifications")
          setLoading(false)
          return
        }

        // Check if FCM is supported
        const fcmSupported = await isFCMSupported()
        if (!fcmSupported) {
          setIsSupported(false)
          setError("Firebase Cloud Messaging is not supported in this browser")
          setLoading(false)
          return
        }

        // Check if permission is already granted
        if (Notification.permission === "granted") {
          setPermissionGranted(true)
          // Setup foreground handler if permission is already granted
          await setupForegroundMessageHandler()
        }

        setLoading(false)
      } catch (err) {
        console.error("Error initializing push notifications:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    initializePushNotifications()
  }, [])

  // Request permission and register for push notifications
  const enablePushNotifications = async () => {
    try {
      setLoading(true)

      if (!isSupported) {
        setError("Push notifications are not supported in this browser")
        setLoading(false)
        return false
      }

      const granted = await requestNotificationPermission()

      if (granted) {
        setPermissionGranted(true)
        await setupForegroundMessageHandler()

        // Send welcome notification
        const user = auth.currentUser
        if (user) {
          await sendWelcomeNotification(user.uid)
        }
      }

      setLoading(false)
      return granted
    } catch (err) {
      console.error("Error enabling push notifications:", err)
      setError(err.message)
      setLoading(false)
      return false
    }
  }

  // Disable push notifications
  const disablePushNotifications = async () => {
    try {
      setLoading(true)

      const user = auth.currentUser
      if (user) {
        await unsubscribeFromNotifications(user.uid)
      }

      setPermissionGranted(false)
      setLoading(false)
      return true
    } catch (err) {
      console.error("Error disabling push notifications:", err)
      setError(err.message)
      setLoading(false)
      return false
    }
  }

  return {
    permissionGranted,
    loading,
    error,
    isSupported,
    enablePushNotifications,
    disablePushNotifications,
  }
}

