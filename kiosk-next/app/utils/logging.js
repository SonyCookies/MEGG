import { collection, addDoc } from "firebase/firestore"
import { db } from "../firebaseConfig"

export async function addAccessLog(data) {
  try {
    const logData = {
      ...data,
      timestamp: new Date().toISOString(),
      machineId: localStorage.getItem("machineId"),
    }

    await addDoc(collection(db, "access_logs"), logData)
  } catch (error) {
    console.error("Error adding access log:", error)
  }
}

