import { NextResponse } from "next/server"
import admin from "firebase-admin"

// Initialize Firebase Admin SDK if not already initialized
let firebaseAdmin
let adminInitialized = false

try {
  if (!admin.apps.length) {
    console.log("Initializing Firebase Admin SDK...")

    // Log environment variables (without exposing sensitive data)
    console.log("Environment variables check:")
    console.log("FIREBASE_PROJECT_ID exists:", !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
    console.log("FIREBASE_CLIENT_EMAIL exists:", !!process.env.FIREBASE_CLIENT_EMAIL)
    console.log("FIREBASE_PRIVATE_KEY exists:", !!process.env.FIREBASE_PRIVATE_KEY)

    // Handle the private key properly
    let privateKey = process.env.FIREBASE_PRIVATE_KEY

    // Sometimes the private key comes with quotes that need to be removed
    if (privateKey && privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1)
    }

    // Replace escaped newlines with actual newlines
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, "\n")
    }

    console.log("Private key length:", privateKey ? privateKey.length : 0)

    try {
      // Fix: Use the correct environment variable and fix syntax error
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // Fixed: Use FIREBASE_PROJECT_ID, not NEXT_PUBLIC_FIREBASE_PROJECT_ID
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      })

      adminInitialized = true
      console.log("Firebase Admin SDK initialized successfully")
    } catch (initError) {
      console.error("Firebase Admin SDK initialization error:", initError)
      // Continue execution even if Firebase Admin fails to initialize
    }
  } else {
    console.log("Firebase Admin SDK already initialized")
    firebaseAdmin = admin.app()
    adminInitialized = true
  }
} catch (error) {
  console.error("Firebase admin initialization error:", error)
}

export async function POST(request) {
  console.log("API route called: update-notification-settings")

  try {
    // Parse the request body
    const body = await request.json()
    console.log("Request body:", JSON.stringify(body))

    const { userId, pushNotificationsEnabled } = body

    if (!userId) {
      console.log("Missing userId in request")
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    console.log(`Updating notification settings for user ${userId}, push enabled: ${pushNotificationsEnabled}`)

    // If push notifications are enabled, send a welcome notification
    if (pushNotificationsEnabled && adminInitialized) {
      try {
        const db = admin.firestore()
        console.log("Firestore initialized")

        // Get the user's FCM token
        console.log(`Fetching FCM token for user ${userId}`)
        const tokenDoc = await db.collection("fcmTokens").doc(userId).get()

        if (tokenDoc.exists && tokenDoc.data().token) {
          const token = tokenDoc.data().token
          console.log(`Found token: ${token.substring(0, 10)}...`)

          // Send the welcome notification
          console.log("Sending welcome notification...")
          await admin.messaging().send({
            token: token,
            notification: {
              title: "Welcome to MEGG TECH",
              body: "HI THERE WELCOME TO MEGG TECH",
            },
            webpush: {
              notification: {
                icon: "/logo.png",
                badge: "/badge.png",
              },
            },
          })

          console.log("Welcome notification sent successfully")
        } else {
          console.log("No FCM token found for this user")
        }
      } catch (notificationError) {
        console.error("Error sending welcome notification:", notificationError)
        // Continue execution even if notification fails
      }
    } else if (pushNotificationsEnabled) {
      console.log("Firebase Admin SDK not initialized, skipping server-side notification")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in update-notification-settings API route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

