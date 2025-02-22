"use client"

import { useEffect, useState, useCallback } from "react"
import QRCode from "react-qr-code"
import { Loader2, Download, RefreshCw, Save, Edit2, X, Link } from "lucide-react"

export default function MachineDetailsTab() {
  const [loading, setLoading] = useState(true)
  const [machineDetails, setMachineDetails] = useState(null)
  const [editedDetails, setEditedDetails] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState("")
  const [linkStatus, setLinkStatus] = useState({
    isLinked: false,
    linkedUser: null,
    linkTime: null,
  })
  const [qrCodeData, setQrCodeData] = useState(null)

  // Generate a unique token for this linking session
  const generateLinkToken = useCallback(() => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }, [])

  // Generate new QR code data
  const refreshQRCode = useCallback(() => {
    if (machineDetails) {
      const newQrData = {
        id: machineDetails.id,
        name: machineDetails.name, // Include machine name
        serialNumber: machineDetails.serialNumber,
        timestamp: new Date().toISOString(),
        linkToken: generateLinkToken(),
        expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
      }
      setQrCodeData(newQrData)
    }
  }, [machineDetails, generateLinkToken])

  // Initialize WebSocket connection
  useEffect(() => {
    // Create WebSocket connection
    const ws = new WebSocket("your_websocket_url") // Replace with your WebSocket URL

    ws.onopen = () => {
      console.log("WebSocket Connected")
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === "MACHINE_LINKED") {
        setLinkStatus({
          isLinked: true,
          linkedUser: data.user,
          linkTime: new Date(),
        })
        setSaveSuccess("Machine successfully linked to web account!")
      }

      if (data.type === "MACHINE_UNLINKED") {
        setLinkStatus({
          isLinked: false,
          linkedUser: null,
          linkTime: null,
        })
        setSaveSuccess("Machine unlinked from web account")
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error)
    }

    ws.onclose = () => {
      console.log("WebSocket Disconnected")
    }

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [])

  // Initialize machine details and generate INITIAL QR code
  useEffect(() => {
    const fetchMachineDetails = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const details = {
          id: "MEGG-001",
          name: "EggSorter Pro",
          model: "ES-2000",
          serialNumber: "SN2024001",
          location: "Processing Plant A",
          lastMaintenance: "2024-02-15",
          nextMaintenance: "2024-03-15",
          owner: {
            name: "John Smith",
            email: "john.smith@example.com",
            phone: "+1 (555) 123-4567",
          },
        }
        setMachineDetails(details)

        // Generate initial QR code data only if it doesn't exist
        if (!qrCodeData) {
          const initialQrData = {
            id: details.id,
            name: details.name, // Include machine name
            serialNumber: details.serialNumber,
            timestamp: new Date().toISOString(),
            linkToken: generateLinkToken(),
            expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
          }
          setQrCodeData(initialQrData)
        }
      } catch (error) {
        console.error("Error fetching machine details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMachineDetails()
  }, [generateLinkToken, qrCodeData])

  const handleEdit = () => {
    setEditedDetails({ ...machineDetails })
    setIsEditing(true)
    setSaveError("")
    setSaveSuccess("")
  }

  const handleCancel = () => {
    setEditedDetails(null)
    setIsEditing(false)
    setSaveError("")
    setSaveSuccess("")
  }

  // Modify the handleSave function to also refresh the QR code
  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveError("")
      setSaveSuccess("")

      // Here you would make an API call to update the machine details
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setMachineDetails(editedDetails)
      setIsEditing(false)
      setEditedDetails(null)
      setSaveSuccess("Machine details updated successfully")

      // Generate new QR code with updated machine details
      const newQrData = {
        id: editedDetails.id,
        name: editedDetails.name, // Include machine name
        serialNumber: editedDetails.serialNumber,
        timestamp: new Date().toISOString(),
        linkToken: generateLinkToken(),
        expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
      }
      setQrCodeData(newQrData)
    } catch (error) {
      console.error("Error saving machine details:", error)
      setSaveError("Failed to update machine details. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setEditedDetails((prev) => ({
      ...prev,
      [field]: value,
    }))
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
        downloadLink.download = `machine-qr-${machineDetails?.id}.png`
        downloadLink.click()

        URL.revokeObjectURL(svgUrl)
      }

      image.src = svgUrl
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0e5f97]" />
      </div>
    )
  }

  if (!machineDetails) {
    return <div className="text-center text-gray-500">No machine details available</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code Card */}
        <div className="bg-white border rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Machine QR Code</h3>
            <p className="text-sm text-gray-500">
              {linkStatus.isLinked ? "Machine is linked to web account" : "Scan to link machine to web account"}
            </p>
          </div>

          {/* Link Status */}
          {linkStatus.isLinked ? (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Link className="w-4 h-4" />
                <span className="font-medium">Machine Linked</span>
              </div>
              <p className="text-sm text-green-600">Linked to: {linkStatus.linkedUser?.name}</p>
              <p className="text-sm text-green-600">Linked on: {linkStatus.linkTime?.toLocaleString()}</p>
            </div>
          ) : (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              {qrCodeData && (
                <p className="text-sm text-yellow-600">
                  QR Code expires: {new Date(qrCodeData.expiresAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              {qrCodeData && (
                <QRCode
                  id="machine-qr-code"
                  value={JSON.stringify(qrCodeData)}
                  size={200}
                  level="H"
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadQR}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
              <button
                onClick={refreshQRCode}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate New Code
              </button>
            </div>
          </div>
        </div>

        {/* Machine Details Card */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Machine Information</h3>
              <p className="text-sm text-gray-500">Details about this machine</p>
            </div>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Edit details"
              >
                <Edit2 className="w-5 h-5 text-gray-600" />
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

          {(saveError || saveSuccess) && (
            <div
              className={`mb-4 px-4 py-3 rounded-lg border ${
                saveError ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              <p className="text-sm">{saveError || saveSuccess}</p>
            </div>
          )}

          <div className="space-y-4">
            {[
              { label: "Machine Name", field: "name", editable: true },
              { label: "Machine ID", field: "id", editable: false },
              { label: "Model", field: "model", editable: true },
              { label: "Serial Number", field: "serialNumber", editable: false },
              { label: "Location", field: "location", editable: true },
            ].map(({ label, field, editable }) => (
              <div key={field} className="space-y-2">
                <p className="text-sm text-gray-500">{label}</p>
                {isEditing && editable ? (
                  <input
                    type="text"
                    value={editedDetails[field]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e5f97] focus:border-transparent"
                    placeholder={`Enter ${label.toLowerCase()}`}
                  />
                ) : (
                  <p className="font-medium">
                    {(isEditing ? editedDetails : machineDetails)[field]}
                    {!editable && <span className="ml-2 text-xs text-gray-400">(Not editable)</span>}
                  </p>
                )}
              </div>
            ))}
          </div>

          {isEditing && (
            <div className="mt-6">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-[#0e5f97] hover:bg-[#0e4772] text-white rounded-lg transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Maintenance Card */}
        <div className="bg-white border rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Maintenance Schedule</h3>
            <p className="text-sm text-gray-500">Maintenance dates and status</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Last Maintenance</p>
              <p className="font-medium">{new Date(machineDetails.lastMaintenance).toLocaleDateString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Next Maintenance</p>
              <p className="font-medium">{new Date(machineDetails.nextMaintenance).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Owner Details Card */}
        <div className="bg-white border rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Owner Details</h3>
            <p className="text-sm text-gray-500">Machine ownership information</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{machineDetails.owner.name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{machineDetails.owner.email}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{machineDetails.owner.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

