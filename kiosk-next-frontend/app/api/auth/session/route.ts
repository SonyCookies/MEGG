// app/api/auth/session/route.ts
import { NextResponse, NextRequest } from "next/server"
import { jwtVerify, JWTPayload } from "jose"

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable")
}

// Pre‐encoded secret for jose
const secret = new TextEncoder().encode(JWT_SECRET)

export interface SessionData {
  machineId: string
  expiresAt: number
  sessionToken: string
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<SessionData | { error: string }>> {
  try {
    // read cookies
    const sessionToken = request.cookies.get("session_token")?.value
    const machineId = request.cookies.get("machine_id")?.value

    if (!sessionToken || !machineId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // verify JWT
    const { payload } = (await jwtVerify(
      sessionToken,
      secret
    )) as { payload: JWTPayload & { machineId?: string; exp?: number } }

    // ensure payload.machineId matches cookie
    if (payload.machineId !== machineId) {
      return NextResponse.json(
        { error: "Machine ID mismatch" },
        { status: 401 }
      )
    }

    const expiresAt = payload.exp
    if (typeof expiresAt !== "number") {
      throw new Error("Token missing exp claim")
    }

    const data: SessionData = {
      machineId,
      expiresAt,
      sessionToken,
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Session verification error:", err)
    return NextResponse.json(
      { error: "Invalid session" },
      { status: 401 }
    )
  }
}
