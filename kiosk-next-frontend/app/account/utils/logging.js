import { collection, addDoc } from "firebase/firestore";
import { db } from "../../libs/firebaseConfig";

export async function addAccessLog(data, machine_id) {
  try {
    const logData = {
      ...data,
      timestamp: new Date().toISOString(),
      machineId: machine_id,
    };

    await addDoc(collection(db, "machine_security_logs"), logData);
  } catch (error) {
    console.error("Error adding security log:", error);
  }
}
