import { NextResponse } from "next/server"
import { auth, db } from "../../../config/firebaseConfig.js"
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"

// Get all notifications for the current user
export async function GET(request) {
  try {
    // Get the current user
    const user = auth.currentUser
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the limit from the URL query parameters
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const limitCount = limitParam ? Number.parseInt(limitParam, 10) : 10

    // Modified query to avoid requiring the composite index
    const q = query(collection(db, "notifications"), where("userId", "==", user.uid))

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

    // Sort the notifications by createdAt in memory
    notifications.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

    // Apply the limit after sorting
    if (notifications.length > limitCount) {
      notifications = notifications.slice(0, limitCount)
    }

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Error getting notifications:", error)
    return NextResponse.json({ error: "Failed to get notifications" }, { status: 500 })
  }
}

// Mark a notification as read
export async function PUT(request) {
  try {
    // Get the current user
    const user = auth.currentUser
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the notification ID from the request body
    const { notificationId, markAll } = await request.json()

    if (markAll) {
      // Mark all notifications as read
      const q = query(collection(db, "notifications"), where("userId", "==", user.uid), where("read", "==", false))

      const querySnapshot = await getDocs(q)

      const batch = []
      querySnapshot.forEach((document) => {
        const notificationRef = doc(db, "notifications", document.id)
        batch.push(updateDoc(notificationRef, { read: true }))
      })

      await Promise.all(batch)
      return NextResponse.json({ success: true, message: "All notifications marked as read" })
    } else if (notificationId) {
      // Mark a single notification as read
      const notificationRef = doc(db, "notifications", notificationId)

      // Verify the notification belongs to the current user
      const notificationSnap = await getDoc(notificationRef)
      if (!notificationSnap.exists()) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 })
      }

      const notificationData = notificationSnap.data()
      if (notificationData.userId !== user.uid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      await updateDoc(notificationRef, { read: true })
      return NextResponse.json({ success: true, message: "Notification marked as read" })
    } else {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 })
  }
}

// Delete a notification
export async function DELETE(request) {
  try {
    // Get the current user
    const user = auth.currentUser
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the notification ID from the URL query parameters
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get("id")

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    // Get the notification document
    const notificationRef = doc(db, "notifications", notificationId)
    const notificationSnap = await getDoc(notificationRef)

    if (!notificationSnap.exists()) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    // Verify the notification belongs to the current user
    const notificationData = notificationSnap.data()
    if (notificationData.userId !== user.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the notification
    await deleteDoc(notificationRef)

    return NextResponse.json({ success: true, message: "Notification deleted" })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
  }
}

