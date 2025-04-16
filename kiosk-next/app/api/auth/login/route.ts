import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { SignJWT } from "jose";
import { addAccessLog } from "../../../utils/logging";

const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_DURATION = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

const secret = new TextEncoder().encode(JWT_SECRET);

// Update the validateMachineId function to use proper TypeScript typing
const validateMachineId = (
  machineId: string | unknown
): { valid: boolean; error?: string; details?: string } => {
  // Log the received machine ID for debugging
  console.log(`[API] Received machineId: "${machineId}"`);

  // Check if it's a string
  if (typeof machineId !== "string") {
    return { valid: false, error: "Machine ID must be a string" };
  }

  // Check for proper format with regex
  const regex = /^MEGG-\d{4}-\d{3}-\d{3}$/;
  if (!regex.test(machineId)) {
    console.log(`[API] Invalid machineId format: "${machineId}"`);

    // Check if it has dashes
    if (!machineId.includes("-")) {
      return {
        valid: false,
        error: "Machine ID must include dashes (format: MEGG-YYYY-SSS-UUU)",
        details: "No dashes found in the machine ID",
      };
    }

    // Check the parts
    const parts = machineId.split("-");
    console.log(`[API] Machine ID parts:`, parts);

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

// Update the POST function to use proper TypeScript typing
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

    // Validate the machine ID format
    const validation = validateMachineId(machineId);
    if (!validation.valid) {
      console.error(`[API] Machine ID validation failed:`, validation);

      // Log the alternatives if provided
      if (machineIdAlternatives) {
        console.log(
          `[API] Alternative formats provided:`,
          machineIdAlternatives
        );
      }

      await addAccessLog(
        {
          action: "login",
          status: "error",
          details: `Invalid machine ID format: ${validation.error}`,
          validationDetails: validation.details,
        },
        machineId
      );

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
      // If the machine doesn't exist with the provided ID, log detailed information
      console.log(`[API] Machine not found with ID: "${machineId}"`);

      // Try to find the machine with alternative formats if provided
      let foundWithAlternative = false;
      let alternativeUsed = null;

      if (machineIdAlternatives) {
        for (const [format, altId] of Object.entries(machineIdAlternatives)) {
          if (!altId) continue;

          console.log(`[API] Trying alternative format ${format}: "${altId}"`);
          const altMachineRef = doc(db, "machines", altId as string);
          const altMachineDoc = await getDoc(altMachineRef);

          if (altMachineDoc.exists()) {
            console.log(
              `[API] Machine found with alternative format ${format}: "${altId}"`
            );
            foundWithAlternative = true;
            alternativeUsed = { format, id: altId };
            break;
          }
        }
      }

      await addAccessLog(
        {
          action: "login",
          status: "error",
          details: "Machine not found",
          triedAlternatives: !!machineIdAlternatives,
          foundWithAlternative,
          alternativeUsed,
        },
        machineId
      );

      // If we found with an alternative, suggest the correct format
      if (foundWithAlternative) {
        return NextResponse.json(
          {
            error:
              "Machine ID format incorrect. Please use the format MEGG-YYYY-SSS-UUU",
            suggestedFormat: alternativeUsed.id,
            code: "FORMAT_SUGGESTION",
          },
          { status: 404 }
        );
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

          await addAccessLog(
            {
              action: "login",
              status: "locked",
              details: "Account locked due to too many failed attempts",
            },
            machineId
          );

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

        await addAccessLog(
          {
            action: "login",
            status: "failed",
            details: `Failed login attempt (${newAttempts}/${MAX_ATTEMPTS})`,
          },
          machineId
        );

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
    } catch (error) {
      console.error("PIN verification error:", error);
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

    await addAccessLog(
      {
        action: "login",
        status: "success",
        details: "Login successful",
      },
      machineId
    );

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
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
