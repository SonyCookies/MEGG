"use client"

import { useState } from "react"
import { Trash2, CircleAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { auth, db, storage } from "../../../../config/firebaseConfig.js"
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth"
import { doc, deleteDoc } from "firebase/firestore"
import { ref, deleteObject } from "firebase/storage"

export default function DeleteAccount() {
  const [password, setPassword] = useState("")
  const [globalMessage, setGlobalMessage] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handlePasswordChange = (event) => {
    setPassword(event.target.value)
  }

  const handleDeleteClick = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const user = auth.currentUser
      if (!user || !user.email) {
        throw new Error("No authenticated user found")
      }

      // Create credentials with current password
      const credential = EmailAuthProvider.credential(user.email, password)

      // Reauthenticate user
      await reauthenticateWithCredential(user, credential)

      // If reauthentication successful, open confirmation modal
      setIsModalOpen(true)
    } catch (error) {
      console.error("Error verifying password:", error)
      if (error.code === "auth/wrong-password") {
        setGlobalMessage("Incorrect password. Please try again.")
      } else {
        setGlobalMessage("An error occurred. Please try again.")
      }

      setTimeout(() => setGlobalMessage(""), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (confirmText !== "DELETE") return

    setLoading(true)
    try {
      const user = auth.currentUser
      if (!user) throw new Error("No authenticated user found")

      // Delete user's profile image from Storage if it exists
      try {
        const imageRef = ref(storage, `profile-images/${user.uid}`)
        await deleteObject(imageRef)
      } catch (error) {
        // Ignore error if image doesn't exist
        if (error.code !== "storage/object-not-found") {
          console.error("Error deleting profile image:", error)
        }
      }

      // Delete user's document from Firestore
      await deleteDoc(doc(db, "users", user.uid))

      // Delete the user account
      await deleteUser(user)

      setGlobalMessage("Your account has been deleted successfully.")
      setIsModalOpen(false)

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error) {
      console.error("Error deleting account:", error)
      setGlobalMessage("Failed to delete account. Please try again.")
      setIsModalOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form className="border-l flex flex-1 flex-col gap-10 lg:gap-8 p-8 bg-white border xl:bg-none rounded-2xl xl:rounded-none shadow xl:shadow-none w-full">
        {/* Global validation message */}
        {globalMessage && (
          <div
            className={`border-l-4 rounded-lg px-4 py-2 w-full  ${
              globalMessage.includes("successfully")
                ? "bg-green-100 border-green-500 text-green-500"
                : "bg-red-100 border-red-500 text-red-500"
            }`}
          >
            {globalMessage}
          </div>
        )}

        {/* Basic information */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-medium">Delete account</h3>

            <div className="text-gray-500 text-sm">Deleting your account is permanent and cannot be undone.</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="currentPassword">Confirm password</label>

              <div className="flex flex-col lg:flex-row gap-4 lg:gap-2">
                <input
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150 flex-1 xl:flex-none xl:w-1/2"
                  value={password}
                  onChange={handlePasswordChange}
                />

                <button
                  type="submit"
                  onClick={handleDeleteClick}
                  disabled={!password || loading}
                  className="px-4 py-2 rounded-lg bg-red-600 transition-colors duration-150 hover:bg-red-700 text-white flex items-center justify-center gap-4 disabled:bg-red-300"
                >
                  <Trash2 className="w-5 h-5" />
                  {loading ? "Verifying..." : "Delete account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-40 p-4">
          <div className="p-6 lg:p-8 bg-white rounded-2xl shadow-lg z-50 w-full max-w-md flex flex-col gap-10">
            <div className="flex flex-col items-center gap-4">
              <CircleAlert className="w-12 h-12 text-red-600" />

              <div className="flex flex-col gap-1 text-center">
                <h2 className="text-xl font-semibold text-red-600">Delete Account</h2>
                <p className="text-gray-500 text-sm">
                  Are you sure you want to delete your account? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <label htmlFor="confirmDelete">
                  Enter <span className="font-semibold">"DELETE"</span> to confirm.
                </label>

                <input
                  type="text"
                  id="confirmDelete"
                  className="border rounded-lg px-4 py-2 w-full outline-none focus:border-red-600 transition-colors duration-150"
                  placeholder='Type "DELETE" here'
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsModalOpen(false)
                    setConfirmText("")
                  }}
                  className="px-4 py-2 rounded-lg border transition-colors duration-150 hover:bg-gray-300/20 w-full"
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  className="px-4 py-2 rounded-lg bg-red-600 transition-colors duration-150 text-white hover:bg-red-700 disabled:bg-red-300 w-full"
                  disabled={confirmText !== "DELETE" || loading}
                  onClick={handleConfirmDelete}
                >
                  {loading ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

