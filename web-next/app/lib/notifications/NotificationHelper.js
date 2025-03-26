import { auth } from "../../config/firebaseConfig"

// Function to send a notification to the current user
export const sendNotificationToUser = async (title, body, data = {}) => {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error("User not authenticated")
    }

    const response = await fetch("/api/notifications/send-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.uid,
        title,
        body,
        data,
      }),
    })

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error("Error sending notification:", error)
    return false
  }
}

