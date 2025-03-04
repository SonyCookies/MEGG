//D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\api\auth\session\route.ts

import { NextResponse } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function GET(request) {
  try {
    // Get cookies from the request
    const sessionToken = request.cookies.get("session_token")?.value
    const machineId = request.cookies.get("machine_id")?.value

    if (!sessionToken || !machineId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Verify the JWT token
    const { payload } = await jwtVerify(sessionToken, secret)

    // Verify that the machine ID in the token matches the cookie
    if (payload.machineId !== machineId) {
      throw new Error("Machine ID mismatch")
    }

    // Return the session data
    return NextResponse.json({
      machineId,
      expiresAt: payload.exp,
      sessionToken
    })
  } catch (error) {
    console.error("Session verification error:", error)
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }
}

