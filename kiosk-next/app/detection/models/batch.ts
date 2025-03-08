// Batch model definition
export interface Batch {
  id: string // Unique batch ID (e.g., B20230615-1430)
  batch_number: string
  machine_id: string // ID of the machine that created this batch
  created_at: string // ISO timestamp when batch was created
  updated_at: string // ISO timestamp when batch was last updated
  status: "active" | "completed" | "archived" // Batch status
  total_count: number // Total number of eggs processed
  defect_counts: {
    // Counts by defect type
    good: number
    dirty: number
    broken: number
    cracked: number
  }
  notes?: string // Optional notes about this batch
}

// Function to create a new batch ID
export const generateBatchNumber = () => {
  const date = new Date()
  return `B${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`
}

// Create a new batch object
export const createNewBatch = (machineId: string): Omit<Batch, "id"> => {
  const now = new Date().toISOString()
  return {
    batch_number: generateBatchNumber(),
    machine_id: machineId,
    created_at: now,
    updated_at: now,
    status: "active",
    total_count: 0,
    defect_counts: {
      good: 0,
      dirty: 0,
      broken: 0,
      cracked: 0,
    },
  }
}

