// This file must be placed in the public directory
// Simple service worker for push notifications

self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received.")

  let notificationData = {
    title: "MEGG TECH",
    body: "You have a new notification",
    icon: "/logo.png",
    badge: "/badge.png",
  }

  try {
    if (event.data) {
      const data = event.data.json()
      if (data.notification) {
        notificationData = {
          title: data.notification.title || notificationData.title,
          body: data.notification.body || notificationData.body,
          icon: data.notification.icon || notificationData.icon,
          badge: data.notification.badge || notificationData.badge,
        }
      }
    }
  } catch (error) {
    console.error("[Service Worker] Error parsing push data:", error)
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "1",
    },
  }

  event.waitUntil(self.registration.showNotification(notificationData.title, options))
})

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click received.")
  event.notification.close()

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
      })
      .then((clientList) => {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i]
          if (client.url === "/" && "focus" in client) return client.focus()
        }
        if (clients.openWindow) return clients.openWindow("/")
      }),
  )
})

