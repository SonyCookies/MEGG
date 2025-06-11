interface Window {
  electronAPI?: {
    getCameraDevices: () => Promise<{ id: string; label: string }[]>
    startCamera: (cameraId: string | null) => Promise<boolean>
    stopCamera: () => Promise<void>
    getCameraStream: () => Promise<string>
    captureFrame: () => Promise<string>
  }
}
