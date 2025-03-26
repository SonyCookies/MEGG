"use client"

import { useState, useEffect } from "react"
import { Upload, Trash2, Save } from "lucide-react"
import Image from "next/image"
import { db, auth, storage } from "../../../../config/firebaseConfig"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { onAuthStateChanged } from "firebase/auth"
import { trackProfileChanges } from "../../../../lib/notifications/ProfileChangeTracker.js"

export default function EditProfile() {
  const [profileImage, setProfileImage] = useState("/default.png")
  const [globalMessage, setGlobalMessage] = useState("")
  const [userData, setUserData] = useState({
    fullname: "",
    birthday: "",
    age: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    profileImageUrl: "",
  })
  const [loading, setLoading] = useState(true)
  const [originalUserData, setOriginalUserData] = useState({})

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const data = docSnap.data()
            const userDataObj = {
              fullname: data.fullname || "",
              birthday: data.birthday || "",
              age: data.age || "",
              gender: data.gender || "",
              email: data.email || "",
              phone: data.phone || "",
              address: data.address || "",
              profileImageUrl: data.profileImageUrl || "",
            }

            setUserData(userDataObj)
            setOriginalUserData(userDataObj) // Store original data for change tracking
            setProfileImage(data.profileImageUrl || "/default.png")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setGlobalMessage("Error loading profile data")
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Check file size (5MB limit)
    const fileSize = file.size / 1024 / 1024 // Convert to MB
    if (fileSize > 5) {
      setGlobalMessage("Image size must not exceed 5MB")
      return
    }

    try {
      const user = auth.currentUser
      if (!user) {
        setGlobalMessage("Please log in to upload an image")
        return
      }

      // Store original data for change tracking
      const oldData = { ...userData }

      // Create a reference to the storage location
      const storageRef = ref(storage, `profile-images/${user.uid}`)

      // Upload the file
      await uploadBytes(storageRef, file)

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef)

      // Update the user document with the new image URL
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        profileImageUrl: downloadURL,
      })

      // Update state
      setProfileImage(downloadURL)
      setUserData((prev) => ({
        ...prev,
        profileImageUrl: downloadURL,
      }))

      // Track changes and create notifications
      const newData = { ...userData, profileImageUrl: downloadURL }
      await trackProfileChanges(user.uid, oldData, newData)

      setGlobalMessage("Profile image updated successfully!")
    } catch (error) {
      console.error("Error uploading image:", error)
      setGlobalMessage("Error uploading image")
    }

    setTimeout(() => {
      setGlobalMessage("")
    }, 3000)
  }

  const handleImageRemove = async () => {
    try {
      const user = auth.currentUser
      if (!user) {
        setGlobalMessage("Please log in to remove the image")
        return
      }

      // Store original data for change tracking
      const oldData = { ...userData }

      // Delete the image from storage if it exists
      if (userData.profileImageUrl) {
        const storageRef = ref(storage, `profile-images/${user.uid}`)
        await deleteObject(storageRef)
      }

      // Update the user document
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        profileImageUrl: "",
      })

      // Update state
      setProfileImage("/default.png")
      setUserData((prev) => ({
        ...prev,
        profileImageUrl: "",
      }))

      // Track changes and create notifications
      const newData = { ...userData, profileImageUrl: "" }
      await trackProfileChanges(user.uid, oldData, newData)

      setGlobalMessage("Profile image removed successfully!")
    } catch (error) {
      console.error("Error removing image:", error)
      setGlobalMessage("Error removing image")
    }

    setTimeout(() => {
      setGlobalMessage("")
    }, 3000)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      const user = auth.currentUser
      if (!user) {
        setGlobalMessage("Please log in to save changes")
        return
      }

      // Store original data for change tracking
      const oldData = { ...originalUserData }

      // Update user data in Firestore
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, userData)

      // Track changes and create notifications
      await trackProfileChanges(user.uid, oldData, userData)

      // Update original data reference after successful save
      setOriginalUserData({ ...userData })

      setGlobalMessage("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      setGlobalMessage("Error updating profile")
    }

    setTimeout(() => {
      setGlobalMessage("")
    }, 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen h-full w-full">
        <div className="text-sm font-medium text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <form className="border-l flex flex-1 flex-col gap-10 lg:gap-8 p-8 bg-white border s xl:bg-none rounded-2xl xl:rounded-none shadow xl:shadow-none w-full">
        {globalMessage && (
          <div
            className={`border-l-4 rounded-lg px-4 py-2 w-full  ${
              globalMessage.includes("successful")
                ? "bg-green-100 border-green-500 text-green-500"
                : "bg-red-100 border-red-500 text-red-500"
            }`}
          >
            {globalMessage}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-medium">Profile Picture</h3>
            <span className="text-gray-500 text-sm">
              <span className="font-semibold">Note:</span> Image must not exceed 5MB.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8">
            <div className="relative rounded-full w-28 h-28 border border-blue-500 overflow-hidden">
              <Image
                src={profileImage === "/default.png" ? "/default.png" : profileImage}
                alt="Profile"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <label className="cursor-pointer flex items-center gap-4 px-4 py-2 rounded-lg bg-blue-500 text-white transition-colors duration-150 hover:bg-blue-600">
                <Upload className="w-5 h-5" /> Upload Image
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              <button
                type="button"
                onClick={handleImageRemove}
                className="flex items-center gap-4 px-4 py-2 rounded-lg border text-red-600 hover:bg-gray-300/20 transition-colors duration-150"
              >
                <Trash2 className="w-5 h-5" /> Remove Image
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-medium">Basic information</h3>

          <div className="flex flex-col xl:flex-row gap- xl:gap-8">
            <div className="w-full text-gray-500 text-sm mb-4 xl:mb-0">
              Basic details used for identification, verification, and communication.
            </div>

            <div className="w-full grid grid-cols-3 gap-4">
              <div className="col-span-3 flex flex-col gap-1 justify-center">
                <label htmlFor="fullname">Fullname</label>
                <input
                  type="text"
                  name="fullname"
                  id="fullname"
                  value={userData.fullname}
                  onChange={handleInputChange}
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                  placeholder="Enter your fullname"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1 justify-center">
                <label htmlFor="birthday">Birthday</label>
                <input
                  type="date"
                  name="birthday"
                  id="birthday"
                  value={userData.birthday}
                  onChange={handleInputChange}
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                />
              </div>
              <div className="col-span-1 flex flex-col gap-1 justify-center">
                <label htmlFor="age">Age</label>
                <input
                  type="text"
                  name="age"
                  id="age"
                  value={userData.age}
                  onChange={handleInputChange}
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                  placeholder="0"
                />
              </div>
              <div className="col-span-3 flex flex-col gap-1 justify-center">
                <label htmlFor="gender">Gender</label>
                <select
                  name="gender"
                  id="gender"
                  value={userData.gender}
                  onChange={handleInputChange}
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                >
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-medium">Contact details</h3>

          <div className="flex flex-col xl:flex-row gap- xl:gap-8">
            <div className="w-full text-gray-500 text-sm mb-4 xl:mb-0">
              Essential information for communication and correspondence.
            </div>

            <div className="w-full grid grid-cols-3 gap-4">
              <div className="col-span-3 flex flex-col gap-1 justify-center">
                <label htmlFor="email">Email address</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={userData.email}
                  onChange={handleInputChange}
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                  placeholder="Enter your email"
                />
              </div>
              <div className="col-span-3 flex flex-col gap-1 justify-center">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={userData.phone}
                  onChange={handleInputChange}
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="col-span-3 flex flex-col gap-1 justify-center">
                <label htmlFor="address">Residential Address</label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={userData.address}
                  onChange={handleInputChange}
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                  placeholder="Enter your address"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-blue-500 transition-colors duration-150 hover:bg-blue-600 text-white flex items-center gap-4"
          >
            <Save className="w-5 h-5" />
            Save changes
          </button>
        </div>
      </form>
    </>
  )
}

