"use client"

import { useState, useEffect } from "react"
import { Trash2, X, Settings, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { db } from "../../../../config/firebaseConfig"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { createNotification } from "../../../../lib/notifications/NotificationsService"

export default function ModifyMachines() {
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [machineName, setMachineName] = useState("")
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [verifyingPin, setVerifyingPin] = useState(false)
  const [globalMessage, setGlobalMessage] = useState("")

  // Get current user from Firebase
  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        console.log("Current user:", user.uid)
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        })
      } else {
        // User is signed out
        console.log("No user signed in")
        setCurrentUser(null)
      }
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [])

  // Fetch linked machines when user is available
  useEffect(() => {
    const fetchLinkedMachines = async () => {
      if (!currentUser) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Get user document to find linked machines
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))

        if (!userDoc.exists()) {
          setLoading(false)
          setError("User data not found")
          return
        }

        const userData = userDoc.data()
        const linkedMachineIds = userData.linkedMachines || []

        if (linkedMachineIds.length === 0) {
          setMachines([])
          setLoading(false)
          return
        }

        // Fetch details for each linked machine
        const machinesData = []
        for (const machineId of linkedMachineIds) {
          const machineDoc = await getDoc(doc(db, "machines", machineId))

          if (machineDoc.exists()) {
            const data = machineDoc.data()
            machinesData.push({
              id: machineId,
              name: data.name || `Machine-${machineId.substring(0, 4)}`,
              addedDate: formatDate(data.createdAt || new Date()),
              image: data.imageUrl || "/default.png",
              // Store additional data that might be needed
              location: data.location,
              model: data.model,
              linkedAt: data.linkedUsers?.[currentUser.uid]?.linkedAt,
            })
          }
        }

        setMachines(machinesData)
      } catch (err) {
        console.error("Error fetching linked machines:", err)
        setError("Failed to load your linked machines")
      } finally {
        setLoading(false)
      }
    }

    fetchLinkedMachines()
  }, [currentUser])

  const openEditModal = (machine) => {
    setSelectedMachine(machine)
    setMachineName(machine.name)
    setIsEditModalOpen(true)
  }

  // Function to create machine update notification
  const createMachineUpdateNotification = async (userId, machineName, oldName) => {
    try {
      // Create the notification
      await createNotification(
        userId,
        `You've updated machine name from "${oldName}" to "${machineName}"`,
        "machine_updated",
      )
    } catch (error) {
      console.error("Error creating machine update notification:", error)
    }
  }

  // Function to create machine unlink notification
  const createMachineUnlinkNotification = async (userId, machineName) => {
    try {
      // Create the notification
      await createNotification(userId, `You've unlinked machine: ${machineName}`, "machine_unlinked")
    } catch (error) {
      console.error("Error creating machine unlink notification:", error)
    }
  }

  const handleSave = async () => {
    if (!selectedMachine || !currentUser) return

    try {
      setLoading(true)

      // Store the old name for notification
      const oldName = selectedMachine.name

      // Update machine name in Firestore
      const machineRef = doc(db, "machines", selectedMachine.id)
      await updateDoc(machineRef, {
        name: machineName,
        updatedAt: new Date().toISOString(),
      })

      // Update local state
      setMachines((prevMachines) =>
        prevMachines.map((m) => (m.id === selectedMachine.id ? { ...m, name: machineName } : m)),
      )

      // Create notification if name was changed
      if (oldName !== machineName) {
        await createMachineUpdateNotification(currentUser.uid, machineName, oldName)
      }

      setGlobalMessage("Machine updated successfully!")
      setIsEditModalOpen(false)
    } catch (err) {
      console.error("Error updating machine:", err)
      setGlobalMessage("Failed to update machine. Please try again.")
    } finally {
      setLoading(false)
      setTimeout(() => {
        if (globalMessage.includes("successfully")) {
          setGlobalMessage("")
        }
      }, 3000)
    }
  }

  const openConfirmModal = () => {
    setPin("")
    setPinError("")
    setIsConfirmModalOpen(true)
  }

  const verifyPin = async () => {
    if (!pin.trim()) {
      setPinError("Please enter the machine PIN")
      return false
    }

    try {
      setVerifyingPin(true)
      setPinError("")

      // Make an API call to verify the PIN
      const verifyResponse = await fetch("/api/machines/verify-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machineId: selectedMachine.id,
          pin: pin,
        }),
      })

      // Check if response is JSON
      const contentType = verifyResponse.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Non-JSON response:", await verifyResponse.text())
        setPinError("Server returned an invalid response. Please try again.")
        return false
      }

      const responseData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        setPinError(responseData.error || "Invalid PIN. Please try again.")
        return false
      }

      // PIN verified successfully
      return true
    } catch (error) {
      console.error("Error verifying PIN:", error)
      setPinError("Error connecting to server. Please try again.")
      return false
    } finally {
      setVerifyingPin(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedMachine || !currentUser) return

    // First verify PIN
    const isPinValid = await verifyPin()
    if (!isPinValid) {
      return
    }

    try {
      setLoading(true)

      // Store machine name for notification
      const machineName = selectedMachine.name

      // Unlink machine from user
      const userRef = doc(db, "users", currentUser.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const linkedMachines = userData.linkedMachines || []

        // Remove the machine ID from the user's linkedMachines array
        const updatedLinkedMachines = linkedMachines.filter((id) => id !== selectedMachine.id)

        await updateDoc(userRef, {
          linkedMachines: updatedLinkedMachines,
          updatedAt: new Date().toISOString(),
        })
      }

      // Remove user from machine's linkedUsers
      const machineRef = doc(db, "machines", selectedMachine.id)
      const machineDoc = await getDoc(machineRef)

      if (machineDoc.exists()) {
        const machineData = machineDoc.data()
        const linkedUsers = { ...machineData.linkedUsers }

        // Remove the current user from linkedUsers
        delete linkedUsers[currentUser.uid]

        await updateDoc(machineRef, {
          linkedUsers,
          lastUnlinked: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }

      // Also update the machine_users collection
      const linkRef = doc(db, "machine_users", `${selectedMachine.id}_${currentUser.uid}`)
      await updateDoc(linkRef, {
        status: "revoked",
        revokedAt: new Date().toISOString(),
      })

      // Create unlink notification
      await createMachineUnlinkNotification(currentUser.uid, machineName)

      // Update local state
      setMachines((prevMachines) => prevMachines.filter((m) => m.id !== selectedMachine.id))

      setGlobalMessage("Machine unlinked successfully!")
      setIsConfirmModalOpen(false)
      setIsEditModalOpen(false)
    } catch (err) {
      console.error("Error unlinking machine:", err)
      setGlobalMessage("Failed to unlink machine. Please try again.")
    } finally {
      setLoading(false)
      setTimeout(() => {
        if (globalMessage.includes("successfully")) {
          setGlobalMessage("")
        }
      }, 3000)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    try {
      // Handle Firestore timestamp objects
      if (typeof dateString === "object" && dateString.toDate) {
        return dateString.toDate().toLocaleDateString()
      }

      // Handle Firestore timestamp in JSON format
      if (typeof dateString === "object" && dateString.seconds) {
        return new Date(dateString.seconds * 1000).toLocaleDateString()
      }

      // Handle regular date strings
      return new Date(dateString).toLocaleDateString()
    } catch (e) {
      console.error("Error formatting date:", e)
      return "Unknown date"
    }
  }

  // Toggle PIN visibility
  const togglePinVisibility = () => {
    setShowPin(!showPin)
  }

  return (
    <>
      <form className="border-l flex flex-1 flex-col gap-10 lg:gap-8 p-8 bg-white border xl:bg-none rounded-2xl xl:rounded-none shadow xl:shadow-none w-full">
        {/* Global message */}
        {globalMessage && (
          <div
            className={`border-l-4 rounded-lg px-4 py-2 w-full ${
              globalMessage.includes("successfully")
                ? "bg-green-100 border-green-500 text-green-500"
                : "bg-red-100 border-red-500 text-red-500"
            }`}
          >
            {globalMessage}
          </div>
        )}

        {/* User authentication status */}
        {!currentUser && (
          <div className="border-l-4 border-amber-500 bg-amber-50 rounded-lg px-4 py-2 w-full text-amber-700">
            You are not logged in. Please log in to manage your linked machines.
          </div>
        )}

        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-medium">Linked Machines</h3>
            <span className="text-gray-500 text-sm">View and manage machines linked to your account.</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-500">Loading your linked machines...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-500 font-medium">{error}</p>
              <p className="text-gray-500 mt-2">Please try refreshing the page.</p>
            </div>
          ) : machines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Settings className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-700 font-medium">No machines linked</p>
              <p className="text-gray-500 mt-2">You don't have any machines linked to your account yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {machines.map((machine) => (
                <button
                  key={machine.id}
                  type="button"
                  className="col-span-4 lg:col-span-2 rounded-lg border p-4 flex items-center cursor-pointer hover:bg-gray-300/30 transition-colors duration-150"
                  onClick={() => openEditModal(machine)}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative rounded-full w-20 h-20 border border-blue-500 overflow-hidden">
                      <Image
                        src={machine.image || "/placeholder.svg"}
                        alt={machine.name}
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                    <div className="flex flex-col gap-1 items-start">
                      <h1 className="font-medium text-l">{machine.name}</h1>
                      <span className="text-gray-500 text-sm">Linked: {formatDate(machine.linkedAt)}</span>
                      {machine.location && <span className="text-gray-500 text-sm">Location: {machine.location}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </form>

      {/* Edit Modal */}
      {isEditModalOpen && selectedMachine && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-40 p-4">
          <div className="p-6 lg:p-8 bg-white border rounded-2xl z-50 w-full max-w-md flex flex-col gap-6 relative">
            <div className="flex flex-col items-center gap-4">
              <Settings className="w-12 h-12 text-blue-500" />

              <div className="flex flex-col gap-1 text-center">
                <h2 className="text-xl font-semibold text-rd-600 ">Edit machine</h2>
                <p className="text-gray-500 text-sm">Modify your machine's name</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-300/20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="machineName" className="text-sm text-gray-600">
                  Machine Name
                </label>
                <input
                  id="machineName"
                  type="text"
                  className="border rounded-lg px-4 py-2 w-full outline-none focus:border-blue-600"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  placeholder="Enter machine's name"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Machine ID</label>
                <div className="border rounded-lg px-4 py-2 bg-gray-50 text-gray-700">{selectedMachine.id}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={openConfirmModal}
                className="px-4 py-2 rounded-lg border border-red-600 text-red-600 transition-colors duration-150 hover:bg-red-600 hover:text-white w-full "
              >
                Unlink
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 w-full disabled:bg-blue-400"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && selectedMachine && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-40 p-4">
          <div className="p-6 lg:p-8 bg-white rounded-2xl shadow-lg z-50 w-full max-w-md flex flex-col gap-6">
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-4">
                <Trash2 className="w-12 h-12 text-red-600" />

                <div className="flex flex-col gap-1 text-center">
                  <h2 className="text-xl font-semibold text-rd-600 ">Unlink machine</h2>
                  <p className="text-gray-500 text-sm">
                    Are you sure you want to unlink this machine from your account?
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-6 w-full">
                <div className="flex flex-col gap-1">
                  <label htmlFor="pin" className="text-sm font-medium">
                    Enter machine PIN to confirm
                  </label>

                  <div className="relative">
                    <input
                      id="pin"
                      type={showPin ? "text" : "password"}
                      className={`border rounded-lg px-4 py-2 w-full outline-none ${
                        pinError ? "border-red-300 bg-red-50" : "focus:border-red-600"
                      }`}
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value)
                        setPinError("")
                      }}
                      placeholder="Enter machine PIN"
                    />
                    <button
                      type="button"
                      onClick={togglePinVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {pinError && <p className="text-sm text-red-600 mt-1">{pinError}</p>}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="px-4 py-2 rounded-lg border hover:bg-gray-300/20 w-full"
                  >
                    Cancel
                  </button>

                  <button
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 w-full"
                    disabled={loading || verifyingPin || !pin.trim()}
                    onClick={handleDelete}
                  >
                    {verifyingPin ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </div>
                    ) : loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Unlinking...
                      </div>
                    ) : (
                      "Confirm Unlink"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

