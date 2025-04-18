import { doc, setDoc } from "firebase/firestore"
import { db } from "../libs/firebaseConfig"
import { generateToken } from "./crypto-utils"

// ==========================================
// Types
// ==========================================
interface GenerationStage {
  name: string
  weight: number
  description: string
}

interface MachineGenerationResult {
  machineId: string
  linkToken: string
  expiresAt: string
  timestamp: string
}

type ProgressCallback = (overallProgress: number, currentStage: number) => void

// ==========================================
// Constants
// ==========================================
const GENERATION_STAGES: GenerationStage[] = [
  { name: "initialize", weight: 0.2, description: "Initializing machine registration" },
  { name: "generateKeys", weight: 0.3, description: "Generating security keys" },
  { name: "createId", weight: 0.4, description: "Creating machine identifier" },
  { name: "finalize", weight: 0.1, description: "Finalizing registration" },
]

const TOKEN_EXPIRY_MS = 30 * 60 * 1000 // 30 minutes

// ==========================================
// Helper Functions
// ==========================================

/**
 * Simulates a task with progress reporting
 * @param taskName - Name of the task being simulated
 * @param durationMs - Duration of the task in milliseconds
 * @param onProgress - Callback function to report progress (0-1)
 */
const simulateTask = async (
  taskName: string,
  durationMs: number,
  onProgress: (progress: number) => void,
): Promise<void> => {
  console.log(`Starting task: ${taskName}`)
  const startTime = Date.now()
  const endTime = startTime + durationMs
  const updateInterval = 50 // ms

  // Report progress at regular intervals
  while (Date.now() < endTime) {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / durationMs, 1)
    onProgress(progress)
    await new Promise((resolve) => setTimeout(resolve, updateInterval))
  }

  onProgress(1) // Ensure we report 100% at the end
  console.log(`Completed task: ${taskName}`)
}

/**
 * Generates a unique machine ID with a specific format
 * @returns A formatted machine ID string
 */
function generateMachineId(): string {
  const prefix = "MEGG"
  const year = new Date().getFullYear().toString()
  // Generate random parts with padding
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0")
  const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, "0")

  return `${prefix}-${year}-${random}-${sequence}`
}

/**
 * Calculates the overall progress based on completed stages and current stage progress
 * @param stageIndex - Current stage index
 * @param stageProgress - Progress of the current stage (0-1)
 * @returns Overall progress percentage (0-100)
 */
function calculateOverallProgress(stageIndex: number, stageProgress: number): number {
  let progress = 0

  // Add completed stages
  for (let i = 0; i < stageIndex; i++) {
    progress += GENERATION_STAGES[i].weight * 100
  }

  // Add current stage progress
  progress += stageProgress * GENERATION_STAGES[stageIndex].weight * 100

  return Math.min(Math.round(progress * 10) / 10, 100) // Round to 1 decimal place
}

// ==========================================
// Main Export Function
// ==========================================

/**
 * Generates a new machine registration with QR code data
 * @param onProgress - Optional callback for reporting progress
 * @returns Promise resolving to machine registration data
 */
export async function generateMachineQR(onProgress?: ProgressCallback): Promise<MachineGenerationResult> {
  try {
    let machineId = ""
    let token = ""

    // Stage 1: Initialize
    if (onProgress) onProgress(0, 0)
    await simulateTask(GENERATION_STAGES[0].name, 800, (stageProgress) => {
      if (onProgress) onProgress(calculateOverallProgress(0, stageProgress), 0)
    })

    // Stage 2: Generate Keys
    await simulateTask(GENERATION_STAGES[1].name, 1200, (stageProgress) => {
      if (onProgress) onProgress(calculateOverallProgress(1, stageProgress), 1)
    })

    // Stage 3: Create ID
    machineId = generateMachineId()
    token = generateToken()
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS)

    await simulateTask(GENERATION_STAGES[2].name, 1000, (stageProgress) => {
      if (onProgress) onProgress(calculateOverallProgress(2, stageProgress), 2)
    })

    // Stage 4: Finalize (actual database operations)
    if (onProgress) onProgress(calculateOverallProgress(3, 0), 3)

    // Create machine document
    await setDoc(doc(db, "machines", machineId), {
      id: machineId,
      createdAt: new Date().toISOString(),
      linkedUsers: {},
      pin: null,
      lastAuthAt: null,
      failedAttempts: 0,
      lockedUntil: null,
    })

    // Create machine link token
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
    throw new Error(
      error instanceof Error
        ? `Machine generation failed: ${error.message}`
        : "Machine generation failed with unknown error",
    )
  }
}

/**
 * Get the description for a specific generation stage
 * @param stageIndex - Index of the stage
 * @returns Description of the stage
 */
export function getStageDescription(stageIndex: number): string {
  return stageIndex >= 0 && stageIndex < GENERATION_STAGES.length
    ? GENERATION_STAGES[stageIndex].description
    : "Processing..."
}
