import { NextResponse } from "next/server"
import admin from "firebase-admin"

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  })
}

export async function POST(request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Get the user's FCM token from Firestore
    const db = admin.firestore()
    const tokenDoc = await db.collection("fcmTokens").doc(userId).get()

    if (!tokenDoc.exists || !tokenDoc.data().token) {
      return NextResponse.json({ success: false, error: "No FCM token found for this user" }, { status: 404 })
    }

    const token = tokenDoc.data().token

    // Send the welcome notification
    await admin.messaging().send({
      token: token,
      notification: {
        title: "Welcome to MEGG TECH",
        body: "HI THERE WELCOME TO MEGG TECH",
      },
      android: {
        notification: {
          icon: "ic_notification",
          color: "#4285F4",
        },
      },
      apns: {
        payload: {
          aps: {
            "mutable-content": 1,
          },
        },
        fcmOptions: {
          image: "https://your-domain.com/logo.png",
        },
      },
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

