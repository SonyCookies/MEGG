/**
 * Service for interacting with the camera hardware and Firebase
 */
class CameraService {
  /**
   * Initialize the camera
   * @returns {Promise<MediaStream>} The camera stream
   */
  static async initializeCamera() {
    try {
      // Check if the browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support camera access")
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment", // Use the back camera if available
        },
      })

      return stream
    } catch (error) {
      console.error("Error accessing camera:", error)
      throw error
    }
  }

  /**
   * Fetch camera settings from Firebase via API
   * @param {string} machineId The machine ID
   * @returns {Promise<Object>} The camera settings
   */
  static async fetchSettings(machineId) {
    try {
      if (!machineId) {
        throw new Error("Machine ID is required")
      }

      const response = await fetch(`/api/camera/settings?machine_id=${encodeURIComponent(machineId)}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch camera settings: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch camera settings")
      }

      return data.settings
    } catch (error) {
      console.error("Error fetching camera settings:", error)
      throw error
    }
  }

  /**
   * Save camera settings to Firebase via API
   * @param {string} machineId The machine ID
   * @param {Object} settings The settings to save
   * @returns {Promise<Object>} The response from the API
   */
  static async saveSettings(machineId, settings) {
    try {
      if (!machineId) {
        throw new Error("Machine ID is required")
      }

      const response = await fetch("/api/camera/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machine_id: machineId,
          ...settings,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save camera settings: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to save camera settings")
      }

      return data.settings
    } catch (error) {
      console.error("Error saving camera settings:", error)
      throw error
    }
  }

  /**
   * Perform a calibration step
   * @param {string} machineId The machine ID
   * @param {number} step The calibration step number
   * @returns {Promise<Object>} The response from the API
   */
  static async performCalibrationStep(machineId, step) {
    try {
      if (!machineId) {
        throw new Error("Machine ID is required")
      }

      const response = await fetch("/api/camera/calibrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machine_id: machineId,
          step,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to perform calibration step: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to perform calibration step")
      }

      return data.calibration
    } catch (error) {
      console.error("Error during calibration:", error)
      throw error
    }
  }

  /**
   * Detect objects in an image
   * @param {HTMLVideoElement} videoElement The video element to capture from
   * @returns {Promise<Array>} Array of detected objects
   */
  static async detectObjects(videoElement) {
    // Create a canvas to capture the current video frame
    const canvas = document.createElement("canvas")
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const context = canvas.getContext("2d")

    // Draw the current video frame to the canvas
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

    // In a real implementation, you would:
    // 1. Convert the canvas to an image blob
    // 2. Send it to your backend for processing with computer vision
    // 3. Return the detected objects

    // For this example, we'll simulate detection
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Return simulated detected objects
    return [
      {
        x: canvas.width / 2 - 60,
        y: canvas.height / 2 - 35,
        width: 120,
        height: 70,
        confidence: 0.95,
        type: "egg",
      },
    ]
  }
}

export default CameraService

