"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { db, auth } from "../../../config/firebaseConfig"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { signInWithEmailAndPassword, updatePassword } from "firebase/auth"
import Image from "next/image"
import { verifyResetToken } from "../../../utils/token"
import bcrypt from "bcryptjs"

export default function ResetPasswordPage() {
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState({})
  const [globalMessage, setGlobalMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  // Verify the reset token when component mounts
  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) {
        setGlobalMessage("Invalid reset link. Please request a new one.")
        setTimeout(() => router.push("/forgot-password"), 3000)
        return
      }

      try {
        // Find user by email
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("email", "==", email))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          setGlobalMessage("Invalid reset link. Please request a new one.")
          setTimeout(() => router.push("/forgot-password"), 3000)
          return
        }

        const userDoc = querySnapshot.docs[0]
        const userData = userDoc.data()

        // Check if token is expired
        if (new Date() > new Date(userData.resetPasswordExpiry)) {
          setGlobalMessage("Reset link has expired. Please request a new one.")
          setTimeout(() => router.push("/forgot-password"), 3000)
          return
        }

        // Verify token
        const isValid = verifyResetToken(token, userData.resetPasswordToken)
        if (!isValid) {
          setGlobalMessage("Invalid reset link. Please request a new one.")
          setTimeout(() => router.push("/forgot-password"), 3000)
          return
        }

        setIsValidToken(true)
        setUserEmail(email)
        setUserId(userDoc.id)
      } catch (error) {
        console.error("Error verifying token:", error)
        setGlobalMessage("An error occurred. Please try again.")
        setTimeout(() => router.push("/forgot-password"), 3000)
      }
    }

    verifyToken()
  }, [token, email, router])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    validateField(name, value)
  }

  const validateField = (name, value) => {
    let errorMsg = ""

    switch (name) {
      case "password":
        if (value.length < 8) {
          errorMsg = "Password must be at least 8 characters."
        } else if (!/\d/.test(value)) {
          errorMsg = "Password must contain at least one number."
        } else if (!/[a-z]/.test(value)) {
          errorMsg = "Password must contain at least one lowercase letter."
        } else if (!/[A-Z]/.test(value)) {
          errorMsg = "Password must contain at least one uppercase letter."
        } else if (!/[!@#$%^&*]/.test(value)) {
          errorMsg = "Password must contain at least one special character (!@#$%^&*)."
        }
        break
      case "confirmPassword":
        if (value !== form.password) errorMsg = "Passwords do not match."
        break
      default:
        break
    }

    setErrors((prevErrors) => ({ ...prevErrors, [name]: errorMsg }))
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setGlobalMessage("")

    if (!form.password || !form.confirmPassword) {
      setGlobalMessage("Please fill in all fields.")
      setIsLoading(false)
      return
    }

    const hasErrors = Object.values(errors).some((error) => error !== "")
    if (hasErrors) {
      setGlobalMessage("Please fix the highlighted errors.")
      setIsLoading(false)
      return
    }

    try {
      if (!isValidToken || !userEmail || !userId) {
        throw new Error("Invalid reset token")
      }

      // First, sign in to Firebase Auth with the new password
      try {
        // Try to sign in with the new password first
        await signInWithEmailAndPassword(auth, userEmail, form.password)
      } catch (error) {
        // If sign in fails, we need to update both Firebase Auth and Firestore
        try {
          // Hash the password for Firestore
          const hashedPassword = await bcrypt.hash(form.password, 12)

          // Update password in Firebase Auth
          // Note: This requires the user to be recently authenticated
          // We'll handle this by sending a new reset email if this fails
          if (auth.currentUser) {
            await updatePassword(auth.currentUser, form.password)
          }

          // Update password in Firestore
          await updateDoc(doc(db, "users", userId), {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpiry: null,
            passwordUpdatedAt: new Date().toISOString(),
          })

          // Try signing in with the new password to verify it works
          await signInWithEmailAndPassword(auth, userEmail, form.password)
        } catch (updateError) {
          console.error("Error updating password:", updateError)
          throw new Error("Failed to update password. Please try again.")
        }
      }

      setGlobalMessage("Password updated successfully! Redirecting to login...")

      // Sign out the user to ensure they log in fresh with new credentials
      await auth.signOut()

      setTimeout(() => router.push("/login"), 3000)
    } catch (error) {
      console.error("Reset password error:", error)
      let errorMessage = "An error occurred while resetting your password."

      if (error.message === "Invalid reset token") {
        errorMessage = "Invalid reset link. Please request a new one."
        setTimeout(() => router.push("/forgot-password"), 3000)
      }

      setGlobalMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-300/10 flex flex-col items-center justify-center sm:p-8">
      <div className="bg-white shadow sm:border w-full sm:max-w-lg md:max-w-xl xl:max-w-6xl min-h-screen sm:min-h-[700px] flex flex-col xl:flex-row sm:rounded-2xl overflow-hidden">
        <div className="w-full h-[200px] xl:h-auto relative">
          <Image src="/login_bg_mobile.svg" alt="Login Background" fill className="object-cover flex xl:hidden" />
          <Image
            src="/login_bg_screen.svg"
            alt="Login Background"
            fill
            className="object-cover hidden xl:flex place-content-center place-items-center"
          />
        </div>
        <div className="relative w-full p-8 flex flex-col flex-1 xl:flex-auto bg-white">
          <div className="flex flex-col gap-8 items-center justify-center mt-4 xl:mt-10">
            <div
              className={`text-2xl font-semibold flex flex-col text-center gap-1 ${globalMessage ? "mb-0" : "mb-4"}`}
            >
              Enter your new password
              <span className="text-gray-500 font-normal text-sm">
                Your new password must be different to previous password.
              </span>
            </div>

            {globalMessage && (
              <div
                className={`border-l-4 rounded-lg px-4 py-2 w-full sm:w-3/4 ${
                  globalMessage.includes("successfully")
                    ? "bg-green-100 border-green-500 text-green-500"
                    : "bg-red-100 border-red-500 text-red-500"
                }`}
              >
                {globalMessage}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="flex flex-col gap-8 w-full sm:w-3/4">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 flex flex-col gap-1">
                  <label htmlFor="password">New password</label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    className="border-b-2 py-2 outline-none focus:border-blue-500 transition-colors duration-150 mt-1"
                    placeholder="Enter your password"
                    onChange={handleInputChange}
                    disabled={isLoading || !isValidToken}
                  />
                  {errors.password && <span className="text-red-500 text-sm">{errors.password}</span>}
                </div>

                <div className="col-span-2 flex flex-col gap-1">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    className="border-b-2 py-2 outline-none focus:border-blue-500 transition-colors duration-150 mt-1"
                    placeholder="Confirm your password"
                    onChange={handleInputChange}
                    disabled={isLoading || !isValidToken}
                  />
                  {errors.confirmPassword && <span className="text-red-500 text-sm">{errors.confirmPassword}</span>}
                </div>
              </div>

              <div className="flex gap-4 items-center mt-2">
                <button
                  type="submit"
                  disabled={isLoading || !isValidToken}
                  className="px-4 py-2 rounded-2xl w-full bg-blue-500 text-white transition-colors duration-150 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Resetting Password..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
          <div className="text-gray-500 text-sm mt-0 sm:mt-10 absolute bottom-8 left-1/2 -translate-x-1/2 w-full flex items-center justify-center">
            <Link href="/login" className="text-gray-500 hover:text-blue-500 hover:underline hover:underline-offset-8">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

