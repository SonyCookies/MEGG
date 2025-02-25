"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { db } from "../../../config/firebaseConfig"
import { collection, query, where, getDocs } from "firebase/firestore"
import Image from "next/image"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState({})
  const [globalMessage, setGlobalMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (e) => {
    setEmail(e.target.value)
    validateField(e.target.value)
  }

  const validateField = (value) => {
    let errorMsg = ""

    if (!value) {
      errorMsg = "Email is required."
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      errorMsg = "Invalid email address."
    }
    setErrors({ email: errorMsg })
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    if (!email) {
      setGlobalMessage("Please enter your email address.")
      setIsLoading(false)
      return
    }

    if (errors.email) {
      setGlobalMessage("Please fix the highlighted errors.")
      setIsLoading(false)
      return
    }

    try {
      // Check if user exists first
      const userRef = collection(db, "users")
      const userQuery = query(userRef, where("email", "==", email))
      const userSnap = await getDocs(userQuery)

      if (userSnap.empty) {
        setGlobalMessage("No account found with this email address.")
        setIsLoading(false)
        return
      }

      // Send reset email
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === "permission-denied") {
          throw new Error("Access denied. Please try again later.")
        }
        throw new Error(data.error || "Failed to send reset email")
      }

      setGlobalMessage("Password reset instructions sent to your email.")
      setTimeout(() => router.push("/login"), 4000)
    } catch (err) {
      console.error("Reset password error:", err)
      setGlobalMessage(
        err.message === "Access denied. Please try again later." ? err.message : "An error occurred. Please try again.",
      )
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
              Forgot password
              <span className="text-gray-500 font-normal text-sm">
                Enter the email address you used to register with.
              </span>
            </div>

            {globalMessage && (
              <div
                className={`border-l-4 rounded-lg px-4 py-2 w-full sm:w-3/4 ${
                  globalMessage.includes("sent to your email")
                    ? "bg-green-100 border-green-500 text-green-500"
                    : "bg-red-100 border-red-500 text-red-500"
                }`}
              >
                {globalMessage}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="flex flex-col gap-8 w-full sm:w-3/4">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 flex flex-col gap-1 justify-center">
                  <label htmlFor="email">Email address</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="border-b-2 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
                </div>
              </div>

              <div className="flex gap-4 items-center mt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-2xl w-full bg-blue-500 text-white transition-colors duration-150 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
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

