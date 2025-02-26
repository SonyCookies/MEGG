"use client"

import { useState, useEffect } from "react"
import { Save, Camera, X, LinkIcon } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"

export default function AddMachines() {
  const [globalMessage, setGlobalMessage] = useState("")
  const [errors, setErrors] = useState({})
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    machineCode: "",
  })

  useEffect(() => {
    let html5QrCode

    if (isCameraOpen) {
      html5QrCode = new Html5Qrcode("qr-reader")

      html5QrCode
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 400, height: 400 },
          },
          (decodedText) => {
            // Success callback
            setFormData((prev) => ({
              ...prev,
              machineCode: decodedText,
            }))
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
    }
  }, [isCameraOpen])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      // Add your machine code submission logic here
      // For example, saving to Firebase

      setGlobalMessage("Machine added successfully!")
      setFormData({ machineCode: "" }) // Reset form
    } catch (error) {
      console.error("Error adding machine:", error)
      setGlobalMessage("Error adding machine. Please try again.")
    } finally {
      setLoading(false)
      setTimeout(() => {
        setGlobalMessage("")
      }, 3000)
    }
  }

  return (
    <>
      <form className="border-l flex flex-1 flex-col gap-10 lg:gap-8 p-8 bg-white border xl:border-none xl:bg-none rounded-2xl xl:rounded-none shadow xl:shadow-none w-full">
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

        {/* basic information */}
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-medium">New machines</h3>

          <div className="flex flex-col xl:flex-row gap-4 xl:gap-8">
            <div className="w-full text-gray-500 text-sm mb-4 xl:mb-0">
              Basic details used for identification, verification, and communication.
            </div>

            <div className="w-full grid grid-cols-3 gap-8">
              <div className="col-span-3 flex flex-col gap-1 justify-center">
                <label htmlFor="qrReader">QR Reader</label>

                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-4 py-2 rounded-lg flex items-center justify-center gap-4 transition-colors duration-150 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Camera className="w-5 h-5" />
                  Scan QR Code
                </button>
              </div>
              <div className="col-span-3 flex flex-col gap-1 justify-center">
                <label htmlFor="machineCode">Machine code</label>
                <input
                  type="text"
                  name="machineCode"
                  id="machineCode"
                  className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors duration-150"
                  placeholder="Enter machine code"
                  value={formData.machineCode}
                  onChange={handleChange}
                />
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={!formData.machineCode || loading}
                  className="px-4 py-2 rounded-lg bg-blue-500 transition-colors duration-150 hover:bg-blue-600 text-white flex items-center justify-center gap-4 mt-2 disabled:bg-blue-300"
                >
                  <LinkIcon className="w-5 h-5" />
                  {loading ? "Linking..." : "Link Machine"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Scan QR Code</h3>
              <button
                onClick={() => setIsCameraOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
              <div id="qr-reader" className="w-full h-full"></div>
            </div>

            <p className="text-sm text-gray-500 mt-4 text-center">Position the QR code within the frame to scan</p>
          </div>
        </div>
      )}
    </>
  )
}

