import { NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { addAccessLog } from "../../../utils/logging"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id: machineId } = await params

  if (!machineId) {
    return NextResponse.json({ error: "Missing machine ID" }, { status: 400 })
  }

  const machineRef = doc(db, "machines", machineId)
  const machineDoc = await getDoc(machineRef)

  if (!machineDoc.exists()) {
    await addAccessLog(
      {
        action: "machine_details",
        status: "error",
        details: "Machine not found",
      },
      machineId,
    )
    return NextResponse.json({ error: "Machine not found" }, { status: 404 })
  }

  return NextResponse.json({
    machine: machineDoc.data(),
  })
}
