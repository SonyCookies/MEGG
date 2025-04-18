"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { db, auth } from "../../config/firebaseConfig.js"
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import Image from "next/image"
import { generateOTP, calculateOTPExpiry } from "../../../app/utils/otp"

// Function to encrypt credentials
const encryptCredentials = (username, password) => {
  return btoa(JSON.stringify({ username, password }))
}

// Function to decrypt credentials
const decryptCredentials = (encrypted) => {
  try {
    return JSON.parse(atob(encrypted))
  } catch {
    return null
  }
}

const sendVerificationEmail = async (email, otp) => {
  try {
    const response = await fetch("/api/send-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    })

    if (!response.ok) {
      throw new Error("Failed to send verification email")
    }
  } catch (error) {
    console.error("Error sending verification email:", error)
    throw error
  }
}

export default function LoginPage() {
  const [form, setForm] = useState({
    username: "",
    password: "",
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [globalMessage, setGlobalMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem("rememberedCredentials")
    if (savedCredentials) {
      const decrypted = decryptCredentials(savedCredentials)
      if (decrypted) {
        setForm((prev) => ({
          ...prev,
          username: decrypted.username,
          password: decrypted.password,
        }))
        setRememberMe(true)
      }
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const resetFields = () => {
    setForm({
      username: "",
      password: "",
    })
    localStorage.removeItem("rememberedCredentials")
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    if (!form.username || !form.password) {
      setGlobalMessage("Please fill in all fields.")
      setIsLoading(false)
      return
    }

    try {
      // First, find user by username in Firestore
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("username", "==", form.username))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setGlobalMessage("Invalid username or password.")
        setIsLoading(false)
        return
      }

      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data()
      const userEmail = userData.email

      // Sign in with Firebase Auth using email
      const userCredential = await signInWithEmailAndPassword(auth, userEmail, form.password)
      const user = userCredential.user

      // Handle Remember Me
      if (rememberMe) {
        const encrypted = encryptCredentials(form.username, form.password)
        localStorage.setItem("rememberedCredentials", encrypted)
      } else {
        localStorage.removeItem("rememberedCredentials")
      }

      // Check if user is verified
      if (!userData.verified) {
        // Generate new OTP and expiry time
        const newOTP = generateOTP()
        const newExpiry = calculateOTPExpiry()

        // Update user document with new OTP
        await setDoc(
          doc(db, "users", user.uid),
          {
            verificationOTP: newOTP,
            otpExpiry: newExpiry,
          },
          { merge: true },
        )

        // Send verification email with OTP
        await sendVerificationEmail(userEmail, newOTP)

        setGlobalMessage("Please verify your email before logging in.")
        router.push(`/verify?email=${userEmail}`)
        setIsLoading(false)
        return
      }

      // Update last login
      await setDoc(
        doc(db, "users", user.uid),
        {
          lastLogin: new Date().toISOString(),
        },
        { merge: true },
      )

      setGlobalMessage("Login successful!")
      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: user.uid,
          email: userEmail,
          username: userData.username,
        }),
      )

      setTimeout(() => router.replace("/admin/overview"), 2000)
    } catch (error) {
      console.error("Login error:", error)
      let errorMessage = "Login failed. Please check your credentials."

      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMessage = "Invalid username or password."
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later."
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled."
      }

      setGlobalMessage(errorMessage)
      resetFields()
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: "select_account",
      })
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Create or update user document
      const userDocRef = doc(db, "users", user.uid)
      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          username: user.displayName,
          email: user.email,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          provider: "google",
          verified: true, // Google accounts are pre-verified
          devicedId: user.uid,
        },
        { merge: true },
      )

      const userData = {
        uid: user.uid,
        username: user.displayName,
        email: user.email,
        deviceId: user.uid,
      }

      setGlobalMessage("Login successful!")
      localStorage.setItem("user", JSON.stringify(userData))
      setTimeout(() => router.replace("/admin/overview"), 2000)
    } catch (error) {
      console.error("Error signing in with Google:", error)
      if (error.code === "permission-denied") {
        setGlobalMessage("Access denied. Please check your permissions.")
      } else {
        setGlobalMessage("Google sign-in failed. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-300/10 flex flex-col items-center justify-center sm:p-8">
      <div className="bg-white sm:border shadow w-full sm:max-w-lg md:max-w-xl xl:max-w-6xl min-h-screen sm:min-h-[700px] flex flex-col xl:flex-row sm:rounded-2xl overflow-hidden">
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
          <div className="flex flex-col gap-8 items-center justify-center mt-2 xl:mt-10">
            <div className={`text-2xl font-semibold ${globalMessage ? "mb-0" : "mb-4"}`}>Sign in to your account</div>

            {globalMessage && (
              <div
                className={`border-l-4 rounded-lg px-4 py-2 w-full sm:w-3/4 ${
                  globalMessage.includes("successful") || globalMessage.includes("verified successfully")
                    ? "bg-green-100 border-green-500 text-green-500"
                    : "bg-red-100 border-red-500 text-red-500"
                }`}
              >
                {globalMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-8 w-full sm:w-3/4">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 flex flex-col gap-1 justify-center">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={form.username}
                    className="border-b-2 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                    placeholder="Enter your username"
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                <div className="col-span-2 flex flex-col gap-1 justify-center">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={form.password}
                    className="border-b-2 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                    placeholder="Enter your password"
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                {/* Remember Me Checkbox */}
                <div className="col-span-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="remember-me" className="text-sm text-gray-600">
                      Remember me
                    </label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-500 hover:underline hover:underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div className="flex gap-4 items-center mt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-2xl w-full bg-blue-500 text-white transition-colors duration-150 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>

            <div className="w-full flex items-center gap-4">
              <div className="flex-1 h-[1px] bg-gray-300"></div>
              <span className="text-gray-500 text-sm">sign in with</span>
              <div className="flex-1 h-[1px] bg-gray-300"></div>
            </div>

            <div className="flex gap-4 items-center mt-2 w-full sm:w-3/4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="px-4 py-2 rounded-2xl w-full border transition-colors duration-150 hover:bg-gray-300/20 text-gray-700 flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                    <path
                      fill="#FFC107"
                      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                    />
                    <path
                      fill="#FF3D00"
                      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                    />
                  </svg>
                )}
                {isLoading ? "Signing in..." : "Sign in with Google"}
              </button>
            </div>
          </div>

          <div className="text-gray-500 text-sm mt-0 sm:mt-10 absolute bottom-8 left-1/2 -translate-x-1/2 sm:static sm:bottom-auto sm:left-auto sm:translate-x-0  xl:absolute xl:bottom-8 xl:left-1/2 xl:-translate-x-1/2 w-full flex items-center justify-center">
            Don't you have an account?{" "}
            <Link
              href="/register"
              className="text-gray-500 hover:text-blue-500 hover:underline hover:underline-offset-8"
            >
              SignUp
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
