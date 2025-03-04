// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\utils\logging.js


import { collection, addDoc } from "firebase/firestore"
import { db } from "../firebaseConfig"

export async function addAccessLog(data, machine_id) {
  try {
    const logData = {
      ...data,
      timestamp: new Date().toISOString(),
      machineId: machine_id,
    }

    await addDoc(collection(db, "access_logs"), logData)
  } catch (error) {
    console.error("Error adding access log:", error)
  }
}

