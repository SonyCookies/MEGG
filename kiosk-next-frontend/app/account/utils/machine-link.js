import { db } from "../../libs/firebaseConfig"
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore"
import { generateToken } from "./crypto-utils"

const LINK_TOKEN_EXPIRY = 30 * 60 * 1000 // 30 minutes

export function initializeMachineLink(machineId, onLinkStatusChange) {
  // Return the unsubscribe function from onSnapshot
  return onSnapshot(
    doc(db, "machines", machineId),
    (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const linkedUsers = data.linkedUsers || {}
        const isLinked = Object.keys(linkedUsers).length > 0
        const latestUser = isLinked ? Object.values(linkedUsers)[0] : null

        onLinkStatusChange({
          isLinked,
          linkedUser: latestUser,
          linkTime: latestUser?.linkedAt || null,
        })
      }
    },
    (error) => {
      console.error("Error listening to machine updates:", error)
    },
  )
}

export async function generateLinkToken(machineId) {
  try {
    const token = generateToken()
    const expiresAt = new Date(Date.now() + LINK_TOKEN_EXPIRY)

    // Store the token in Firebase
    const tokenRef = doc(db, "machine_link_tokens", token)
    await setDoc(tokenRef, {
      machineId,
      expiresAt: expiresAt.toISOString(),
      used: false,
      createdAt: new Date().toISOString(),
    })

    return {
      token,
      expiresAt: expiresAt.toISOString(),
    }
  } catch (error) {
    console.error("Error generating link token:", error)
    throw error
  }
}

export async function unlinkMachine(machineId, userId) {
  try {
    const machineRef = doc(db, "machines", machineId)
    const machineDoc = await getDoc(machineRef)

    if (!machineDoc.exists()) {
      throw new Error("Machine not found")
    }

    const data = machineDoc.data()
    const linkedUsers = { ...data.linkedUsers }
    delete linkedUsers[userId]

    await updateDoc(machineRef, {
      linkedUsers,
      lastUnlinked: new Date().toISOString(),
    })

    // Also update the machine_users collection
    const linkRef = doc(db, "machine_users", `${machineId}_${userId}`)
    await updateDoc(linkRef, {
      status: "revoked",
      revokedAt: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error unlinking machine:", error)
    throw error
  }
}

