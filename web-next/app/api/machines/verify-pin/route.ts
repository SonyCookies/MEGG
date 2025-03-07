import { db } from "../../../config/firebaseConfig"
import { doc, getDoc } from "firebase/firestore"

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json().catch((error) => {
      console.error("Error parsing request body:", error)
      return {}
    })

    const { machineId, pin } = body

    // Validate required fields
    if (!machineId || !pin) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the machine document to check the PIN
    try {
      const machineRef = doc(db, "machines", machineId)
      const machineSnap = await getDoc(machineRef)

      if (!machineSnap.exists()) {
        return Response.json({ error: "Machine not found" }, { status: 404 })
      }

      const machineData = machineSnap.data()

      // Check if the machine has a PIN
      if (!machineData.pin || !machineData.salt) {
        return Response.json({ error: "This machine does not have a PIN set" }, { status: 400 })
      }

      // Get the stored hash and salt
      const storedHash = machineData.pin
      const salt = Uint8Array.from(atob(machineData.salt), (c) => c.charCodeAt(0))

      // Hash the provided PIN with the same salt
      const encoder = new TextEncoder()
      const pinData = encoder.encode(pin)
      const combinedData = new Uint8Array([...pinData, ...salt])

      // Use the subtle crypto API to hash the PIN
      const hashBuffer = await crypto.subtle.digest("SHA-256", combinedData)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashBase64 = btoa(String.fromCharCode(...hashArray))

      // Compare the hashes
      if (hashBase64 !== storedHash) {
        return Response.json({ error: "Invalid PIN. Please try again." }, { status: 401 })
      }

      // PIN is valid
      return Response.json({
        success: true,
        message: "PIN verified successfully",
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
    console.error("Server error in verify-pin route:", error)
    return Response.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}





