import { NextResponse } from "next/server"
import { db } from "../../../firebaseConfig"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"

export async function POST(request) {
  try {
    const data = await request.json()

    // Validate the incoming data
    if (!data || typeof data !== "object" || !data.machine_id || data.step === undefined) {
      return NextResponse.json({ success: false, error: "Invalid calibration data" }, { status: 400 })
    }

    const { machine_id, step } = data

    // Get existing machine configuration
    const configRef = doc(db, "machine_configurations", machine_id)
    const configDoc = await getDoc(configRef)

    if (!configDoc.exists()) {
      return NextResponse.json({ success: false, error: "Machine configuration not found" }, { status: 404 })
    }

    const configData = configDoc.data()

    // Get existing camera settings or create default
    const cameraSettings = configData.cameraSettings || {}

    // Update calibration status based on step
    let calibrationData = cameraSettings.calibration || {}

    switch (step) {
      case 1:
        calibrationData = {
          ...calibrationData,
          step1Completed: true,
          step1CompletedAt: new Date().toISOString(),
        }
        break
      case 2:
        calibrationData = {
          ...calibrationData,
          step2Completed: true,
          step2CompletedAt: new Date().toISOString(),
        }
        break
      case 3:
        calibrationData = {
          ...calibrationData,
          step3Completed: true,
          step3CompletedAt: new Date().toISOString(),
          calibrationCompleted: true,
        }
        break
      default:
        return NextResponse.json({ success: false, error: "Invalid calibration step" }, { status: 400 })
    }

    // Update the camera settings with the new calibration data
    const updatedCameraSettings = {
      ...cameraSettings,
      calibration: calibrationData,
      updatedAt: new Date().toISOString(),
    }

    // Update the document
    await updateDoc(configRef, {
      cameraSettings: updatedCameraSettings,
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      calibration: calibrationData,
    })
  } catch (error) {
    console.error("Error during calibration:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform calibration step",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

