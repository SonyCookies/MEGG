import { NextResponse } from "next/server"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { SignJWT } from "jose"
import { addAccessLog } from "../../../utils/logging"

const JWT_SECRET = process.env.JWT_SECRET
const SESSION_DURATION = 24 * 60 * 60 * 1000 
const MAX_ATTEMPTS = 5

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables")
}

const secret = new TextEncoder().encode(JWT_SECRET)

export async function POST(request) {
  try {
    const { machineId, pin } = await request.json()

    if (!machineId || !pin) {
      return NextResponse.json({ error: "Machine ID and PIN are required" }, { status: 400 })
    }

    const machineRef = doc(db, "machines", machineId)
    const machineDoc = await getDoc(machineRef)

    if (!machineDoc.exists()) {
      await addAccessLog({
        action: "login",
        status: "error",
        details: "Machine not found",
      }, machineId)
      return NextResponse.json({ error: "Machine not found" }, { status: 404 })
    }

    const data = machineDoc.data()

    if (data.lockedUntil && new Date(data.lockedUntil) > new Date()) {
      const lockedUntilTime = new Date(data.lockedUntil).getTime()
      const currentTime = new Date().getTime()
      const remainingTime = Math.ceil((lockedUntilTime - currentTime) / 1000 / 60)

      return NextResponse.json(
        {
          error: `Too many failed attempts. Please try again in ${remainingTime} minutes.`,
          locked: true,
          remainingTime,
        },
        { status: 403 },
      )
    }

    try {
      const encoder = new TextEncoder()
      const pinData = encoder.encode(pin)
      const salt = Uint8Array.from(atob(data.salt), (c) => c.charCodeAt(0))
      const combinedData = new Uint8Array([...pinData, ...salt])
      const hashBuffer = await crypto.subtle.digest("SHA-256", combinedData)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray))

      if (hashBase64 !== data.pin) {
        const newAttempts = (data.failedAttempts || 0) + 1

        if (newAttempts >= MAX_ATTEMPTS) {
          const lockoutTime = new Date(Date.now() + 15 * 60 * 1000)
          await updateDoc(machineRef, {
            failedAttempts: newAttempts,
            lockedUntil: lockoutTime.toISOString(),
            lastFailedAttempt: new Date().toISOString(),
          })

          await addAccessLog({
            action: "login",
            status: "locked",
            details: "Account locked due to too many failed attempts",
          }, machineId)

          return NextResponse.json(
            {
              error: "Too many failed attempts. Account locked for 15 minutes.",
              locked: true,
            },
            { status: 403 },
          )
        }

        await updateDoc(machineRef, {
          failedAttempts: newAttempts,
          lastFailedAttempt: new Date().toISOString(),
        })

        await addAccessLog({
          action: "login",
          status: "failed",
          details: `Failed login attempt (${newAttempts}/${MAX_ATTEMPTS})`,
        }, machineId)

        return NextResponse.json(
          {
            error: `Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`,
            remainingAttempts: MAX_ATTEMPTS - newAttempts,
          },
          { status: 401 },
        )
      }
    } catch (error) {
      console.error("PIN verification error:", error)
      return NextResponse.json({ error: "Error verifying PIN" }, { status: 500 })
    }

    const token = await new SignJWT({ machineId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h") 
      .sign(secret)

    await updateDoc(machineRef, {
      lastLoginAt: new Date().toISOString(),
      lastSessionAt: new Date().toISOString(),
      failedAttempts: 0,
      lockedUntil: null,
    })


    // Bugs Here
    await addAccessLog({
      action: "login",
      status: "success",
      details: "Login successful",
    }, machineId)
    //Bugs Here


    const response = NextResponse.json({
      success: true,
      message: "Login successful",
    })

    response.cookies.set({
      name: "session_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_DURATION / 1000,
    })

    response.cookies.set({
      name: "machine_id",
      value: machineId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_DURATION / 1000,
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

