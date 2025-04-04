import { NextResponse } from "next/server"
import { db } from "../../../firebaseConfig"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"

export async function POST(request) {
  try {
    const body = await request.json()
    const { machineId, sizes } = body

    if (!machineId) {
      console.error("Machine ID is missing from request body")
      return NextResponse.json({ error: "Machine ID is required" }, { status: 400 })
    }

    if (!sizes) {
      console.error("Sizes data is missing from request body")
      return NextResponse.json({ error: "Sizes data is required" }, { status: 400 })
    }

    console.log("Saving egg configuration for machine:", machineId)

    // Verify the session has access to this machine
    const cookieHeader = request.headers.get("cookie")
    if (!cookieHeader) {
      return NextResponse.json({ error: "No cookies found" }, { status: 401 })
    }

    // Extract machine_id from cookies
    const cookies = cookieHeader.split(";").map((c) => c.trim())
    const machineCookie = cookies.find((c) => c.startsWith("machine_id="))
    const cookieMachineId = machineCookie ? machineCookie.split("=")[1] : null

    if (!cookieMachineId) {
      return NextResponse.json({ error: "No machine_id cookie found" }, { status: 401 })
    }

    if (decodeURIComponent(cookieMachineId) !== machineId) {
      console.error("Machine ID mismatch:", {
        cookieMachineId: decodeURIComponent(cookieMachineId),
        requestMachineId: machineId,
      })
      return NextResponse.json({ error: "Unauthorized access to machine configuration" }, { status: 403 })
    }

    // Validate the sizes data
    const sizeKeys = ["small", "medium", "large", "xl", "jumbo"]
    for (const key of sizeKeys) {
      if (!sizes[key] || sizes[key].min === null || sizes[key].max === null) {
        console.error(`Incomplete configuration: ${key} size is missing min or max value`)
        return NextResponse.json(
          {
            error: `Incomplete configuration: ${key} size is missing min or max value`,
          },
          { status: 400 },
        )
      }

      if (sizes[key].min > sizes[key].max) {
        console.error(`Invalid configuration: ${key} size has min greater than max`)
        return NextResponse.json(
          {
            error: `Invalid configuration: ${key} size has min greater than max`,
          },
          { status: 400 },
        )
      }
    }

    // Add debugging logs
    console.log("Configuration data to save:", sizes)

    // Save the configuration to Firestore
    const configRef = doc(db, "machine_configurations", machineId)
    await setDoc(
      configRef,
      {
        eggSizes: sizes,
        updatedAt: serverTimestamp(),
        machineId,
      },
      { merge: true },
    )

    console.log("Configuration saved successfully")

    return NextResponse.json({
      success: true,
      message: "Egg size configuration saved successfully",
    })
  } catch (error) {
    console.error("Error saving egg configuration:", error)
    return NextResponse.json({ error: "Failed to save egg configuration" }, { status: 500 })
  }
}

