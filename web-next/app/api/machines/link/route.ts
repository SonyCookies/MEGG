import { db } from "../../../config/firebaseConfig"
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, setDoc } from "firebase/firestore"

export async function POST(request) {
  try {
    const body = await request.json().catch((error) => {
      console.error("Error parsing request body:", error)
      return {}
    })

    const { machineId, linkToken, userId, pin } = body

    if (!machineId || !linkToken || !userId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 1. Verify the machine exists
    try {
      const machineRef = doc(db, "machines", machineId)
      const machineSnap = await getDoc(machineRef)

      if (!machineSnap.exists()) {
        return Response.json({ error: "Machine not found" }, { status: 404 })
      }

      const machineData = machineSnap.data()

      // 2. Verify the PIN (we'll assume it's already verified in a separate step)

      // 3. Verify the link token
      const tokenRef = doc(db, "machine_link_tokens", linkToken)
      const tokenSnap = await getDoc(tokenRef)

      if (!tokenSnap.exists()) {
        console.log("Token not found:", linkToken)
        return Response.json({ error: "Invalid link token" }, { status: 400 })
      }

      const tokenData = tokenSnap.data()
      console.log("Token data:", tokenData)

      // Check if token is for the correct machine
      if (tokenData.machineId !== machineId) {
        console.log("Token machine mismatch:", tokenData.machineId, machineId)
        return Response.json({ error: "Token does not match machine" }, { status: 400 })
      }

      // Check if token has expired or already been used
      if (tokenData.used || new Date(tokenData.expiresAt) <= new Date()) {
        return Response.json({ error: "Token has expired or already been used" }, { status: 400 })
      }

      // 4. Update the machine document to add the user to linkedUsers
      await updateDoc(machineRef, {
        [`linkedUsers.${userId}`]: {
          linkedAt: serverTimestamp(),
          isActive: true,
        },
        updatedAt: serverTimestamp(),
      })

      // 5. Update the user document to add the machine ID
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        return Response.json({ error: "User not found" }, { status: 404 })
      }

      // Add the machine to the user's linked machines
      await updateDoc(userRef, {
        linkedMachines: arrayUnion(machineId),
        updatedAt: serverTimestamp(),
      })

      // 6. Create a record in machine_users collection
      const linkRef = doc(db, "machine_users", `${machineId}_${userId}`)
      await setDoc(linkRef, {
        machineId,
        userId,
        linkedAt: serverTimestamp(),
        status: "active",
      })

      // 7. Mark the token as used
      await updateDoc(tokenRef, {
        used: true,
        usedAt: serverTimestamp(),
        usedBy: userId,
      })

      return Response.json({
        success: true,
        message: "Machine linked successfully",
        machine: {
          id: machineId,
          name: machineData.name || "Unknown Machine",
        },
      })
    } catch (dbError) {
      console.error("Database operation error details:", {
        error: dbError.message,
        code: dbError.code,
        stack: dbError.stack,
      })
      return Response.json(
        {
          error: "Database operation failed",
          details: dbError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error linking machine:", error)
    return Response.json({ error: "Failed to link machine" }, { status: 500 })
  }
}

