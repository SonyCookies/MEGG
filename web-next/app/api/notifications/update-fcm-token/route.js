import { NextResponse } from "next/server"
import { firestore } from "../../../config/firebase-admin"
import admin from "firebase-admin"

export async function POST(request) {
  try {
    const { userId, token } = await request.json()

    if (!userId || !token) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID and token are required",
        },
        { status: 400 },
      )
    }

    // Update the token in Firestore
    await firestore.collection("fcmTokens").doc(userId).set(
      {
        token,
        userId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating FCM token:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

