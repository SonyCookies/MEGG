import { createHash, randomBytes } from "crypto"

// Generate a secure reset token
export const generateResetToken = () => {
  const resetToken = randomBytes(32).toString("hex")
  const hash = createHash("sha256").update(resetToken).digest("hex")
  const expiryDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry

  return {
    resetToken,
    hash,
    expiryDate: expiryDate.toISOString(),
  }
}

// Verify the reset token
export const verifyResetToken = (token, hash) => {
  const checkHash = createHash("sha256").update(token).digest("hex")
  return checkHash === hash
}

