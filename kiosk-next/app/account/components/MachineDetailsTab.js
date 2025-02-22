"use client";

import { useEffect, useState, useCallback } from "react";
import QRCode from "react-qr-code";
import {
  Loader2,
  Download,
  RefreshCw,
  Link,
  Edit2,
  X,
  Save,
  QrCode,
  Info,
  Settings,
  MapPin,
  Building,
  Shield,
} from "lucide-react";
import { db } from "../../firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { generateLinkToken } from "../../utils/machine-link";
import { addAccessLog } from "../../utils/logging";

export default function MachineDetailsTab() {
  const [loading, setLoading] = useState(true);
  const [machineDetails, setMachineDetails] = useState(null);
  const [linkStatus, setLinkStatus] = useState({ isLinked: false });
  const [qrCodeData, setQrCodeData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // Function to generate a machine ID
  const generateMachineId = useCallback(() => {
    const prefix = "MEGG";
    const year = new Date().getFullYear().toString();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    return `${prefix}-${year}-${random}-${sequence}`;
  }, []);

  // Generate new QR code data
  const refreshQRCode = useCallback(async () => {
    if (machineDetails) {
      try {
        // Generate a secure link token
        const { token, expiresAt } = await generateLinkToken(machineDetails.id);

        // Create QR code data with the secure token
        const newQrData = {
          id: machineDetails.id,
          name: machineDetails.name,
          serialNumber: machineDetails.serialNumber,
          timestamp: new Date().toISOString(),
          linkToken: token,
          expiresAt,
        };
        setQrCodeData(newQrData);
      } catch (error) {
        console.error("Error refreshing QR code:", error);
      }
    }
  }, [machineDetails]);

  useEffect(() => {
    const fetchMachineDetails = async () => {
      try {
        setLoading(true);

        // Try to get the machine ID from local storage first
        const savedMachineId = localStorage.getItem("machineId");
        let machineRef;

        if (savedMachineId) {
          machineRef = doc(db, "machines", savedMachineId);
        } else {
          // Generate a new machine ID if none exists
          const newMachineId = generateMachineId();
          machineRef = doc(db, "machines", newMachineId);
        }

        const machineDoc = await getDoc(machineRef);

        if (machineDoc.exists()) {
          const data = machineDoc.data();
          setMachineDetails(data);

          // Generate QR code with existing data
          if (!qrCodeData) {
            const { token, expiresAt } = await generateLinkToken(data.id);
            const initialQrData = {
              id: data.id,
              name: data.name,
              serialNumber: data.serialNumber,
              timestamp: new Date().toISOString(),
              linkToken: token,
              expiresAt,
            };
            setQrCodeData(initialQrData);
          }
        } else {
          // If no machine exists, create new details
          const machineId = machineRef.id; // Use the ID we generated
          const machineName = `MEGG Sorter ${machineId.split("-")[2]}`; // Use part of the ID for the name
          const newMachine = {
            id: machineId,
            name: machineName, // Use the generated name
            model: "MT-01",
            serialNumber: `SN${new Date().getFullYear()}${String(
              Math.floor(Math.random() * 1000)
            ).padStart(3, "0")}`,
            location: "Processing Plant A",
            lastMaintenance: new Date().toISOString(),
            nextMaintenance: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            owner: {
              name: "John Smith",
              email: "john.smith@example.com",
              phone: "+1 (555) 123-4567",
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            totalDefects: 0,
            lastDefectDate: null,
          };

          // Save new machine to Firebase
          await setDoc(machineRef, newMachine);
          // Save machine ID to local storage
          localStorage.setItem("machineId", machineId);
          setMachineDetails(newMachine);

          // Generate initial QR code for new machine
          if (!qrCodeData) {
            const { token, expiresAt } = await generateLinkToken(machineId);
            const initialQrData = {
              id: machineId,
              name: newMachine.name,
              serialNumber: newMachine.serialNumber,
              timestamp: new Date().toISOString(),
              linkToken: token,
              expiresAt,
            };
            setQrCodeData(initialQrData);
          }
        }
      } catch (error) {
        console.error("Error fetching machine details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMachineDetails();
  }, [generateMachineId, qrCodeData]);

  const handleDownloadQR = () => {
    const svg = document.getElementById("machine-qr-code");
    if (svg) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const image = new Image();

      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      canvas.width = 1000;
      canvas.height = 1000;

      image.onload = () => {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `machine-qr-${machineDetails?.id}.png`;
        downloadLink.click();

        URL.revokeObjectURL(svgUrl);
      };

      image.crossOrigin = "anonymous";
      image.src = svgUrl;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const handleEdit = () => {
    setEditedDetails({ ...machineDetails });
    setIsEditing(true);
    setSaveError("");
    setSaveSuccess("");
  };

  const handleCancel = () => {
    setEditedDetails(null);
    setIsEditing(false);
    setSaveError("");
    setSaveSuccess("");
  };

  const handleSave = async () => {
    try {
      setSaveError("");
      setSaveSuccess("");

      const updatedDetails = {
        ...editedDetails,
        updatedAt: new Date().toISOString(),
      };

      const machineRef = doc(db, "machines", machineDetails.id);
      await updateDoc(machineRef, updatedDetails);

      // Log the changes
      const changes = Object.keys(editedDetails).reduce((acc, key) => {
        if (editedDetails[key] !== machineDetails[key]) {
          acc[key] = {
            from: machineDetails[key],
            to: editedDetails[key],
          };
        }
        return acc;
      }, {});

      await addAccessLog({
        action: "machine_update",
        user: "Admin", // Replace with actual user info when available
        status: "success",
        details: "Machine details updated",
        changes: changes,
      });

      setMachineDetails(updatedDetails);
      setIsEditing(false);
      setEditedDetails(null);
      setSaveSuccess("Machine details updated successfully");

      // Generate new QR code with updated machine details
      await refreshQRCode();
    } catch (error) {
      console.error("Error saving machine details:", error);
      setSaveError("Failed to update machine details. Please try again.");

      // Log the error
      await addAccessLog({
        action: "machine_update",
        user: "Admin", // Replace with actual user info when available
        status: "failed",
        details: "Failed to update machine details",
        error: error.message,
      });
    }
  };

  const handleInputChange = (field, value) => {
    setEditedDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0e5f97]" />
      </div>
    );
  }

  if (!machineDetails) {
    return (
      <div className="text-center text-gray-500">
        No machine details available
      </div>
    );
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
                saveError
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-green-50 border-green-200 text-green-600"
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
                  {
                    label: "Serial Number",
                    field: "serialNumber",
                    icon: Shield,
                  },
                  { label: "Location", field: "location", icon: MapPin },
                ].map(({ label, field, icon: Icon }) => (
                  <div key={field} className="space-y-1">
                    <label className="text-sm text-gray-500 flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#0e5f97]" />
                      {label}
                    </label>
                    {isEditing && field !== "id" && field !== "serialNumber" ? (
                      <input
                        type="text"
                        value={editedDetails[field]}
                        onChange={(e) =>
                          handleInputChange(field, e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e5f97] focus:border-[#0e5f97]"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">
                        {machineDetails[field]}
                        {(field === "id" || field === "serialNumber") && (
                          <span className="ml-2 text-xs text-gray-400">
                            (Not editable)
                          </span>
                        )}
                      </p>
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

          {/* Statistics Summary - Moved from right column for better space utilization */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#0e4772] flex items-center gap-2 mb-4">
              <Info className="w-5 h-5" />
              Machine Statistics
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Total Defects</p>
                <p className="font-medium text-2xl text-[#0e4772]">
                  {machineDetails.totalDefects || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Last Defect Detected</p>
                <p className="font-medium">
                  {machineDetails.lastDefectDate
                    ? new Date(machineDetails.lastDefectDate).toLocaleString()
                    : "No defects recorded"}
                </p>
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
              <p className="text-sm text-gray-500">
                Scan to link this machine to your web account
              </p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
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

              {qrCodeData && (
                <div className="text-center text-sm text-gray-500">
                  QR Code expires at:{" "}
                  {new Date(qrCodeData.expiresAt).toLocaleTimeString()}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleDownloadQR}
                  className="flex items-center gap-2 px-4 py-2 border border-[#0e5f97]/20 rounded-lg text-[#0e4772] hover:bg-[#0e5f97]/5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={refreshQRCode}
                  className="flex items-center gap-2 px-4 py-2 border border-[#0e5f97]/20 rounded-lg text-[#0e4772] hover:bg-[#0e5f97]/5 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Link Status */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#0e4772] flex items-center gap-2 mb-4">
              <Link className="w-5 h-5" />
              Connection Status
            </h3>

            {linkStatus.isLinked ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Linked User</p>
                    <p className="font-medium">{linkStatus.linkedUser?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">
                      {linkStatus.linkedUser?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Connected Since</p>
                    <p className="font-medium">
                      {new Date(linkStatus.linkTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="mb-4">
                  <Link className="w-12 h-12 text-gray-400 mx-auto" />
                </div>
                <h4 className="text-gray-600 font-medium mb-2">
                  Not Connected
                </h4>
                <p className="text-sm text-gray-500">
                  Scan the QR code above to link this machine to your web
                  account
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
