// Generate a unique machine ID
export function generateMachineId() {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `MEGG-${timestamp}-${randomStr}`.toUpperCase()
}

// Check if the machine is registered
export async function checkRegistrationStatus() {
  // This is a placeholder implementation
  // In a real application, this would check against your backend
  try {
    // Simulate an API call
    const isRegistered = localStorage.getItem("machineRegistered") === "true"
    return isRegistered
  } catch (error) {
    console.error("Error checking registration status:", error)
    return false
  }
}

// Register the machine
export async function registerMachine(machineId) {
  // This is a placeholder implementation
  // In a real application, this would make an API call to your backend
  try {
    // Simulate an API call
    localStorage.setItem("machineRegistered", "true")
    localStorage.setItem("machineId", machineId)
    return true
  } catch (error) {
    console.error("Error registering machine:", error)
    return false
  }
}

