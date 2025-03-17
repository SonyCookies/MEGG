// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\api\egg-config\[machine_id]\route.ts

import { NextResponse } from "next/server"
import { db } from "../../../firebaseConfig"
import { doc, getDoc } from "firebase/firestore"

export async function GET(request, { params }) {
  try {
    // Extract machineId from params
    const { machine_id } = await params

    // console.log("API Route Called - Machine ID:", machine_id)

    if (!machine_id) {
      console.error("Machine ID is missing from route parameters")
      return NextResponse.json({ error: "Machine ID is required" }, { status: 400 })
    }

    // Fetch the egg configuration from Firestore
    const configRef = doc(db, "machine_configurations", machine_id)
    const configDoc = await getDoc(configRef)

    if (!configDoc.exists()) {
      console.log("No configuration found for machine:", machine_id)
      return NextResponse.json({
        message: "No configuration found for this machine",
        sizes: null,
      })
    }

    const configData = configDoc.data()
    // console.log("Found configuration data:", configData)

    return NextResponse.json({
      sizes: configData.eggSizes || null,
      updatedAt: configData.updatedAt || null,
    })
  } catch (error) {
    console.error("Error fetching egg configuration:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch egg configuration",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

