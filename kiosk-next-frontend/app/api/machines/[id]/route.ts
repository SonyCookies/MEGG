// app/api/machines/[id]/route.ts
import { NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../../libs/firebaseConfig"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id: machineId } = await params

  if (!machineId) {
    return NextResponse.json(
      { error: "Missing machine ID" },
      { status: 400 }
    )
  }

  const machineRef = doc(db, "machines", machineId)
  const machineDoc = await getDoc(machineRef)

  if (!machineDoc.exists()) {
    return NextResponse.json(
      { error: "Machine not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({
    machine: machineDoc.data(),
  })
}
