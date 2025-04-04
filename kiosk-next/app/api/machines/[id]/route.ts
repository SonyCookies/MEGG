// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\api\machines\[id]\route.ts

import { NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { addAccessLog } from "../../../utils/logging"

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params; 
    const machineId = params.id;

    if (!machineId) {
      return NextResponse.json({ error: "Missing machine ID" }, { status: 400 });
    }

    const machineRef = doc(db, "machines", machineId);
    const machineDoc = await getDoc(machineRef);

    if (!machineDoc.exists()) {
      await addAccessLog(
        {
          action: "machine_details",
          status: "error",
          details: "Machine not found",
        },
        machineId 
      );
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    // await addAccessLog(
    //   {
    //     action: "machine_details",
    //     status: "success",
    //     details: "Machine details retrieved",
    //   },
    //   machineId
    // );

    return NextResponse.json({
      machine: machineDoc.data(),
    });
  } catch (error) {
    console.error("Error fetching machine details:", error);
    return NextResponse.json({ error: "Failed to fetch machine details" }, { status: 500 });
  }
}



