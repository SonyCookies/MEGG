"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { auth, db } from "../../config/firebaseConfig"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore"
import Image from "next/image"
import { generateOTP, calculateOTPExpiry } from "../../../app/utils/otp"

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullname: "",
    username: "",
    phone: "", 
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState({})
  const [globalMessage, setGlobalMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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

  // Handle input changes and real-time validation
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    validateField(name, value)
  }

  const validateField = (name, value) => {
    let errorMsg = ""

    switch (name) {
      case "fullname":
        if (!value) errorMsg = "Full name is required."
        break
      case "username":
        if (!value) errorMsg = "Username is required."
        break
      case "email":
        if (!value) errorMsg = "Email is required."
        else if (!/\S+@\S+\.\S+/.test(value)) errorMsg = "Invalid email address."
        break
        case "phone":
        if (!value) errorMsg = "Phone number is required."
        else if (!/^\+?[\d\s-]{10,}$/.test(value)) errorMsg = "Please enter a valid phone number."
        break
      case "password":
        if (value.length < 8) errorMsg = "Please make the password must be at least 8 characters."
        break
      case "confirmPassword":
        if (value !== form.password) errorMsg = "Passwords do not match."
        break
      default:
        break
    }

    setErrors((prevErrors) => ({ ...prevErrors, [name]: errorMsg }))
  }
  

  const handleRegister = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setGlobalMessage("")

    // Check for empty fields
    const emptyFields = Object.entries(form).filter(([key, value]) => value === "")
    if (emptyFields.length > 0) {
      setGlobalMessage("Please fill in all fields.")
      setIsLoading(false)
      return
    }

    // Check if there are any remaining validation errors
    const hasErrors = Object.values(errors).some((error) => error !== "")
    if (hasErrors) {
      setGlobalMessage("Please fix the highlighted errors.")
      setIsLoading(false)
      return
    }

    try {
      // Check username availability
      const userRef = collection(db, "users")
      const usernameQuery = query(userRef, where("username", "==", form.username))

      try {
        const usernameSnapshot = await getDocs(usernameQuery)
        if (!usernameSnapshot.empty) {
          setGlobalMessage("Username already taken.")
          setIsLoading(false)
          return
        }
      } catch (error) {
        console.error("Error checking username:", error)
        setGlobalMessage("Error checking username availability. Please try again.")
        setIsLoading(false)
        return
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password)

      // Generate OTP and expiry time
      const otp = generateOTP()
      const otpExpiry = calculateOTPExpiry()

      // Update user profile
      await updateProfile(userCredential.user, {
        displayName: form.username,
      })

      // Store user data and OTP in Firestore
      try {
        await setDoc(doc(db, "users", userCredential.user.uid), {
          fullname: form.fullname,
          username: form.username,
          email: form.email,
          phone:form.phone,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          uid: userCredential.user.uid,
          verified: false,
          verificationOTP: otp,
          otpExpiry: otpExpiry,
          deviceId: auth.currentUser?.uid || "unknown", // Add device ID tracking
        })

     

        await sendVerificationEmail(form.email, otp)

        setGlobalMessage("Account created! Please check your email for verification.")
        setTimeout(() => router.push(`/verify?email=${form.email}`), 2000)
      } catch (error) {
        console.error("Error saving user data:", error)
        // Clean up by deleting the auth user if Firestore save fails
        try {
          await userCredential.user.delete()
        } catch (deleteError) {
          console.error("Error deleting auth user:", deleteError)
        }
        throw new Error("Failed to save user data. Please try again.")
      }
    } catch (error) {
      let errorMessage = "Registration failed. Please try again."

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email already registered. Please use a different email."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address."
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage = "Email/password registration is not enabled."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak."
      }

      setGlobalMessage(errorMessage)
      console.error("Registration error:", error)
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
        <div className="relative w-full p-8 xl:place-content-center bg-geen-500 flex flex-col flex-1 xl:flex-auto bg-white">
          <div className="flex flex-col gap-8 items-center justify-center">
            <div className={`text-2xl font-semibold ${globalMessage ? "mb-0" : "mb-4"}`}>Create your account</div>

            {/* Global validation message */}
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

            <form onSubmit={handleRegister} className="flex flex-col gap-8 w-full sm:w-3/4">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 xl:col-span-1 flex flex-col gap-1">
                  <label htmlFor="fullname">Full name</label>
                  <input
                    type="text"
                    name="fullname"
                    id="fullname"
                    className="border-b-2 py-2 outline-none focus:border-blue-500 transition-colors duration-150 mt-1"
                    placeholder="Enter your fullname"
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  {errors.fullname && <span className="text-red-500 text-sm">{errors.fullname}</span>}
                </div>

                <div className="col-span-2 xl:col-span-1 flex flex-col gap-1">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    className="border-b-2 py-2 outline-none focus:border-blue-500 transition-colors duration-150 mt-1"
                    placeholder="Enter your username"
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  {errors.username && <span className="text-red-500 text-sm">{errors.username}</span>}
                </div>

                <div className="col-span-2 flex flex-col gap-1">
                  <label htmlFor="email">Email address</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="border-b-2 py-2 outline-none focus:border-blue-500 transition-colors duration-150 mt-1"
                    placeholder="Enter your email address"
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
                </div>

                <div className="col-span-2 flex flex-col gap-1">
                  <label htmlFor="phone">Phone number</label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    className="border-b-2 py-2 outline-none focus:border-blue-500 transition-colors duration-150 mt-1"
                    placeholder="Enter your phone number"
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  {errors.phone && <span className="text-red-500 text-sm">{errors.phone}</span>}
                </div>


                <div className="col-span-2 flex flex-col gap-1">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    className="border-b-2 py-2 outline-none focus:border-blue-500 transition-colors duration-150 mt-1"
                    placeholder="Enter your password"
                    onChange={handleInputChange}
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && <span className="text-red-500 text-sm">{errors.confirmPassword}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-4 items-center my-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-2xl w-full bg-blue-500 text-white transition-colors duration-150 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </button>
                <span className="text-gray-500 text-sm">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-blue-500 hover:underline hover:underline-offset-8 transition-transform duration-150"
                  >
                           Sign in
                  </Link>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

