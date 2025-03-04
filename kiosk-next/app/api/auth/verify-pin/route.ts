import { NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"

export async function POST(request) {
  try {
    const { machineId, pin } = await request.json()

    if (!machineId || !pin) {
      return NextResponse.json({ error: "Machine ID and PIN are required" }, { status: 400 })
    }

    const machineRef = doc(db, "machines", machineId)
    const machineDoc = await getDoc(machineRef)

    if (!machineDoc.exists()) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 })
    }

    const data = machineDoc.data()

    try {
      const encoder = new TextEncoder()
      const pinData = encoder.encode(pin)
      const salt = Uint8Array.from(atob(data.salt), (c) => c.charCodeAt(0))
      const combinedData = new Uint8Array([...pinData, ...salt])
      const hashBuffer = await crypto.subtle.digest("SHA-256", combinedData)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray))

      if (hashBase64 !== data.pin) {
        return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 })
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("PIN verification error:", error)
      return NextResponse.json({ error: "Error verifying PIN" }, { status: 500 })
    }
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

