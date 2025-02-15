import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const machineId = searchParams.get("machineId")

  if (!machineId) {
    return NextResponse.json({ error: "Machine ID is required" }, { status: 400 })
  }

  // TODO: Implement actual status check logic with your backend

  return NextResponse.json({ isRegistered: Math.random() > 0.5 })
}

