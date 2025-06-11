const { contextBridge, ipcRenderer } = require("electron")

// Setup logging
const log = (...args) => console.log(`[Electron]`, ...args)
const error = (...args) => console.error(`[Electron]`, ...args)

log("Initializing")

// Expose version info and camera API to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  versions: process.versions,

  // Camera API
  getCameraDevices: async () => {
    log("Getting camera devices")
    try {
      const devices = await ipcRenderer.invoke("get-camera-devices")
      log("Found camera devices")
      return devices
    } catch (err) {
      error("Error in getCameraDevices:", err)
      return []
    }
  },

  startCamera: async (cameraId) => {
    log("Starting camera")
    try {
      const result = await ipcRenderer.invoke("start-camera", cameraId)
      log("Camera started")
      return result
    } catch (err) {
      error("Error in startCamera:", err)
      return false
    }
  },

  stopCamera: async () => {
    log("Stopping camera")
    try {
      await ipcRenderer.invoke("stop-camera")
      log("Camera stopped")
      return true
    } catch (err) {
      error("Error in stopCamera:", err)
      return false
    }
  },

  captureFrame: async () => {
    log("Capturing frame")
    try {
      const frame = await ipcRenderer.invoke("capture-frame")
      log("Frame captured")
      return frame
    } catch (err) {
      error("Error in captureFrame:", err)
      return ""
    }
  },

  getCameraPermissions: async () => {
    log("Checking camera permissions")
    try {
      const permissions = await ipcRenderer.invoke("get-camera-permissions")
      log("Camera permissions:", permissions)
      return permissions
    } catch (err) {
      error("Error in getCameraPermissions:", err)
      return false
    }
  },
})

log("Initialization complete")
