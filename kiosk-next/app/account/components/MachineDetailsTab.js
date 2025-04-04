"use client"

import { useEffect, useState, useCallback } from "react"
import QRCode from "react-qr-code"
import {
  Edit2,
  X,
  Save,
  QrCode,
  Info,
  Settings,
  Shield,
  Building,
  MapPin,
  Link,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import { generateLinkToken, initializeMachineLink } from "../utils/machine-link"
import { addAccessLog } from "../utils/logging"

export default function MachineDetailsTab() {
  const [loading, setLoading] = useState(true)
  const [machineDetails, setMachineDetails] = useState(null)
  const [machineId, setMachineId] = useState(null)
  const [qrCodeData, setQrCodeData] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedDetails, setEditedDetails] = useState({})
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState("")
  const [generatingQR, setGeneratingQR] = useState(false)
  const [linkStatus, setLinkStatus] = useState({ isLinked: false })

  // Generate new QR code data
  const generateQRCode = useCallback(async () => {
    if (machineDetails && machineId) {
      try {
        setGeneratingQR(true)
        const { token, expiresAt } = await generateLinkToken(machineId)

        const newQrData = {
          id: machineId,
          name: machineDetails.name,
          serialNumber: machineDetails.serialNumber,
          timestamp: new Date().toISOString(),
          linkToken: token,
          expiresAt,
        }
        setQrCodeData(newQrData)
      } catch (error) {
        console.error("Error generating QR code:", error)
      } finally {
        setGeneratingQR(false)
      }
    }
  }, [machineDetails, machineId])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // First verify session
        const sessionResponse = await fetch("/api/auth/session")
        const sessionData = await sessionResponse.json()

        if (!sessionResponse.ok) {
          throw new Error(sessionData.error || "Session invalid")
        }

        if (!sessionData.machineId) {
          throw new Error("Machine ID not found in session")
        }

        setMachineId(sessionData.machineId)

        // Fetch machine details
        const machineResponse = await fetch(`/api/machines/${sessionData.machineId}`)
        const machineData = await machineResponse.json()

        if (!machineResponse.ok) {
          throw new Error(machineData.error || "Failed to fetch machine details")
        }

        setMachineDetails(machineData.machine)
        setEditedDetails(machineData.machine)

        // Initialize machine link status listener
        const unsubscribe = initializeMachineLink(sessionData.machineId, (status) => {
          console.log("Link status updated:", status)
          setLinkStatus(status)
        })

        // Return cleanup function
        return () => {
          if (unsubscribe) unsubscribe()
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch link status directly if not available through listener
  useEffect(() => {
    const fetchLinkStatus = async () => {
      if (machineId && !linkStatus.isLinked) {
        try {
          const machineRef = doc(db, "machines", machineId)
          const machineSnap = await getDoc(machineRef)

          if (machineSnap.exists()) {
            const data = machineSnap.data()
            const linkedUsers = data.linkedUsers || {}
            const isLinked = Object.keys(linkedUsers).length > 0

            if (isLinked) {
              // Get the first linked user (or you could get all of them)
              const userId = Object.keys(linkedUsers)[0]
              const userInfo = linkedUsers[userId]

              // Fetch user details if needed
              let userData = { fullname: "Unknown User", email: "unknown@example.com" }

              try {
                const userRef = doc(db, "users", userId)
                const userSnap = await getDoc(userRef)
                if (userSnap.exists()) {
                  userData = userSnap.data()
                }
              } catch (error) {
                console.error("Error fetching user data:", error)
              }

              setLinkStatus({
                isLinked: true,
                linkedUser: {
                  uid: userId,
                  name: userData.fullname || userData.displayName || "Unknown User",
                  email: userData.email || "unknown@example.com",
                },
                linkTime: userInfo.linkedAt,
              })
            }
          }
        } catch (error) {
          console.error("Error fetching link status:", error)
        }
      }
    }

    fetchLinkStatus()
  }, [machineId, linkStatus.isLinked])

  const handleEdit = () => {
    setIsEditing(true)
    setEditedDetails(machineDetails)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedDetails(machineDetails)
    setSaveError("")
    setSaveSuccess("")
  }

  const handleInputChange = (field, value) => {
    setEditedDetails((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    try {
      setSaveError("")
      setSaveSuccess("")

      const machineRef = doc(db, "machines", machineId)
      await updateDoc(machineRef, {
        ...editedDetails,
        updatedAt: new Date().toISOString(),
      })

      await addAccessLog({
        action: "machine_update",
        machineId,
        status: "success",
        details: "Machine details updated successfully",
      })

      setMachineDetails(editedDetails)
      setIsEditing(false)
      setSaveSuccess("Changes saved successfully")
    } catch (error) {
      console.error("Error saving details:", error)
      setSaveError(error.message || "Failed to save changes")
    }
  }

  const handleDownloadQR = () => {
    const svg = document.getElementById("machine-qr-code")
    if (svg) {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const image = new Image()

      const svgData = new XMLSerializer().serializeToString(svg)
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
      const svgUrl = URL.createObjectURL(svgBlob)

      canvas.width = 1000
      canvas.height = 1000

      image.onload = () => {
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

        const pngUrl = canvas.toDataURL("image/png")
        const downloadLink = document.createElement("a")
        downloadLink.href = pngUrl
        downloadLink.download = `machine-qr-${machineId}.png`
        downloadLink.click()

        URL.revokeObjectURL(svgUrl)
      }

      image.crossOrigin = "anonymous"
      image.src = svgUrl
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not available"

    try {
      // Handle Firestore timestamp objects
      if (typeof dateString === "object" && dateString.toDate) {
        return dateString.toDate().toLocaleString()
      }

      // Handle Firestore timestamp in JSON format
      if (typeof dateString === "object" && dateString.seconds) {
        return new Date(dateString.seconds * 1000).toLocaleString()
      }

      // Handle regular date strings
      return new Date(dateString).toLocaleString()
    } catch (e) {
      console.error("Error formatting date:", e)
      return "Invalid date"
    }
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Machine Information */}
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
                  <Settings className="w-6 h-6" />
                  Machine Information
                </h2>
                <p className="text-gray-500">View and manage machine details</p>
              </div>
            </div>

            {/* Machine Details Form */}
            <div className="bg-white rounded-xl border p-6 shadow-sm space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-[#0e4772] flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Basic Information
                </h3>
                <div className="grid gap-4">
                  {[
                    { label: "Machine Name", icon: Settings },
                    { label: "Machine ID", icon: QrCode },
                    { label: "Model", icon: Building },
                    { label: "Location", icon: MapPin },
                  ].map(({ label, icon: Icon }) => (
                    <div key={label} className="space-y-1">
                      <label className="text-sm text-gray-500 flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#0e5f97]" />
                        {label}
                      </label>
                      <div className="h-10 w-full rounded-lg animate-shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Owner Details */}
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0e4772] flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5" />
                Owner Details
              </h3>
              <div className="space-y-4">
                <div className="grid gap-4">
                  {["Owner Name", "Email Address", "Linked Since"].map((label) => (
                    <div key={label} className="space-y-1">
                      <p className="text-sm text-gray-500">{label}</p>
                      <div className="h-6 w-full rounded-lg animate-shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - QR Code and Link Status */}
          <div className="lg:pl-8 lg:border-l space-y-6">
            {/* QR Code Section */}
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[#0e4772] flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Machine QR Code
                </h3>
                <p className="text-sm text-gray-500">Scan to link this machine to your web account</p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <div className="w-[200px] h-[200px] rounded-lg animate-shimmer" />
                </div>
                <div className="flex gap-3">
                  <div className="h-10 w-24 rounded-lg animate-shimmer" />
                  <div className="h-10 w-24 rounded-lg animate-shimmer" />
                </div>
              </div>
            </div>

            {/* Link Status */}
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0e4772] flex items-center gap-2 mb-4">
                <Link className="w-5 h-5" />
                Connection Status
              </h3>
              <div className="h-10 w-full rounded-lg animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Machine Information */}
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Machine Information
              </h2>
              <p className="text-gray-500">View and manage machine details</p>
            </div>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="p-2 hover:bg-[#0e5f97]/10 rounded-lg transition-colors"
                aria-label="Edit details"
              >
                <Edit2 className="w-5 h-5 text-[#0e5f97]" />
              </button>
            ) : (
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                aria-label="Cancel editing"
              >
                <X className="w-5 h-5 text-red-600" />
              </button>
            )}
          </div>

          {/* Status Messages */}
          {(saveError || saveSuccess) && (
            <div
              className={`mb-4 px-4 py-3 rounded-lg border ${
                saveError ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-600"
              }`}
            >
              <p className="text-sm">{saveError || saveSuccess}</p>
            </div>
          )}

          {/* Machine Details Form */}
          <div className="bg-white rounded-xl border p-6 shadow-sm space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-[#0e4772] flex items-center gap-2">
                <Info className="w-4 h-4" />
                Basic Information
              </h3>
              <div className="grid gap-4">
                {[
                  { label: "Machine Name", field: "name", icon: Settings },
                  { label: "Machine ID", field: "id", icon: QrCode },
                  { label: "Model", field: "model", icon: Building },
                  { label: "Location", field: "location", icon: MapPin },
                ].map(({ label, field, icon: Icon }) => (
                  <div key={field} className="space-y-1">
                    <label className="text-sm text-gray-500 flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#0e5f97]" />
                      {label}
                    </label>
                    {isEditing && field !== "id" ? (
                      <input
                        type="text"
                        value={editedDetails[field] || ""}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e5f97] focus:border-[#0e5f97]"
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        {field === "id" ? (
                          <p className="font-medium text-gray-900">
                            {machineId}
                            <span className="ml-2 text-xs text-gray-400">(Not editable)</span>
                          </p>
                        ) : machineDetails[field] ? (
                          <p className="font-medium text-gray-900">{machineDetails[field]}</p>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400 italic">
                            <span className="text-sm">No {label.toLowerCase()} added</span>
                            {!isEditing && (
                              <button
                                onClick={handleEdit}
                                className="text-[#0e5f97] hover:text-[#0e4772] text-xs font-medium non-italic transition-colors"
                              >
                                Add now
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <button
                onClick={handleSave}
                className="w-full bg-[#0e5f97] hover:bg-[#0e4772] text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            )}
          </div>

          {/* Owner Details */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#0e4772] flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5" />
              Owner Details
            </h3>

            {linkStatus.isLinked ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Machine Linked</span>
                </div>
                <div className="grid gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Owner Name</p>
                    <p className="font-medium text-gray-900">{linkStatus.linkedUser?.name || "Not available"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium text-gray-900">{linkStatus.linkedUser?.email || "Not available"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Linked Since</p>
                    <p className="font-medium text-gray-900">{formatDate(linkStatus.linkTime)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="mb-4">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto" />
                </div>
                <h4 className="text-gray-600 font-medium mb-2">No Owner Details Available</h4>
                <p className="text-sm text-gray-500">Link this machine to your web account to view owner details.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - QR Code and Link Status */}
        <div className="lg:pl-8 lg:border-l space-y-6">
          {/* QR Code Section */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[#0e4772] flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Machine QR Code
              </h3>
              <p className="text-sm text-gray-500">Scan to link this machine to your web account</p>
            </div>

            <div className="flex flex-col items-center gap-6">
              {linkStatus.isLinked ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <QrCode className="w-16 h-16 text-gray-300 mx-auto" />
                  </div>
                  <h4 className="text-gray-600 font-medium mb-2">Machine Already Linked</h4>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    This machine is already linked to an account. QR code generation is disabled.
                  </p>
                </div>
              ) : qrCodeData ? (
                <>
                  <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <QRCode
                      id="machine-qr-code"
                      value={JSON.stringify(qrCodeData)}
                      size={200}
                      level="H"
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox={`0 0 256 256`}
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-sm text-green-600 font-medium">QR Code eligible to link</div>
                    <div className="text-sm text-gray-500">
                      Expires at: {new Date(qrCodeData.expiresAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownloadQR}
                      className="flex items-center gap-2 px-4 py-2 border border-[#0e5f97]/20 rounded-lg text-[#0e4772] hover:bg-[#0e5f97]/5 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={generateQRCode}
                      className="flex items-center gap-2 px-4 py-2 border border-[#0e5f97]/20 rounded-lg text-[#0e4772] hover:bg-[#0e5f97]/5 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <QrCode className="w-16 h-16 text-gray-300" />
                  <button
                    onClick={generateQRCode}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0e5f97] text-white rounded-lg hover:bg-[#0e4772] transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    Generate QR Code
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Creative Connection Status */}
          <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-[#0e4772] to-[#0e5f97] px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Link className="w-5 h-5" />
                Connection Status
              </h3>
            </div>

            {/* Connection visualization */}
            <div className="p-6">
              {linkStatus.isLinked ? (
                <div className="flex flex-col items-center">
                  {/* Connected visualization */}
                  <div className="relative mb-6">
                    <div className="relative z-10 bg-gradient-to-br from-green-400 to-green-600 text-white p-6 rounded-full">
                      <Wifi className="w-12 h-12" />
                    </div>
                  </div>

                  {/* Connection details */}
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-green-600 mb-2">Connected</h4>
                    <p className="text-gray-600">
                      This machine is linked to{" "}
                      <span className="font-semibold">{linkStatus.linkedUser?.name || "a user"}</span>
                    </p>
                    <div className="mt-4 inline-block bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm">
                      Active connection since {formatDate(linkStatus.linkTime)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* Disconnected visualization */}
                  <div className="mb-6 bg-gray-200 p-6 rounded-full">
                    <WifiOff className="w-12 h-12 text-gray-400" />
                  </div>

                  {/* Disconnected message */}
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-gray-500 mb-2">Not Connected</h4>
                    <p className="text-gray-600 mb-4">This machine is not linked to any user account</p>

                    {/* Steps to connect */}
                    <div className="bg-blue-50 rounded-lg p-4 text-left">
                      <h5 className="font-medium text-blue-700 mb-2">How to connect:</h5>
                      <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                        <li>Generate a QR code above</li>
                        <li>Open the web app on your device</li>
                        <li>Scan the QR code with the app</li>
                        <li>Enter the machine PIN when prompted</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

