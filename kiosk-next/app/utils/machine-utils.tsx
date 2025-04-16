import { doc, setDoc } from "firebase/firestore"
import { db } from "../firebaseConfig"
import { generateToken } from "./crypto-utils"

// Define the stages of machine ID generation
const GENERATION_STAGES = [
  { name: "initialize", weight: 0.2 },
  { name: "generateKeys", weight: 0.3 },
  { name: "createId", weight: 0.4 },
  { name: "finalize", weight: 0.1 },
]

// Helper to simulate a task with progress reporting
const simulateTask = async (taskName: string, durationMs: number, onProgress: (progress: number) => void) => {
  console.log(`Starting task: ${taskName}`)
  const startTime = Date.now()
  const endTime = startTime + durationMs

  // Report progress every 50ms
  while (Date.now() < endTime) {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / durationMs, 1)
    onProgress(progress)
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  onProgress(1) // Ensure we report 100% at the end
  console.log(`Completed task: ${taskName}`)
}

function generateMachineId() {
  const prefix = "MEGG"
  const year = new Date().getFullYear().toString()
  // Generate a random 3-digit number (000-999)
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0")
  const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, "0")
  return `${prefix}-${year}-${random}-${sequence}`
}

export async function generateMachineQR(onProgress?: (overallProgress: number, currentStage: number) => void) {
  try {
    const overallProgress = 0
    let currentStageIndex = 0

    // Stage 1: Initialize
    if (onProgress) onProgress(0, 0)
    await simulateTask(GENERATION_STAGES[0].name, 800, (stageProgress) => {
      const currentProgress = stageProgress * GENERATION_STAGES[0].weight * 100
      if (onProgress) onProgress(currentProgress, 0)
    })

    // Stage 2: Generate Keys
    currentStageIndex = 1
    await simulateTask(GENERATION_STAGES[1].name, 1200, (stageProgress) => {
      const currentProgress = GENERATION_STAGES[0].weight * 100 + stageProgress * GENERATION_STAGES[1].weight * 100
      if (onProgress) onProgress(currentProgress, 1)
    })

    // Stage 3: Create ID
    currentStageIndex = 2
    const machineId = generateMachineId()
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    await simulateTask(GENERATION_STAGES[2].name, 1000, (stageProgress) => {
      const currentProgress =
        (GENERATION_STAGES[0].weight + GENERATION_STAGES[1].weight) * 100 +
        stageProgress * GENERATION_STAGES[2].weight * 100
      if (onProgress) onProgress(currentProgress, 2)
    })

    // Stage 4: Finalize (actual database operations)
    currentStageIndex = 3

    // Start the final stage progress reporting
    if (onProgress) {
      onProgress((GENERATION_STAGES[0].weight + GENERATION_STAGES[1].weight + GENERATION_STAGES[2].weight) * 100, 3)
    }

    // Perform actual database operations
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

    // Complete the progress
    if (onProgress) onProgress(100, 3)

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
