import { NextResponse } from "next/server"
import { firestore, messaging } from "../../../config/firebase-admin"

export async function POST(request) {
  try {
    const { userId, title, body, data } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Get the user's FCM token from Firestore
    const tokenDoc = await firestore.collection("fcmTokens").doc(userId).get()

    if (!tokenDoc.exists || !tokenDoc.data().token) {
      return NextResponse.json({ success: false, error: "No FCM token found for this user" }, { status: 404 })
    }

    const token = tokenDoc.data().token

    // Send the notification
    await messaging.send({
      token: token,
      notification: {
        title: title || "Notification",
        body: body || "You have a new notification",
      },
      data: data || {},
      webpush: {
        notification: {
          icon: "/logo.png",
          badge: "/badge.png",
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

