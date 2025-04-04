"use client"

import { useState, useEffect, useRef } from "react"
import {
  Camera,
  X,
  LinkIcon,
  Server,
  CheckCircle,
  AlertCircle,
  Cpu,
  Tag,
  Calendar,
  Scan,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Upload,
} from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { createNotification } from "../../../../lib/notifications/NotificationsService"

export default function AddMachines() {
  const [globalMessage, setGlobalMessage] = useState("")
  const [errors, setErrors] = useState({})
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scanningAnimation, setScanningAnimation] = useState(false)
  const [formData, setFormData] = useState({
    machineCode: "",
  })
  const [scannedMachine, setScannedMachine] = useState(null)
  const [showPinInput, setShowPinInput] = useState(false)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [processingUpload, setProcessingUpload] = useState(false)
  const fileInputRef = useRef(null)

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

  useEffect(() => {
    let html5QrCode
    let animationInterval

    if (isCameraOpen) {
      // Start scanning animation
      setScanningAnimation(true)
      animationInterval = setInterval(() => {
        setScanningAnimation((prev) => !prev)
      }, 1500)

      html5QrCode = new Html5Qrcode("qr-reader")

      html5QrCode
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 350, height: 350 },
          },
          (decodedText) => {
            // Success callback
            setFormData((prev) => ({
              ...prev,
              machineCode: decodedText,
            }))

            // Parse the QR code data to display machine details
            try {
              const machineData = JSON.parse(decodedText)
              setScannedMachine(machineData)
            } catch (error) {
              console.error("Error parsing QR code:", error)
              setScannedMachine(null)
              setGlobalMessage("Invalid QR code format. Please scan a valid machine QR code.")
              setTimeout(() => {
                setGlobalMessage("")
              }, 3000)
              return
            }

            html5QrCode.stop()
            setIsCameraOpen(false)
            setGlobalMessage("QR Code scanned successfully!")
            setTimeout(() => {
              setGlobalMessage("")
            }, 3000)
          },
          (error) => {
            // Silence errors as they're expected while scanning
          },
        )
        .catch((err) => {
          console.error("Error starting camera:", err)
          setGlobalMessage("Error accessing camera. Please try again.")
          setTimeout(() => {
            setGlobalMessage("")
          }, 3000)
        })
    }

    // Cleanup function
    return () => {
      if (html5QrCode?.isScanning) {
        html5QrCode.stop().catch(console.error)
      }
      if (animationInterval) {
        clearInterval(animationInterval)
      }
    }
  }, [isCameraOpen])

  const handlePinChange = (e) => {
    setPin(e.target.value)
    setPinError("")
  }

  const verifyPin = async () => {
    if (!pin.trim()) {
      setPinError("Please enter the machine PIN")
      return false
    }

    try {
      setLoading(true)

      // Make an API call to verify the PIN
      const verifyResponse = await fetch("/api/machines/verify-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machineId: scannedMachine.id,
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
      setLoading(false)
    }
  }

  const handleInitiateLinking = (e) => {
    // Prevent form submission
    e.preventDefault()
    setShowPinInput(true)
  }

  // Function to create machine linked notification
  const createMachineLinkNotification = async (userId, machineName) => {
    try {
      // Create the notification
      await createNotification(
        userId,
        `You've successfully linked a new machine: ${machineName || "Machine"}`,
        "machine_linked",
      )
    } catch (error) {
      console.error("Error creating machine link notification:", error)
    }
  }

  const handleSubmit = async (event) => {
    // Prevent form submission
    event.preventDefault()

    if (showPinInput) {
      // Verify PIN first
      setLoading(true)
      const isPinValid = await verifyPin()
      if (!isPinValid) {
        setLoading(false)
        return
      }
    }

    setLoading(true)
    setErrors({})

    try {
      // Parse the QR code data
      let machineData
      try {
        machineData = JSON.parse(formData.machineCode)
      } catch (error) {
        setGlobalMessage("Invalid QR code format. Please scan a valid machine QR code.")
        setLoading(false)
        return
      }

      // Verify the QR code contains required fields
      if (!machineData.id || !machineData.linkToken) {
        setGlobalMessage("Invalid machine QR code. Missing required information.")
        setLoading(false)
        return
      }

      // Check if user is authenticated
      if (!currentUser) {
        setGlobalMessage("You must be logged in to link a machine.")
        setLoading(false)
        return
      }

      // Link the machine to the user
      const linkResponse = await fetch("/api/machines/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machineId: machineData.id,
          linkToken: machineData.linkToken,
          userId: currentUser.uid,
          pin: pin, // Include the PIN in the request
        }),
      })

      // Check if response is JSON
      const linkContentType = linkResponse.headers.get("content-type")
      if (!linkContentType || !linkContentType.includes("application/json")) {
        console.error("Non-JSON response from link API:", await linkResponse.text())
        setGlobalMessage("Server returned an invalid response. Please try again.")
        setLoading(false)
        return
      }

      const linkResult = await linkResponse.json()

      if (!linkResponse.ok) {
        setGlobalMessage(linkResult.error || "Failed to link machine. Please try again.")
        setLoading(false)
        return
      }

      // Check if the machine is already linked
      if (linkResult.alreadyLinked) {
        setGlobalMessage(linkResult.message)
        setFormData({ machineCode: "" }) // Reset form
        setScannedMachine(null) // Clear scanned machine data
        setShowPinInput(false) // Hide PIN input
        setPin("") // Clear PIN
      } else {
        // Success for new link - Create notification
        await createMachineLinkNotification(
          currentUser.uid,
          machineData.name || scannedMachine.name || `Machine ${machineData.id}`,
        )

        setGlobalMessage("Machine linked successfully!")
        setFormData({ machineCode: "" }) // Reset form
        setScannedMachine(null) // Clear scanned machine data
        setShowPinInput(false) // Hide PIN input
        setPin("") // Clear PIN
      }
    } catch (error) {
      console.error("Error linking machine:", error)
      setGlobalMessage("Error connecting to server. Please try again.")
    } finally {
      setLoading(false)
      setTimeout(() => {
        if (globalMessage.includes("successfully")) {
          setGlobalMessage("")
        }
      }, 3000)
    }
  }

  const resetScan = (e) => {
    // Prevent form submission
    e.preventDefault()
    setScannedMachine(null)
    setFormData({ machineCode: "" })
    setShowPinInput(false)
    setPin("")
    setPinError("")
  }

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString()
    } catch (e) {
      return "Invalid date"
    }
  }

  // Toggle PIN visibility
  const togglePinVisibility = (e) => {
    // Prevent form submission
    e.preventDefault()
    setShowPin(!showPin)
  }

  // Handle file upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Process the uploaded QR code image
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setProcessingUpload(true)
      setGlobalMessage("Processing QR code image...")

      const html5QrCode = new Html5Qrcode("qr-reader-hidden")

      // Create a file URL
      const fileUrl = URL.createObjectURL(file)

      // Decode the QR code from the image
      const decodedText = await html5QrCode.scanFile(file, /* showImage */ false)

      // Clean up
      URL.revokeObjectURL(fileUrl)
      html5QrCode.clear()

      // Process the decoded text
      try {
        const machineData = JSON.parse(decodedText)
        setFormData((prev) => ({
          ...prev,
          machineCode: decodedText,
        }))
        setScannedMachine(machineData)
        setGlobalMessage("QR Code uploaded and processed successfully!")
      } catch (error) {
        console.error("Error parsing QR code:", error)
        setGlobalMessage("Invalid QR code format. Please upload a valid machine QR code.")
      }
    } catch (error) {
      console.error("Error processing QR code image:", error)
      setGlobalMessage("Could not read QR code from image. Please try another image or use the camera scanner.")
    } finally {
      setProcessingUpload(false)
      setTimeout(() => {
        if (globalMessage.includes("successfully")) {
          setGlobalMessage("")
        }
      }, 3000)
    }
  }

  return (
    <>
      {/* Use onSubmit to prevent default form submission */}
      <form
        className="border-l flex flex-1 flex-col gap-10 lg:gap-8 p-8 bg-white border xl:bg-none rounded-2xl xl:rounded-none shadow xl:shadow-none w-full"
        onSubmit={(e) => e.preventDefault()}
      >
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

        {/* User authentication status */}
        {!currentUser && (
          <div className="border-l-4 border-amber-500 bg-amber-50 rounded-lg px-4 py-2 w-full text-amber-700">
            You are not logged in. Please log in to link machines.
          </div>
        )}

        {/* basic information */}
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-medium">New machines</h3>

          <div className="flex flex-col xl:flex-row gap-4 xl:gap-8">
            <div className="w-full text-gray-500 text-sm mb-4 xl:mb-0">
              Basic details used for identification, verification, and communication.
            </div>

            <div className="w-full grid grid-cols-3 gap-8">
              {!scannedMachine ? (
                <div className="col-span-3 flex flex-col gap-1 justify-center">
                  <label htmlFor="qrReader">QR Reader</label>
                  <div className="flex justify-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-4">Scan or upload a QR code to link a machine</p>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          type="button"
                          onClick={() => setIsCameraOpen(true)}
                          className="px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-150 bg-blue-500 hover:bg-blue-600 text-white"
                          disabled={!currentUser || processingUpload}
                        >
                          <Camera className="w-5 h-5" />
                          Scan QR Code
                        </button>

                        <button
                          type="button"
                          onClick={handleUploadClick}
                          className="px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-150 border border-blue-500 text-blue-500 hover:bg-blue-50"
                          disabled={!currentUser || processingUpload}
                        >
                          <Upload className="w-5 h-5" />
                          Upload QR Image
                        </button>

                        {/* Hidden file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={!currentUser || processingUpload}
                        />
                      </div>

                      {processingUpload && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing image...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hidden element for QR code processing */}
                  <div id="qr-reader-hidden" className="hidden"></div>
                </div>
              ) : (
                <>
                  {/* Scanned Machine Details Card */}
                  <div className="col-span-3 mt-2 mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Server className="w-5 h-5 text-blue-600" />
                          <h4 className="font-medium text-blue-800">Scanned Machine</h4>
                        </div>
                        <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                          <CheckCircle className="w-3 h-3" />
                          <span>Ready to Link</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-blue-600">Machine ID</p>
                            <p className="font-medium">{scannedMachine.id}</p>
                          </div>
                        </div>

                        {scannedMachine.name && (
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-blue-600">Machine Name</p>
                              <p className="font-medium">{scannedMachine.name}</p>
                            </div>
                          </div>
                        )}

                        {scannedMachine.serialNumber && (
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-blue-600">Serial Number</p>
                              <p className="font-medium">{scannedMachine.serialNumber}</p>
                            </div>
                          </div>
                        )}

                        {scannedMachine.timestamp && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-blue-600">Generated</p>
                              <p className="font-medium">{formatDate(scannedMachine.timestamp)}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {scannedMachine.expiresAt && (
                        <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-md text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>QR Code expires at {formatDate(scannedMachine.expiresAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PIN Input Section */}
                  {showPinInput ? (
                    <div className="col-span-3 mb-4">
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Lock className="w-5 h-5 text-blue-600" />
                          <h4 className="font-medium">Enter Machine PIN</h4>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                          Please enter the PIN displayed on the machine to verify ownership.
                        </p>

                        <div className="relative mb-2">
                          <input
                            type={showPin ? "text" : "password"}
                            value={pin}
                            onChange={handlePinChange}
                            placeholder="Enter PIN"
                            className={`w-full px-4 py-2 border rounded-lg ${
                              pinError ? "border-red-300 bg-red-50" : "border-gray-300"
                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                          <button
                            type="button"
                            onClick={togglePinVisibility}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                          >
                            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {pinError && <p className="text-sm text-red-500 mb-4">{pinError}</p>}
                      </div>
                    </div>
                  ) : null}

                  {/* Action Buttons */}
                  <div className="col-span-3 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={resetScan}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>

                    {showPinInput ? (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-blue-500 transition-colors duration-150 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <LinkIcon className="w-4 h-4" />
                            Verify & Link
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleInitiateLinking}
                        className="px-4 py-2 rounded-lg bg-blue-500 transition-colors duration-150 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Continue to Link
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Modern QR Scanner Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl transform transition-all">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-white">
                <Scan className="w-5 h-5" />
                <h3 className="text-lg font-medium">Scan Machine QR Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCameraOpen(false)}
                className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera view with overlay */}
            <div className="relative bg-black">
              {/* Camera feed */}
              <div className="aspect-[4/3] w-full overflow-hidden">
                <div id="qr-reader" className="w-full h-full"></div>
              </div>

              {/* Scanning overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Scanning animation */}
                <div
                  className={`relative w-80 h-80 border-2 border-white/50 rounded-lg ${scanningAnimation ? "scale-105" : "scale-100"} transition-transform duration-1000`}
                >
                  {/* Corner highlights */}
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>

                  {/* Scanning line animation */}
                  <div
                    className={`absolute left-0 right-0 h-1 bg-blue-500 opacity-80 transition-all duration-1500 ease-in-out ${
                      scanningAnimation ? "top-0" : "top-[calc(100%-4px)]"
                    }`}
                  ></div>
                </div>
              </div>
            </div>

            {/* Footer with instructions */}
            <div className="px-6 py-4 bg-gray-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Position the QR code within the frame</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-gray-600">Make sure the QR code is well-lit and clearly visible</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-gray-600">Hold your device steady for better scanning results</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

