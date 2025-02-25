"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth, db } from "../../../config/firebaseConfig"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { generateOTP, calculateOTPExpiry } from "../../../utils/otp"
import { sendEmailVerification } from "firebase/auth"

export default function VerifyCodePage() {
  const [otp, setOtp] = useState(new Array(6).fill(""))
  const [globalMessage, setGlobalMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes in seconds
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  useEffect(() => {
    if (!email) {
      router.push("/login")
      return
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer)
          return 0
        }
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [email, router])

  const handleInputChange = (value, index) => {
    if (value.match(/^[0-9]*$/)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Move focus to next input
      if (value && index < otp.length - 1) {
        document.getElementById(`otp-input-${index + 1}`).focus()
      }
    }
  }

  const handleResendOTP = async () => {
    setIsLoading(true)
    setGlobalMessage("")

    try {
      // Find user by email
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("email", "==", email))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setGlobalMessage("User not found.")
        return
      }

      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data()

      // Generate new OTP and expiry
      const newOTP = generateOTP()
      const newExpiry = calculateOTPExpiry()

      // Update user document with new OTP
      await updateDoc(doc(db, "users", userDoc.id), {
        verificationOTP: newOTP,
        otpExpiry: newExpiry,
      })

      // Send new verification email
      if (auth.currentUser) {
        const actionCodeSettings = {
          url: `${window.location.origin}/verify?email=${email}`,
          handleCodeInApp: true,
        }
        await sendEmailVerification(auth.currentUser, actionCodeSettings)
      }

      setGlobalMessage("New verification code sent!")
      setTimeLeft(900) // Reset timer to 15 minutes
    } catch (error) {
      console.error("Error resending OTP:", error)
      setGlobalMessage("Failed to resend verification code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setGlobalMessage("")

    const enteredOTP = otp.join("")

    try {
      // Find user by email
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("email", "==", email))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setGlobalMessage("User not found.")
        return
      }

      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data()

      // Check if OTP is expired
      if (new Date() > new Date(userData.otpExpiry)) {
        setGlobalMessage("Verification code has expired. Please request a new one.")
        return
      }

      // Verify OTP
      if (enteredOTP !== userData.verificationOTP) {
        setGlobalMessage("Invalid verification code. Please try again.")
        return
      }

      // Update user verification status
      await updateDoc(doc(db, "users", userDoc.id), {
        verified: true,
        verificationOTP: null,
        otpExpiry: null,
      })

      setGlobalMessage("Email verified successfully!")
      setTimeout(() => router.push("/login"), 2000)
    } catch (error) {
      console.error("Verification error:", error)
      setGlobalMessage("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
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
              Verify Your Email
              <span className="text-gray-500 font-normal text-sm">
                Enter the 6-digit code sent to <span className="font-medium text-black">{email}</span>
              </span>
            </div>

            {globalMessage && (
              <div
                className={`border-l-4 rounded-lg px-4 py-2 w-full sm:w-3/4 ${
                  globalMessage.includes("success")
                    ? "bg-green-100 border-green-500 text-green-500"
                    : "bg-red-100 border-red-500 text-red-500"
                }`}
              >
                {globalMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full sm:w-3/4">
              <div className="grid grid-cols-6 gap-2 mb-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    pattern="[0-9]"
                    inputMode="numeric"
                    required
                    disabled={isLoading}
                    className="w-12 h-12 text-center border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="0"
                    onChange={(e) => handleInputChange(e.target.value, index)}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-4 items-center">
                <button
                  type="submit"
                  disabled={isLoading || timeLeft === 0}
                  className="px-4 py-2 rounded-2xl w-full bg-blue-500 text-white transition-colors duration-150 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Verifying..." : "Verify Email"}
                </button>

                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-gray-500">Time remaining: {formatTime(timeLeft)}</p>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading || timeLeft > 0}
                    className="text-blue-500 text-sm hover:underline disabled:text-gray-400 disabled:no-underline"
                  >
                    Resend verification code
                  </button>
                </div>
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

