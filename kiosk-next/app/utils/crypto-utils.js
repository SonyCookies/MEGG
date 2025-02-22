import { randomBytes, createHash } from "crypto"

export function generateToken(length = 32) {
  return randomBytes(length).toString("hex")
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex")
}

export function verifyToken(token, hash) {
  return hashToken(token) === hash
}

