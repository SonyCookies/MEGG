// Mock data generator for testing the egg inventory UI

// Generate a random batch number
const generateBatchNumber = () => {
  const date = new Date()
  return `B${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 100)).padStart(2, "0")}`
}

// Generate a random timestamp within the last 24 hours
const generateTimestamp = () => {
  const now = new Date()
  const hoursAgo = Math.floor(Math.random() * 24)
  const minutesAgo = Math.floor(Math.random() * 60)
  now.setHours(now.getHours() - hoursAgo)
  now.setMinutes(now.getMinutes() - minutesAgo)
  return now.toISOString()
}

// Generate a random egg size
const generateEggSize = () => {
  const sizes = ["small", "medium", "large", "xlarge", "jumbo"]
  const weights = [0.1, 0.3, 0.4, 0.15, 0.05] // Distribution of egg sizes

  const random = Math.random()
  let sum = 0
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i]
    if (random < sum) {
      return sizes[i]
    }
  }
  return sizes[1] // Default to medium
}

// Generate a batch with size counts
export const generateBatch = (id, status = "active") => {
  const batchNumber = generateBatchNumber()
  const createdAt = generateTimestamp()

  // Generate random size counts
  const totalEggs = Math.floor(Math.random() * 1000) + 100
  const sizeCounts = {
    small: Math.floor(totalEggs * 0.1),
    medium: Math.floor(totalEggs * 0.3),
    large: Math.floor(totalEggs * 0.4),
    xlarge: Math.floor(totalEggs * 0.15),
    jumbo: Math.floor(totalEggs * 0.05),
  }

  return {
    id,
    batch_number: batchNumber,
    machine_id: "machine-001",
    created_at: createdAt,
    updated_at: new Date().toISOString(),
    status,
    size_counts: sizeCounts,
    total_count: Object.values(sizeCounts).reduce((sum, count) => sum + count, 0),
  }
}

// Generate an inventory record
export const generateInventoryRecord = (batchId, batchNumber) => {
  const eggSize = generateEggSize()
  const count = Math.floor(Math.random() * 20) + 1 // 1-20 eggs per record

  return {
    id: `inv-${Math.random().toString(36).substring(2, 9)}`,
    batch_id: batchId,
    batch_number: batchNumber,
    egg_size: eggSize,
    count: count,
    timestamp: generateTimestamp(),
    grader_id: Math.random() > 0.7 ? `grader-${Math.floor(Math.random() * 5) + 1}` : "system",
  }
}

// Generate a complete mock dataset
export const generateMockData = (batchCount = 5, recordsPerBatch = 20) => {
  const batches = []
  const inventoryRecords = []

  // Generate batches
  for (let i = 0; i < batchCount; i++) {
    const status = i === 0 ? "active" : i === 1 ? "active" : i === 2 ? "completed" : "archived"
    const batch = generateBatch(`batch-${i}`, status)
    batches.push(batch)

    // Generate inventory records for this batch
    for (let j = 0; j < recordsPerBatch; j++) {
      inventoryRecords.push(generateInventoryRecord(batch.id, batch.batch_number))
    }
  }

  return { batches, inventoryRecords }
}

// Generate a single new inventory record (for real-time updates)
export const generateNewInventoryRecord = (batch) => {
  return generateInventoryRecord(batch.id, batch.batch_number)
}

