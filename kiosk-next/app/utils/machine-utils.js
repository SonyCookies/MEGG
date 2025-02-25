import { doc, setDoc } from "firebase/firestore"
import { db } from "../firebaseConfig"
import { generateToken } from "./crypto-utils"

export async function generateMachineQR() {
  try {
    const machineId = generateMachineId()
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) 

    await setDoc(doc(db, "machines", machineId), {
      id: machineId,
      createdAt: new Date().toISOString(),
      linkedUsers: {},
      pin: null,
      lastAuthAt: null,
      failedAttempts: 0,
      lockedUntil: null,
    })

    await setDoc(doc(db, "machine_link_tokens", token), {
      machineId,
      expiresAt: expiresAt.toISOString(),
      used: false,
      createdAt: new Date().toISOString(),
    })

    return {
      machineId,
      linkToken: token,
      expiresAt: expiresAt.toISOString(),
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error generating machine QR:", error)
    throw error
  }
}

function generateMachineId() {
  const prefix = "MEGG"
  const year = new Date().getFullYear().toString()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, "0")
  return `${prefix}-${year}-${random}-${sequence}`
}

