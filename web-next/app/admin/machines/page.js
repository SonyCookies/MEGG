"use client"

import { useState, useEffect } from "react"
import { Navbar } from "../../components/NavBar"
import { Sidebar } from "../../components/Sidebar"
import { Monitor, MonitorIcon as MonitorCog, Loader2, AlertCircle } from "lucide-react"
import Notifications from "../../components/ui/NotificationDesktop"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { db } from "../../config/firebaseConfig"
import { doc, onSnapshot } from "firebase/firestore"

export default function MachinesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  const router = useRouter()

  const handleManageMachines = () => {
    router.push("/admin/settings?component=AddMachines")
  }

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev)
  }

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen((prev) => !prev)
  }

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
    let unsubscribeUser = null
    let unsubscribeMachines = []

    const fetchLinkedMachines = async () => {
      if (!currentUser) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Set up real-time listener for user document to get linked machines
        const userRef = doc(db, "users", currentUser.uid)
        unsubscribeUser = onSnapshot(
          userRef,
          async (userDoc) => {
            if (!userDoc.exists()) {
              setMachines([])
              setLoading(false)
              return
            }

            const userData = userDoc.data()
            const linkedMachineIds = userData.linkedMachines || []

            if (linkedMachineIds.length === 0) {
              setMachines([])
              setLoading(false)
              return
            }

            // Clean up previous machine listeners
            unsubscribeMachines.forEach((unsub) => unsub())
            unsubscribeMachines = []

            // Set up listeners for each machine
            const machinesData = []
            linkedMachineIds.forEach((machineId) => {
              const machineRef = doc(db, "machines", machineId)
              const unsubscribe = onSnapshot(machineRef, (machineDoc) => {
                if (machineDoc.exists()) {
                  const data = machineDoc.data()

                  // If this is the first time seeing this machine, add it to the array
                  if (!machinesData.some((m) => m.id === machineId)) {
                    machinesData.push({
                      id: machineId,
                      name: data.name || `Machine-${machineId.substring(0, 4)}`,
                      added: formatDate(data.linkedUsers?.[currentUser.uid]?.linkedAt || new Date()),
                      image: data.imageUrl || "/default.png",
                      location: data.location,
                      model: data.model,
                      linkedAt: data.linkedUsers?.[currentUser.uid]?.linkedAt,
                    })

                    // Update the machines state with the latest data
                    setMachines([...machinesData])
                  } else {
                    // Update existing machine data
                    setMachines((prev) =>
                      prev.map((m) =>
                        m.id === machineId
                          ? {
                              ...m,
                              name: data.name || m.name,
                            }
                          : m,
                      ),
                    )
                  }
                }
              })

              unsubscribeMachines.push(unsubscribe)
            })

            setLoading(false)
          },
          (error) => {
            console.error("Error fetching user data:", error)
            setError("Failed to load your linked machines")
            setLoading(false)
          },
        )
      } catch (err) {
        console.error("Error setting up machine listeners:", err)
        setError("Failed to load your linked machines")
        setLoading(false)
      }
    }

    fetchLinkedMachines()

    // Cleanup function
    return () => {
      if (unsubscribeUser) {
        unsubscribeUser()
      }
      unsubscribeMachines.forEach((unsub) => unsub())
    }
  }, [currentUser])

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

  // Calculate statistics
  const totalMachines = machines.length

  return (
    <div className="min-h-screen flex flex-col gap-6 bg-gray-300/10 p-4 lg:p-6">
      <Navbar
        sidebarOpen={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleMobileSidebar={toggleMobileSidebar}
      />

      <main>
        <div className="container mx-auto">
          <div className="flex gap-6">
            <Sidebar
              sidebarOpen={sidebarOpen}
              mobileSidebarOpen={mobileSidebarOpen}
              toggleMobileSidebar={toggleMobileSidebar}
            />

            <div className="w-full flex gap-6">
              <div className="flex flex-1 flex-col gap-6">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <div className="col-span-6 bg-blue-500 p-6 rounded-2xl shadow">
                    <h1 className="text-xl text-white flex items-center gap-2">
                      <Monitor className="w-5 h-5" /> Total Machines:
                    </h1>
                    <h1 className="text-4xl font-medium text-white text-end">{totalMachines}</h1>
                  </div>
                </div>

                <div className="bg-white border p-6 rounded-2xl shadow flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-medium">List of Machines</h3>

                    <button
                      type="button"
                      onClick={handleManageMachines}
                      className="px-4 py-2 rounded-lg bg-blue-500 transition-colors duration-150 text-white hover:bg-blue-600 flex items-center gap-4"
                    >
                      <MonitorCog className="w-5 h-5" />
                      <span className="">Manage machines</span>
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                      <p className="text-gray-500">Loading your machines...</p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                      <p className="text-red-500 font-medium">{error}</p>
                      <p className="text-gray-500 mt-2">Please try refreshing the page.</p>
                    </div>
                  ) : machines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Monitor className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-gray-700 font-medium">No machines linked</p>
                      <p className="text-gray-500 mt-2">You don't have any machines linked to your account yet.</p>
                      <button
                        type="button"
                        onClick={handleManageMachines}
                        className="mt-4 px-4 py-2 rounded-lg bg-blue-500 transition-colors duration-150 text-white hover:bg-blue-600 flex items-center gap-2"
                      >
                        <MonitorCog className="w-4 h-4" />
                        <span>Add Machines</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-4">
                      {machines.map((machine) => (
                        <div
                          key={machine.id}
                          className="col-span-4 md:col-span-2 border rounded-lg p-4 flex items-center hover:bg-gray-300/20 transition relative"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative rounded-full w-20 h-20 border border-blue-500 overflow-hidden">
                              <Image
                                src={machine.image || "/default.png"}
                                alt={`${machine.name} Logo`}
                                fill
                                className="object-cover"
                                priority
                              />
                            </div>
                            <div className="flex flex-col gap-1 items-start">
                              <h1 className="font-medium text-l">{machine.name}</h1>
                              <span className="text-gray-500 text-sm">Linked: {machine.added}</span>
                              {machine.location && (
                                <span className="text-gray-500 text-sm">Location: {machine.location}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Notifications />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

