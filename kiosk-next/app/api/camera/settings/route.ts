import { NextResponse } from "next/server"
import { db } from "../../../firebaseConfig"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"

export async function GET(request) {
  try {
    // Extract machine_id from the query parameters
    const url = new URL(request.url)
    const machine_id = url.searchParams.get("machine_id")

    if (!machine_id) {
      return NextResponse.json({ success: false, error: "Machine ID is required" }, { status: 400 })
    }

    // Fetch machine configuration from Firestore
    const configRef = doc(db, "machine_configurations", machine_id)
    const configDoc = await getDoc(configRef)

    if (!configDoc.exists()) {
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        settings: {
          sensitivity: 85,
          fieldOfView: "standard",
          lastCalibration: null,
          isCalibrated: false,
        },
      })
    }

    const configData = configDoc.data()

    // Extract camera settings from the machine configuration
    // If camera settings don't exist yet, return defaults
    const cameraSettings = configData.cameraSettings || {
      sensitivity: 85,
      fieldOfView: "standard",
      lastCalibration: null,
      isCalibrated: false,
    }

    return NextResponse.json({
      success: true,
      settings: cameraSettings,
    })
  } catch (error) {
    console.error("Error fetching camera settings:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch camera settings",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    const data = await request.json()

    // Validate the incoming data
    if (!data || typeof data !== "object" || !data.machine_id) {
      return NextResponse.json(
        { success: false, error: "Invalid settings data or missing machine_id" },
        { status: 400 },
      )
    }

    const { machine_id, ...settings } = data

    // Get existing machine configuration
    const configRef = doc(db, "machine_configurations", machine_id)
    const configDoc = await getDoc(configRef)

    if (!configDoc.exists()) {
      return NextResponse.json({ success: false, error: "Machine configuration not found" }, { status: 404 })
    }

    const configData = configDoc.data()

    // Update camera settings within the machine configuration
    const updatedCameraSettings = {
      ...(configData.cameraSettings || {}),
      ...settings,
      updatedAt: new Date().toISOString(),
    }

    // If this is a calibration completion, update the timestamp
    if (settings.isCalibrated) {
      updatedCameraSettings.lastCalibration = new Date().toISOString()
    }

    // Update the document with the new camera settings
    await updateDoc(configRef, {
      cameraSettings: updatedCameraSettings,
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      settings: updatedCameraSettings,
    })
  } catch (error) {
    console.error("Error updating camera settings:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update camera settings",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

