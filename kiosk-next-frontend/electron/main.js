process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true"

const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")
const isDev = process.env.NODE_ENV === "development"

// Setup logging
const log = (...args) => console.log(`[Electron]`, ...args)
const error = (...args) => console.error(`[Electron]`, ...args)

log("Starting application")

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    // Add these for kiosk mode
    fullscreen: !isDev, // Fullscreen in production
    kiosk: !isDev, // Kiosk mode in production
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  const startUrl = isDev
  ? "http://localhost:3000"
  : "http://localhost:3000"; // In production, we'll still run next start

  mainWindow.loadURL(startUrl)

  // Only open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Handle camera permissions
ipcMain.handle("get-camera-permissions", async () => {
  log("Checking camera permissions")
  if (process.platform === "linux") {
    // On Raspberry Pi/Linux, we might need special handling
    log("Linux: assuming camera permissions granted")
    return true // Assuming permissions are handled at OS level
  } else {
    // On Windows/Mac, we can check permissions
    log("Checking permissions")
    try {
      const status = await mainWindow.webContents.session.permissions.query({
        permission: "camera",
        origin: "file://",
      })
      log("Permission status:", status.granted)
      return status.granted
    } catch (err) {
      error("Error checking camera permissions:", err)
      return false
    }
  }
})

// Handle camera operations
ipcMain.handle("start-camera", async (event, deviceId) => {
  log("Starting camera:", deviceId)
  try {
    // In a real implementation, you would start the camera here
    // For now, we'll just return success
    log("Camera started")
    return true
  } catch (err) {
    error("Error starting camera:", err)
    return false
  }
})

ipcMain.handle("stop-camera", async () => {
  log("Stopping camera")
  try {
    // In a real implementation, you would stop the camera here
    log("Camera stopped")
    return true
  } catch (err) {
    error("Error stopping camera:", err)
    return false
  }
})

ipcMain.handle("capture-frame", async () => {
  log("Capturing frame")
  try {
    // In a real implementation, you would capture a frame here
    log("Frame captured")
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
  } catch (err) {
    error("Error capturing frame:", err)
    return ""
  }
})

ipcMain.handle("get-camera-devices", async () => {
  log("Getting camera devices")
  try {
    // In a real implementation, you would get the list of camera devices here
    // For now, we'll return a mock list
    const devices = [
      { id: "default", label: "Default Camera" },
      { id: "mock-camera-1", label: "Mock Camera 1" },
    ]
    log("Found devices")
    return devices
  } catch (err) {
    error("Error getting camera devices:", err)
    return []
  }
})
