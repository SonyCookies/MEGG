import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../libs/firebaseConfig";
import { SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_DURATION = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

const secret = new TextEncoder().encode(JWT_SECRET);

const validateMachineId = (
  machineId: string | unknown
): { valid: boolean; error?: string; details?: string } => {
  if (typeof machineId !== "string") {
    return { valid: false, error: "Machine ID must be a string" };
  }

  const regex = /^MEGG-\d{4}-\d{3}-\d{3}$/;
  if (!regex.test(machineId)) {
    if (!machineId.includes("-")) {
      return {
        valid: false,
        error: "Machine ID must include dashes (format: MEGG-YYYY-SSS-UUU)",
        details: "No dashes found in the machine ID",
      };
    }

    const parts = machineId.split("-");

    if (parts.length !== 4) {
      return {
        valid: false,
        error: "Machine ID must be in format MEGG-YYYY-SSS-UUU",
        details: `Found ${parts.length} parts instead of 4`,
      };
    }

    if (parts[0] !== "MEGG") {
      return {
        valid: false,
        error: "Machine ID must start with 'MEGG'",
        details: `First part is '${parts[0]}' instead of 'MEGG'`,
      };
    }

    if (parts[1].length !== 4 || !/^\d+$/.test(parts[1])) {
      return {
        valid: false,
        error: "Year part must be 4 digits",
        details: `Second part '${parts[1]}' is not 4 digits`,
      };
    }

    if (parts[2].length !== 3 || !/^\d+$/.test(parts[2])) {
      return {
        valid: false,
        error: "Series part must be 3 digits",
        details: `Third part '${parts[2]}' is not 3 digits`,
      };
    }

    if (parts[3].length !== 3 || !/^\d+$/.test(parts[3])) {
      return {
        valid: false,
        error: "Unit part must be 3 digits",
        details: `Fourth part '${parts[3]}' is not 3 digits`,
      };
    }

    return {
      valid: false,
      error: "Machine ID format is invalid",
      details: "Unknown format issue",
    };
  }

  return { valid: true };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const machineId = body.machineId as string;
    const pin = body.pin as string;
    const machineIdAlternatives = body.machineIdAlternatives as
      | Record<string, string>
      | undefined;

    if (!machineId || !pin) {
      return NextResponse.json(
        { error: "Machine ID and PIN are required" },
        { status: 400 }
      );
    }

    const validation = validateMachineId(machineId);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.error,
          details: validation.details,
          code: "INVALID_FORMAT",
        },
        { status: 400 }
      );
    }

    const machineRef = doc(db, "machines", machineId as string);
    const machineDoc = await getDoc(machineRef);

    if (!machineDoc.exists()) {
      if (machineIdAlternatives) {
        for (const [, altId] of Object.entries(machineIdAlternatives)) {
          if (!altId) continue;

          const altMachineRef = doc(db, "machines", altId as string);
          const altMachineDoc = await getDoc(altMachineRef);

          if (altMachineDoc.exists()) {
            return NextResponse.json(
              {
                error:
                  "Machine ID format incorrect. Please use the format MEGG-YYYY-SSS-UUU",
                suggestedFormat: altId,
                code: "FORMAT_SUGGESTION",
              },
              { status: 404 }
            );
          }
        }
      }

      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    const data = machineDoc.data();

    if (data.lockedUntil && new Date(data.lockedUntil) > new Date()) {
      const lockedUntilTime = new Date(data.lockedUntil).getTime();
      const currentTime = new Date().getTime();
      const remainingTime = Math.ceil(
        (lockedUntilTime - currentTime) / 1000 / 60
      );

      return NextResponse.json(
        {
          error: `Too many failed attempts. Please try again in ${remainingTime} minutes.`,
          locked: true,
          remainingTime,
        },
        { status: 403 }
      );
    }

    try {
      const encoder = new TextEncoder();
      const pinData = encoder.encode(pin);
      const salt = Uint8Array.from(atob(data.salt), (c) => c.charCodeAt(0));
      const combinedData = new Uint8Array([...pinData, ...salt]);
      const hashBuffer = await crypto.subtle.digest("SHA-256", combinedData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));

      if (hashBase64 !== data.pin) {
        const newAttempts = (data.failedAttempts || 0) + 1;

        if (newAttempts >= MAX_ATTEMPTS) {
          const lockoutTime = new Date(Date.now() + 15 * 60 * 1000);
          await updateDoc(machineRef, {
            failedAttempts: newAttempts,
            lockedUntil: lockoutTime.toISOString(),
            lastFailedAttempt: new Date().toISOString(),
          });

          return NextResponse.json(
            {
              error: "Too many failed attempts. Account locked for 15 minutes.",
              locked: true,
            },
            { status: 403 }
          );
        }

        await updateDoc(machineRef, {
          failedAttempts: newAttempts,
          lastFailedAttempt: new Date().toISOString(),
        });

        return NextResponse.json(
          {
            error: `Incorrect PIN. ${
              MAX_ATTEMPTS - newAttempts
            } attempts remaining.`,
            remainingAttempts: MAX_ATTEMPTS - newAttempts,
          },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Error verifying PIN" },
        { status: 500 }
      );
    }

    const token = await new SignJWT({ machineId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);

    await updateDoc(machineRef, {
      lastLoginAt: new Date().toISOString(),
      lastSessionAt: new Date().toISOString(),
      failedAttempts: 0,
      lockedUntil: null,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
    });

    response.cookies.set({
      name: "session_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_DURATION / 1000,
    });

    response.cookies.set({
      name: "machine_id",
      value: machineId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_DURATION / 1000,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
