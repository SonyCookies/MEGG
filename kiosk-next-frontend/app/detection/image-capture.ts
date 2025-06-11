/**
 * Utility functions for capturing images from video elements
 */

/**
 * Captures a frame from a video element and returns it as a base64 data URL
 */
export async function captureImageFromVideo(
  videoElement: HTMLVideoElement,
  format = "image/jpeg",
  quality = 0.95,
): Promise<string> {
  // Validate video element
  if (!videoElement) {
    throw new Error("Video element is required")
  }

  if (videoElement.readyState < 2) {
    throw new Error("Video is not ready for capture")
  }

  if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    throw new Error("Video has no dimensions")
  }

  console.log("📸 Video dimensions:", videoElement.videoWidth, "x", videoElement.videoHeight)

  // Create a canvas element with the same dimensions as the video
  const canvas = document.createElement("canvas")
  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight

  // Draw the current video frame to the canvas
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  // Draw the video frame to the canvas
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

  // Convert the canvas to a data URL
  const dataUrl = canvas.toDataURL(format, quality)
  console.log("📸 Generated data URL length:", dataUrl.length)

  // Validate the data URL
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    throw new Error("Failed to generate valid image data")
  }

  // Return the full data URL instead of just the base64 part
  return dataUrl

  // If you want to return just base64 (current behavior), use this instead:
  // const base64Data = dataUrl.split(",")[1]
  // return base64Data
}

/**
 * Validates base64 image data
 */
export function validateBase64Image(base64Data: string): boolean {
  try {
    // Handle both data URL and plain base64
    let actualBase64 = base64Data
    if (base64Data.includes(",")) {
      actualBase64 = base64Data.split(",")[1]
    }

    // Check if it's a valid base64 string
    const decoded = atob(actualBase64)

    // Check minimum length (should be at least a few KB for a real image)
    if (decoded.length < 1000) {
      console.warn("⚠️ Image data seems too small:", decoded.length, "bytes")
      return false
    }

    console.log("✅ Base64 validation passed, decoded size:", decoded.length, "bytes")
    return true
  } catch (error) {
    console.error("❌ Invalid base64 data:", error)
    return false
  }
}
