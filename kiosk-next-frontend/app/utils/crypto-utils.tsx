/**
 * Crypto utility functions using Web Crypto API for browser compatibility
 */

/**
 * Generates a random token of specified length
 * @param length - The byte length of the token to generate (default: 32)
 * @returns A hex string representation of the random token
 */
export function generateToken(length = 32): string {
  // Create a new Uint8Array with the specified length
  const randomBytesArray = new Uint8Array(length)

  // Fill it with random values using the Web Crypto API
  window.crypto.getRandomValues(randomBytesArray)

  // Convert to hex string
  return Array.from(randomBytesArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Creates a SHA-256 hash of the provided token
 * @param token - The token to hash
 * @returns A hex string representation of the hash
 */
export async function hashToken(token: string): Promise<string> {
  // Convert the token string to an array buffer
  const encoder = new TextEncoder()
  const data = encoder.encode(token)

  // Hash the data using the Web Crypto API
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data)

  // Convert the hash to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Verifies if a token matches a previously generated hash
 * @param token - The token to verify
 * @param hash - The hash to compare against
 * @returns A promise that resolves to true if the token matches the hash, false otherwise
 */
export async function verifyToken(token: string, hash: string): Promise<boolean> {
  const calculatedHash = await hashToken(token)
  return calculatedHash === hash
}

/**
 * Synchronous version of hashToken for compatibility with existing code
 * Note: This is less secure than the async version and should be used only when necessary
 * @param token - The token to hash
 * @returns A hex string representation of the hash
 */
export function hashTokenSync(token: string): string {
  // For compatibility with code that expects synchronous operation
  // This uses a simple algorithm that works in the browser
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Convert to hex string with fixed length
  return (hash >>> 0).toString(16).padStart(8, "0")
}
