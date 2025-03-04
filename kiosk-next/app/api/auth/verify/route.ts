import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { addAccessLog } from "../../../utils/logging"

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables')
}
const secret = new TextEncoder().encode(JWT_SECRET)

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const machineId = request.headers.get("x-machine-id")

    if (!authHeader || !machineId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    try {
      const { payload } = await jwtVerify(token, secret)

      if (payload.machineId !== machineId) {
        throw new Error("Machine ID mismatch")
      }

      const expiresIn = Math.floor(payload.exp - Date.now() / 1000)
      const shouldRefresh = expiresIn < 3600 

      const machineRef = doc(db, "machines", machineId)
      const machineDoc = await getDoc(machineRef)

      if (!machineDoc.exists()) {
        await addAccessLog({
          action: "session_verify",
          machineId,
          status: "error",
          details: "Machine not found during session verification",
        })
        throw new Error("Machine not found")
      }

      const machineData = machineDoc.data()

      if (machineData.disabled) {
        await addAccessLog({
          action: "session_verify",
          machineId,
          status: "error",
          details: "Attempted access to disabled machine",
        })
        throw new Error("Machine is disabled")
      }

      if (machineData.lockedUntil && new Date(machineData.lockedUntil) > new Date()) {
        await addAccessLog({
          action: "session_verify",
          machineId,
          status: "error",
          details: "Attempted access to locked machine",
        })
        throw new Error("Machine is locked")
      }

      const lastActivity = new Date(machineData.lastSessionAt || 0)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

      if (lastActivity < fiveMinutesAgo) {
        await updateDoc(machineRef, {
          lastSessionAt: new Date().toISOString(),
        })
      }

      // Log successful verification
      await addAccessLog({
        action: "session_verify",
        machineId,
        status: "success",
        details: "Session verified successfully",
      })

      return NextResponse.json({
        valid: true,
        shouldRefresh,
        expiresIn,
      })
    } catch (error) {
      console.error("Token verification error:", error)

      await addAccessLog({
        action: "session_verify",
        machineId,
        status: "error",
        details: `Session verification failed: ${error.message}`,
      })

      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }
  } catch (error) {
    console.error("Verify error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

