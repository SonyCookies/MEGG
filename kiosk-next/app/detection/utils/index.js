export const generateBatchNumber = () => {
  const date = new Date()
  return `B${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`
}

export const logger = (component) => (message) => {
  console.log(`[${component}] ${new Date().toISOString()}: ${message}`)
}

// Create a global variable to store the last processed message ID
// This will persist across navigation within the same browser session
let globalLastProcessedMessageId = null

// Export functions to get and set the global ID instead of the variable itself
export const getLastProcessedMessageId = () => globalLastProcessedMessageId
export const setLastProcessedMessageId = (id) => {
  globalLastProcessedMessageId = id
}

