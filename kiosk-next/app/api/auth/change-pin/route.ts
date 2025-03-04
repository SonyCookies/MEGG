import { NextResponse } from "next/server"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"

export async function POST(request) {
  try {
    const { machineId, currentPin, newPin } = await request.json()

    if (!machineId || !newPin) {
      return NextResponse.json({ error: "Machine ID and new PIN are required" }, { status: 400 })
    }

    const machineRef = doc(db, "machines", machineId)
    const machineDoc = await getDoc(machineRef)

    if (!machineDoc.exists()) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 })
    }

    const data = machineDoc.data()

    // If PIN is already set up, verify current PIN first
    if (data.pin && currentPin) {
      const encoder = new TextEncoder()
      const pinData = encoder.encode(currentPin)
      const salt = Uint8Array.from(atob(data.salt), (c) => c.charCodeAt(0))
      const combinedData = new Uint8Array([...pinData, ...salt])
      const hashBuffer = await crypto.subtle.digest("SHA-256", combinedData)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray))

      if (hashBase64 !== data.pin) {
        return NextResponse.json({ error: "Current PIN is incorrect" }, { status: 401 })
      }
    }

    // Generate new salt and hash for the new PIN
    const newSalt = crypto.getRandomValues(new Uint8Array(16))
    const newSaltBase64 = btoa(String.fromCharCode.apply(null, Array.from(newSalt)))

    const encoder = new TextEncoder()
    const newPinData = encoder.encode(newPin)
    const combinedData = new Uint8Array([...newPinData, ...newSalt])
    const hashBuffer = await crypto.subtle.digest("SHA-256", combinedData)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray))

    await updateDoc(machineRef, {
      pin: hashBase64,
      salt: newSaltBase64,
      pinUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PIN change error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

