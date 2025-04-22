// D:\4THYEAR\CAPSTONE\MEGG\kiosk-next-frontend\electron\main.js

const { app, BrowserWindow } = require("electron")
const path = require("path")
const isDev = true // Force development mode for now

let mainWindow

function createWindow() {
  const mainWindow = new BrowserWindow({
    kiosk: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the Next.js app
  const startUrl = "http://localhost:3000" // Always use localhost during development

  mainWindow.loadURL(startUrl)

  // Open DevTools in development
  // if (isDev) {
  //   mainWindow.webContents.openDevTools()
  // }
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
