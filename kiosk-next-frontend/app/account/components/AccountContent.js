"use client";

import { useEffect, useState, useCallback } from "react";
import QRCode from "react-qr-code";
import { createPortal } from "react-dom";
import {
  QrCodeIcon as QrIcon,
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
  ChevronLeft,
  ChevronRight,
  User,
  X,
} from "lucide-react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../libs/firebaseConfig";
import {
  generateLinkToken,
  initializeMachineLink,
} from "../utils/machine-link";
import { addAccessLog } from "../utils/logging";

// Add this keyframe animation
const fadeInKeyframes = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton placeholder for initial loading
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="h-full bg-white/10 backdrop-blur-sm rounded-lg p-4 flex flex-col animate-pulse">
      <div className="mb-4 space-y-2">
        <div className="h-6 bg-white/20 rounded w-1/3" />
        <div className="h-4 bg-white/15 rounded w-1/2" />
      </div>
      <div className="grid grid-cols-2 gap-4 flex-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-white/20 rounded w-2/3" />
            <div className="h-4 bg-white/15 rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card components
// ─────────────────────────────────────────────────────────────────────────────
function BasicInfoCard({ machineDetails = {}, machineId }) {
  return (
    <div className="h-full bg-white/10 backdrop-blur-sm rounded-lg p-4 flex flex-col border border-white/10">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-cyan-300" /> Basic Information
        </h3>
        <p className="text-sm text-white/70">
          Machine details and configuration
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 flex-1">
        {[
          { label: "Machine Name", field: "name", icon: Settings },
          { label: "Machine ID", field: "id", icon: QrIcon },
          { label: "Model", field: "model", icon: Building },
          { label: "Location", field: "location", icon: MapPin },
        ].map(({ label, field, icon: Icon }) => (
          <div key={field} className="space-y-1">
            <label className="text-sm text-white/70 flex items-center gap-2">
              <Icon className="w-4 h-4 text-cyan-300" /> {label}
            </label>
            {field === "id" ? (
              <p className="font-medium text-white">{machineId}</p>
            ) : machineDetails[field] ? (
              <p className="font-medium text-white">{machineDetails[field]}</p>
            ) : (
              <p className="italic text-white/50">
                No {label.toLowerCase()} added
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OwnerDetailsCard({ linkStatus, formatDate }) {
  const fields = [
    {
      label: "Owner Name",
      value: linkStatus.linkedUser?.name,
      icon: User,
    },
    {
      label: "Email Address",
      value: linkStatus.linkedUser?.email,
      icon: Link,
    },
    {
      label: "Linked Since",
      value: linkStatus.isLinked ? formatDate(linkStatus.linkTime) : null,
      icon: RefreshCw,
    },
    {
      label: "Status",
      value: linkStatus.isLinked ? "Connected" : "Not Connected",
      icon: linkStatus.isLinked ? Wifi : WifiOff,
    },
  ];

  return (
    <div className="h-full bg-white/10 backdrop-blur-sm rounded-lg p-4 flex flex-col border border-white/10">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-300" /> Owner Details
        </h3>
        <p className="text-sm text-white/70">User linking information</p>
      </div>
      <div className="grid grid-cols-2 gap-4 flex-1">
        {fields.map(({ label, value, icon: Icon }) => (
          <div key={label} className="space-y-1">
            <label className="text-sm text-white/70 flex items-center gap-2">
              <Icon className="w-4 h-4 text-cyan-300" /> {label}
            </label>
            {value ? (
              <p className="font-medium text-white">{value}</p>
            ) : (
              <p className="italic text-white/50">
                No {label.toLowerCase()} added
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function QRCodeCard({
  linkStatus,
  qrCodeData,
  generatingQR,
  generateQRCode,
  handleDownloadQR,
  formatDate,
}) {
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!document.getElementById("qr-animations")) {
      const style = document.createElement("style");
      style.id = "qr-animations";
      style.textContent = fadeInKeyframes;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  return (
    <div className="h-full bg-white/10 backdrop-blur-sm rounded-lg p-4 flex flex-col border border-white/10">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <QrIcon className="w-5 h-5 text-cyan-300" /> QR Code
        </h3>
        <p className="text-sm text-white/70">Machine linking information</p>
      </div>

      <div className="flex flex-1">
        <div className="w-1/2 flex items-center justify-center">
          {linkStatus.isLinked ? (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white/20 rounded-lg flex items-center justify-center">
                <QrIcon className="w-12 h-12 text-white/70" />
              </div>
              <p className="text-sm text-white/70 mt-2">
                Machine already linked
              </p>
            </div>
          ) : qrCodeData ? (
            <div
              className="p-3 bg-white rounded-lg cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              onClick={() => setModalOpen(true)}
              title="Click to enlarge"
            >
              <QRCode
                id="machine-qr-code"
                value={JSON.stringify(qrCodeData)}
                size={180}
                level="H"
                viewBox="0 0 256 256"
              />
            </div>
          ) : (
            <button
              onClick={generateQRCode}
              disabled={generatingQR}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-md flex items-center gap-2 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-blue-900/30"
            >
              <QrIcon className="w-4 h-4" />
              {generatingQR ? "Generating…" : "Generate QR Code"}
            </button>
          )}
        </div>

        <div className="w-1/2 flex flex-col justify-start pl-6">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-sm text-white/70 flex items-center gap-2">
                <QrIcon className="w-4 h-4 text-cyan-300" /> Machine ID
              </label>
              <p className="font-medium text-sm text-white break-all">
                {qrCodeData?.id ?? (
                  <span className="italic text-white/50">No ID</span>
                )}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-white/70 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-cyan-300" /> Generated
              </label>
              <p className="font-medium text-sm text-white">
                {qrCodeData ? (
                  formatDate(qrCodeData.timestamp)
                ) : (
                  <span className="italic text-white/50">—</span>
                )}
              </p>
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-sm text-white/70 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-300" /> Expires
              </label>
              <p className="font-medium text-sm text-white">
                {qrCodeData ? (
                  formatDate(qrCodeData.expiresAt)
                ) : (
                  <span className="italic text-white/50">—</span>
                )}
              </p>
            </div>
          </div>

          {!linkStatus.isLinked && qrCodeData && (
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleDownloadQR}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Download</span>
              </button>
              <button
                onClick={generateQRCode}
                disabled={generatingQR}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md disabled:opacity-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Full-screen modal for enlarged QR */}
      {isModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
            style={{ isolation: "isolate" }}
          >
            <div
              className="relative bg-white p-6 rounded-lg shadow-2xl animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-2">
                <QRCode
                  value={JSON.stringify(qrCodeData)}
                  size={300}
                  level="H"
                  viewBox="0 0 256 256"
                />
              </div>
              <div className="mt-4 text-center text-gray-700 text-sm">
                Click anywhere outside to close
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function ConnectionStatusCard({ linkStatus, formatDate }) {
  return (
    <div className="h-full bg-white/10 backdrop-blur-sm rounded-lg p-4 flex flex-col border border-white/10">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Link className="w-5 h-5 text-cyan-300" /> Connection Status
        </h3>
        <p className="text-sm text-white/70">Machine connection information</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {linkStatus.isLinked ? (
          <>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400/30 to-green-600/20 backdrop-blur-sm flex items-center justify-center mb-4 border border-green-400/30">
              <Wifi className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-green-400 font-bold text-lg">Connected</p>
            <p className="text-sm text-white/70 mt-1">
              Since {formatDate(linkStatus.linkTime)}
            </p>
            {linkStatus.linkedUser?.name && (
              <div className="mt-4 text-center">
                <p className="text-sm text-white/70">Connected User</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <User className="w-4 h-4 text-cyan-300" />
                  <p className="font-medium text-white">
                    {linkStatus.linkedUser.name}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20">
              <WifiOff className="w-8 h-8 text-white/70" />
            </div>
            <p className="text-white/80 font-medium text-lg">Not connected</p>
            <p className="text-sm text-white/60 mt-1">
              Generate a QR code to connect this machine
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function AccountContent() {
  const [loading, setLoading] = useState(true);
  const [machineDetails, setMachineDetails] = useState(null);
  const [machineId, setMachineId] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState({});
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [generatingQR, setGeneratingQR] = useState(false);
  const [linkStatus, setLinkStatus] = useState({ isLinked: false });
  const [currentCard, setCurrentCard] = useState(0);

  const cards = [
    { id: "basic", label: "Basic Info", icon: Info, component: BasicInfoCard },
    {
      id: "owner",
      label: "Owner Details",
      icon: User,
      component: OwnerDetailsCard,
    },
    { id: "qr", label: "QR Code", icon: QrIcon, component: QRCodeCard },
    {
      id: "status",
      label: "Connection Status",
      icon: Link,
      component: ConnectionStatusCard,
    },
  ];

  const nextCard = () => setCurrentCard((i) => (i + 1) % cards.length);
  const prevCard = () =>
    setCurrentCard((i) => (i - 1 + cards.length) % cards.length);
  const goToCard = (i) => setCurrentCard(i);

  // Generate QR
  const generateQRCodeFn = useCallback(async () => {
    if (machineDetails && machineId) {
      setGeneratingQR(true);
      try {
        const { token, expiresAt } = await generateLinkToken(machineId);
        setQrCodeData({
          id: machineId,
          name: machineDetails.name,
          serialNumber: machineDetails.serialNumber,
          timestamp: new Date().toISOString(),
          linkToken: token,
          expiresAt,
        });
      } finally {
        setGeneratingQR(false);
      }
    }
  }, [machineDetails, machineId]);

  // Fetch session & details
  useEffect(() => {
    let unsub;
    (async () => {
      try {
        const s = await fetch("/api/auth/session").then((r) => r.json());
        if (!s.machineId) throw new Error("No session");
        setMachineId(s.machineId);
        const m = await fetch(`/api/machines/${s.machineId}`).then((r) =>
          r.json()
        );
        setMachineDetails(m.machine);
        setEditedDetails(m.machine);
        unsub = initializeMachineLink(s.machineId, setLinkStatus);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => unsub?.();
  }, []);

  // Fallback link status
  useEffect(() => {
    (async () => {
      if (!machineId || linkStatus.isLinked) return;
      try {
        const snap = await getDoc(doc(db, "machines", machineId));
        if (!snap.exists()) return;
        const users = snap.data().linkedUsers || {};
        const [uid, info] = Object.entries(users)[0] || [];
        if (!uid) return;
        let ud = { fullname: "Unknown", email: "" };
        try {
          const us = await getDoc(doc(db, "users", uid));
          if (us.exists()) ud = us.data();
        } catch {}
        setLinkStatus({
          isLinked: true,
          linkedUser: {
            uid,
            name: ud.fullname || ud.displayName,
            email: ud.email,
          },
          linkTime: info.linkedAt,
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [machineId, linkStatus.isLinked]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setSaveError("");
    setSaveSuccess("");
  };
  const handleInputChange = (field, value) =>
    setEditedDetails((d) => ({ ...d, [field]: value }));
  const handleSave = async () => {
    try {
      setSaveError("");
      setSaveSuccess("");
      await updateDoc(doc(db, "machines", machineId), {
        ...editedDetails,
        updatedAt: new Date().toISOString(),
      });
      await addAccessLog({
        action: "machine_update",
        machineId,
        status: "success",
        details: "Updated",
      });
      setMachineDetails(editedDetails);
      setIsEditing(false);
      setSaveSuccess("Saved");
    } catch (e) {
      console.error(e);
      setSaveError(e.message || "Error");
    }
  };
  const handleDownloadQR = () => {
    const svg = document.getElementById("machine-qr-code");
    if (!svg) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const data = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(
      new Blob([data], { type: "image/svg+xml" })
    );
    canvas.width = canvas.height = 1000;
    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 1000, 1000);
      ctx.drawImage(img, 0, 0, 1000, 1000);
      const png = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = png;
      a.download = `machine-qr-${machineId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    };
    img.crossOrigin = "anonymous";
    img.src = url;
  };
  const formatDate = (ds) => {
    if (!ds) return "N/A";
    if (ds.toDate) return ds.toDate().toLocaleString();
    if (ds.seconds) return new Date(ds.seconds * 1000).toLocaleString();
    return new Date(ds).toLocaleString();
  };

  // skeleton instead of spinner
  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <div className="h-full flex flex-col max-h-[380px]">
      {/* Carousel content */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300"
          style={{ transform: `translateX(-${currentCard * 100}%)` }}
        >
          {cards.map(({ id, component: C }) => (
            <div
              key={id}
              className="w-full flex-shrink-0 p-4 h-full box-border overflow-auto"
            >
              <C
                machineDetails={machineDetails}
                machineId={machineId}
                isEditing={isEditing}
                editedDetails={editedDetails}
                saveError={saveError}
                saveSuccess={saveSuccess}
                generatingQR={generatingQR}
                qrCodeData={qrCodeData}
                linkStatus={linkStatus}
                generateQRCode={generateQRCodeFn}
                handleEdit={handleEdit}
                handleCancel={handleCancel}
                handleInputChange={handleInputChange}
                handleSave={handleSave}
                handleDownloadQR={handleDownloadQR}
                formatDate={formatDate}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={prevCard}
            className="p-1 rounded hover:bg-white/10 border border-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={nextCard}
            className="p-1 rounded hover:bg-white/10 border border-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="text-sm text-white/70">
          {currentCard + 1} / {cards.length}
        </div>
        <div className="flex gap-1">
          {cards.map((card, i) => (
            <button
              key={i}
              onClick={() => goToCard(i)}
              className={`w-2 h-2 rounded-full ${
                i === currentCard ? "bg-cyan-300" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
