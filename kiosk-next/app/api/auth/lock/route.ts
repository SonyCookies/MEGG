import { NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { addAccessLog } from "../../../utils/logging";
import { machine } from "os";

export async function POST(request: Request) {
  try {
    const { machineId, reason = "manual_lock" } = await request.json();

    if (!machineId) {
      return NextResponse.json(
        { error: "Machine ID is required" },
        { status: 400 }
      );
    }

    const machineRef = doc(db, "machines", machineId);
    await updateDoc(machineRef, {
      locked: true,
      lockedAt: new Date().toISOString(),
      lockReason: reason,
    });

    await addAccessLog(
      {
        action: "machine_lock",
        status: "success",
        details: `Machine locked: ${reason}`,
      },
      machineId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lock error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
