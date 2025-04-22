// D:\4THYEAR\CAPSTONE\MEGG\kiosk-next-frontend\electron\preload.js
const { contextBridge, ipcRenderer } = require('electron')

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Example function to get camera devices
  getCameraDevices: () => ipcRenderer.invoke('get-camera-devices')
})