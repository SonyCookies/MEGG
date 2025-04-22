"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Key,
  Check,
  Copy,
  Shield,
  ArrowRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../libs/firebaseConfig";
import { generateMachineQR } from "../utils/machine-utils";
import MachineLoading from "./components/machine-loading";

// ==========================================
// Constants
// ==========================================
const NUMBER_PAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["C", "0", "⌫"],
];

// ==========================================
// Helper Functions
// ==========================================
const isPinValid = (pin: string): boolean => {
  if (!/^\d+$/.test(pin)) return false;

  return !(
    /^(.)\1{3}$/.test(pin) ||
    /^0123|1234|2345|3456|4567|5678|6789$/.test(pin) ||
    /^9876|8765|7654|6543|5432|4321|3210$/.test(pin)
  );
};

// ==========================================
// Types
// ==========================================
interface SetupState {
  loading: boolean;
  error: string;
  success: string;
  machineId: string;
  step: "generate" | "pin";
  pin: string;
  confirmPin: string;
  pinError: string;
  pinStep: "create" | "confirm";
  setupComplete: boolean;
  copied: boolean;
  showSuccessModal: boolean;
}

// ==========================================
// Component
// ==========================================
export default function SetupPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, setState] = useState<SetupState>({
    loading: false,
    error: "",
    success: "",
    machineId: "",
    step: "generate",
    pin: "",
    confirmPin: "",
    pinError: "",
    pinStep: "create",
    setupComplete: false,
    copied: false,
    showSuccessModal: false,
  });
  const setupSuccessfulRef = useRef(false);
  const [showMachineLoading, setShowMachineLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState(0);

  // ==========================================
  // State Management
  // ==========================================
  const updateState = (updates: Partial<SetupState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // ==========================================
  // Effects
  // ==========================================
  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100);

    // Handle beforeunload event
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.step === "pin" && !state.success) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearTimeout(timer);
    };
  }, [state.step, state.success]);

  // ==========================================
  // Event Handlers
  // ==========================================
  const handleGenerateMachine = async () => {
    try {
      updateState({ loading: true, error: "" });
      setShowMachineLoading(true);
      setGenerationProgress(0);
      setGenerationStage(0);

      // Start the actual machine generation with progress reporting
      generateMachineQR((progress, stage) => {
        setGenerationProgress(progress);
        setGenerationStage(stage);
      })
        .then(async (result) => {
          try {
            // Use the machine ID from the generation result
            const newMachineId = result.machineId;

            await updateDoc(doc(db, "machines", newMachineId), {
              createdAt: new Date().toISOString(),
              pin: null,
            });

            updateState({
              machineId: newMachineId,
              step: "pin",
              loading: false,
            });

            setShowMachineLoading(false);
          } catch (err) {
            console.error("Error completing machine generation:", err);
            updateState({
              error: "Failed to register machine ID. Please try again.",
              loading: false,
            });
            setShowMachineLoading(false);
          }
        })
        .catch((err) => {
          console.error("Error generating machine:", err);
          updateState({
            error: "Failed to generate machine ID. Please try again.",
            loading: false,
          });
          setShowMachineLoading(false);
        });
    } catch (err) {
      console.error("Error starting machine generation:", err);
      updateState({
        error: "Failed to start machine ID generation. Please try again.",
      });
      setShowMachineLoading(false);
    }
  };

  const handleCopy = async (machineId: string) => {
    try {
      await navigator.clipboard.writeText(machineId);
      updateState({ copied: true });

      setTimeout(() => updateState({ copied: false }), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleSetupComplete = async () => {
    const { pin, confirmPin } = state;

    if (pin.length !== 4) {
      updateState({ pinError: "Initial PIN must be exactly 4 digits" });
      return;
    }

    if (pin !== confirmPin) {
      updateState({ pinError: "PINs do not match", confirmPin: "" });
      return;
    }

    if (!isPinValid(pin)) {
      updateState({ pinError: "Please choose a less predictable PIN" });
      return;
    }

    try {
      updateState({ loading: true, pinError: "" });

      const encoder = new TextEncoder();
      const pinData = encoder.encode(pin);
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const combinedData = new Uint8Array([...pinData, ...salt]);
      const hashBuffer = await crypto.subtle.digest("SHA-256", combinedData);

      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashBase64 = btoa(String.fromCharCode(...hashArray));

      const saltBase64 = btoa(String.fromCharCode(...salt));

      await updateDoc(doc(db, "machines", state.machineId), {
        pin: hashBase64,
        salt: saltBase64,
        pinSetupAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        setupComplete: true,
      });

      setupSuccessfulRef.current = true;
      localStorage.setItem("machineId", state.machineId);

      // Automatically copy the machine ID
      try {
        await navigator.clipboard.writeText(state.machineId);
        updateState({ copied: true });
      } catch (err) {
        console.error("Failed to auto-copy machine ID: ", err);
      }

      updateState({
        setupComplete: true,
        success: "Setup completed successfully!",
        showSuccessModal: true,
      });

      setTimeout(() => router.push("/"), 3000);
    } catch (err) {
      console.error("Error completing setup:", err);
      updateState({
        pinError: "Failed to complete setup. Please try again.",
        setupComplete: false,
      });
      setupSuccessfulRef.current = false;
    } finally {
      updateState({ loading: false });
    }
  };

  const handlePinInput = (digit: string) => {
    const currentPin =
      state.pinStep === "create" ? state.pin : state.confirmPin;
    const setPin =
      state.pinStep === "create"
        ? (pin: string) => updateState({ pin })
        : (confirmPin: string) => updateState({ confirmPin });

    if (digit === "C") {
      setPin("");
    } else if (digit === "⌫") {
      setPin(currentPin.slice(0, -1));
    } else if (currentPin.length < 4) {
      setPin(currentPin + digit);
    }
  };

  // ==========================================
  // UI Components
  // ==========================================
  const renderPinDisplay = () => (
    <div className="flex gap-3 justify-center">
      {[...Array(4)].map((_, i) => {
        const isFilled =
          i <
          (state.pinStep === "confirm"
            ? state.confirmPin.length
            : state.pin.length);
        return (
          <div
            key={i}
            className={`relative w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold transition-all duration-300 overflow-hidden
              ${
                isFilled
                  ? "border-none bg-gradient-to-br from-[#0e5f97] to-[#0c4d7a] text-white shadow-[0_0_10px_rgba(14,95,151,0.4)]"
                  : "border-2 border-[#0e5f97]/20 bg-white/50 text-transparent"
              }`}
          >
            {/* Inner glow effect */}
            {isFilled && (
              <div className="absolute inset-0 bg-[#0e5f97] opacity-20 animate-pulse"></div>
            )}

            {/* Highlight effect */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-lg"></div>

            {/* Dot indicator */}
            <div
              className={`relative z-10 w-3 h-3 rounded-full ${
                isFilled ? "bg-white" : "bg-[#0e5f97]/20"
              }`}
            ></div>

            {/* Bottom shadow */}
            <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-black/5 rounded-full"></div>
          </div>
        );
      })}
    </div>
  );

  const SuccessModal = () => (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with blur effect */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={() => updateState({ showSuccessModal: false })}
      ></div>

      {/* Modal content - centered with egg design */}
      <div className="flex items-center justify-center h-full p-4">
        <div className="relative bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full p-6 border border-white/50 animate-fade-in-up">
          {/* Top egg shape decoration */}
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
            <div className="relative">
              {/* Animated rings */}
              <div
                className="absolute inset-[-12px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-[#0e5f97]/20 animate-ping-slow"
                style={{ animationDuration: "3s" }}
              ></div>
              <div
                className="absolute inset-[-6px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-[#0e5f97]/30 animate-ping-slow"
                style={{ animationDuration: "2s" }}
              ></div>

              {/* Egg shape with success fill */}
              <div className="relative w-24 h-28 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] bg-white/90 shadow-lg overflow-hidden">
                {/* Success fill animation */}
                <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-green-500 to-green-400 transition-all duration-300 ease-out">
                  {/* Bubbles effect */}
                  <div className="absolute inset-0 overflow-hidden opacity-70">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute bg-white/30 rounded-full animate-float-bubble"
                        style={{
                          width: `${Math.random() * 8 + 4}px`,
                          height: `${Math.random() * 8 + 4}px`,
                          left: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 2}s`,
                          animationDuration: `${Math.random() * 2 + 1.5}s`,
                        }}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Check icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]" />
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shine-slow"></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center text-center mt-12">
            <h3 className="text-xl font-bold text-[#0e5f97] mb-2">Setup Completed!</h3>
            <p className="text-gray-600 mb-4">Your machine has been successfully registered and secured.</p>

            <div className="w-full bg-[#0e5f97]/5 border border-[#0e5f97]/10 rounded-lg p-3 mb-4">
              <p className="text-sm text-[#0e5f97]/70 mb-1">Machine ID (copied to clipboard)</p>
              <p className="font-mono text-[#0e5f97] text-sm break-all">{state.machineId}</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-green-600 text-sm mb-3">
              <Check className="h-4 w-4" />
              <span>Redirecting to home page...</span>
            </div>

            <div className="w-full bg-[#0e5f97]/10 rounded-lg p-1.5">
              <div className="h-1 bg-gradient-to-r from-[#0e5f97] to-green-500 rounded-full animate-progress"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PinErrorModal = () => (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with blur effect */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={() => updateState({ pinError: "" })}
      ></div>

      {/* Modal content - centered with egg design */}
      <div className="flex items-center justify-center h-full p-4">
        <div className="relative bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full p-6 border border-white/50 animate-fade-in-up">
          {/* Top egg shape decoration */}
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
            <div className="relative">
              {/* Animated rings */}
              <div
                className="absolute inset-[-12px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-[#0e5f97]/20 animate-ping-slow"
                style={{ animationDuration: "3s" }}
              ></div>
              <div
                className="absolute inset-[-6px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-[#0e5f97]/30 animate-ping-slow"
                style={{ animationDuration: "2s" }}
              ></div>

              {/* Egg shape with error fill */}
              <div className="relative w-24 h-28 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] bg-white/90 shadow-lg overflow-hidden">
                {/* Error fill animation */}
                <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-red-500 to-red-400 transition-all duration-300 ease-out">
                  {/* Bubbles effect */}
                  <div className="absolute inset-0 overflow-hidden opacity-70">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute bg-white/30 rounded-full animate-float-bubble"
                        style={{
                          width: `${Math.random() * 8 + 4}px`,
                          height: `${Math.random() * 8 + 4}px`,
                          left: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 2}s`,
                          animationDuration: `${Math.random() * 2 + 1.5}s`,
                        }}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Alert icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertCircle className="h-12 w-12 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]" />
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shine-slow"></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center text-center mt-12">
            <h3 className="text-xl font-bold text-[#0e5f97] mb-2">PIN Error</h3>
            <p className="text-red-600 mb-5">{state.pinError}</p>

            <button
              onClick={() => updateState({ pinError: "" })}
              className="px-6 py-2 bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] hover:from-[#0c4d7a] hover:to-[#0a3d62] text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <span>OK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const GenerateStep = () => (
    <div className="p-4 h-[440px] max-h-[440px] flex flex-col justify-between bg-white/50 backdrop-blur-md rounded-xl border border-[#0e5f97]/10 shadow-lg relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-bl from-[#0e5f97]/10 to-transparent rounded-full blur-xl"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-[#0e5f97]/15 to-transparent rounded-full blur-xl"></div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      ></div>

      {/* Header with Title and Bigger Back Button */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-8 bg-gradient-to-b from-[#0e5f97] to-[#0c4d7a] rounded-full mr-2"></div>
          <h1 className="text-2xl font-bold text-[#0e5f97]">Machine Setup</h1>
        </div>
        <Link
          href="/"
          className="px-6 py-3 text-[#0e5f97] text-lg font-semibold bg-white/70 backdrop-blur-sm rounded-xl border border-[#0e5f97]/10 shadow hover:bg-white/90 transition-all hover:shadow-md group"
        >
          <span className="flex items-center">
            <span className="transform transition-transform group-hover:-translate-x-1">
              ←
            </span>
            <span className="ml-1">Back</span>
          </span>
        </Link>
      </div>

      {/* Optional Error Message */}
      {state.error ? (
        <div className="bg-red-50/80 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm mb-4 animate-fade-in relative z-10">
          <AlertCircle className="w-5 h-5" />
          <p>{state.error}</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          {/* Egg-shaped icon container */}
          <div className="relative mb-6">
            {/* Animated rings */}
            <div
              className="absolute inset-[-8px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-[#0e5f97]/20 animate-ping-slow opacity-70"
              style={{ animationDuration: "3s" }}
            ></div>
            <div
              className="absolute inset-[-4px] rounded-[60%_40%_40%_60%/60%_60%_40%_40%] border border-[#0e5f97]/30 animate-ping-slow opacity-50"
              style={{ animationDuration: "4s" }}
            ></div>

            {/* Egg shape with enhanced 3D effect */}
            <div className="relative bg-gradient-to-br from-white to-[#f0f7ff] p-4 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] shadow-md border border-white/50 group">
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] bg-white/50 filter blur-md opacity-70"></div>

              {/* Icon */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0e5f97]/10 to-[#0e5f97]/5 rounded-full animate-pulse-slow"></div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-[#0e5f97]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                  <line x1="6" y1="6" x2="6.01" y2="6"></line>
                  <line x1="6" y1="18" x2="6.01" y2="18"></line>
                </svg>
              </div>

              {/* Subtle shadow under icon */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-black/5 blur-md rounded-full"></div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-[#0e5f97] text-center mb-2">
            Generate Machine ID
          </h2>
          <p className="text-base text-center text-[#0e5f97]/70 leading-snug max-w-md">
            This will create a unique identifier and credentials for your MEGG
            device.
          </p>
        </div>
      )}

      {/* Main Action Button */}
      <div className="flex flex-col items-center gap-3 relative z-10">
        <button
          onClick={handleGenerateMachine}
          disabled={state.loading}
          className="relative w-full h-20 text-xl font-bold text-white rounded-2xl bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] shadow-xl hover:shadow-2xl hover:from-[#0c4d7a] hover:to-[#0a3d62] transition-all duration-300 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99]"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -translate-x-full group-hover:translate-x-full"></div>

          {/* Button highlight */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl"></div>

          {/* Button content with icon */}
          <div className="relative z-10 flex items-center justify-center gap-3 animate-pulse-slow">
            <span className="tracking-wide">Begin Machine Initialization</span>
          </div>

          {/* Bottom shadow */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-black/10 rounded-full"></div>
        </button>
      </div>
    </div>
  );

  const PinStep = () => (
    <div className="p-4 h-[440px] max-h-[440px] flex flex-col justify-between bg-white/50 backdrop-blur-md rounded-xl border border-[#0e5f97]/10 shadow-lg relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-bl from-[#0e5f97]/10 to-transparent rounded-full blur-xl"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-[#0e5f97]/15 to-transparent rounded-full blur-xl"></div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle, #0e5f97 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      ></div>

      {/* Main content with two-column layout */}
      <div className="grid grid-cols-12 gap-6 flex-grow relative z-10">
        {/* Left column - Machine ID and Progress */}
        <div className="col-span-5 flex flex-col gap-4">
          {/* Header with Title and Back Button */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-8 bg-gradient-to-b from-[#0e5f97] to-[#0c4d7a] rounded-full mr-2"></div>
              <h1 className="text-xl font-bold text-[#0e5f97]">
                Machine Setup
              </h1>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-[#0e5f97] font-semibold bg-white/70 backdrop-blur-sm rounded-xl border border-[#0e5f97]/10 shadow hover:bg-white/90 transition-all hover:shadow-md group flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4 transform transition-transform group-hover:-translate-x-1" />
              <span>Back</span>
            </Link>
          </div>
          {/* Machine ID Card */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 p-4 shadow-md relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -left-4 -top-4 w-24 h-24 bg-[#0e5f97]/10 rounded-full blur-xl"></div>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-[#0e5f97]" />
              <h2 className="text-lg font-semibold text-[#0e5f97]">
                Machine ID
              </h2>
            </div>

            {/* ID Display */}
            <div className="relative bg-gradient-to-r from-[#0e5f97]/5 to-white/80 rounded-lg border border-[#0e5f97]/10 p-3 shadow-sm mb-2">
              {/* Copy button with animation */}
              <button
                onClick={() => handleCopy(state.machineId)}
                className="absolute top-2 right-2 p-2 rounded-full bg-white/70 hover:bg-white shadow-sm hover:shadow-md border border-[#0e5f97]/10 transition-all group"
                aria-label="Copy Machine ID"
              >
                {state.copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-[#0e5f97] group-hover:scale-110 transition-transform" />
                )}
              </button>

              {/* ID text with animation */}
              <div
                className={`font-mono text-sm text-[#0e5f97] break-all transition-all duration-300 ${
                  state.copied ? "bg-green-50/50" : ""
                }`}
              >
                {state.machineId}
              </div>
            </div>

            {/* Copy status */}
            {state.copied && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-green-600 animate-fade-in">
                <Check className="h-3 w-3" />
                <span>Copied to clipboard</span>
              </div>
            )}
          </div>

          {/* PIN Progress Card */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 p-4 shadow-md relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#0e5f97]/10 rounded-full blur-xl"></div>

            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-[#0e5f97]" />
              <h2 className="text-lg font-semibold text-[#0e5f97]">
                PIN Setup
              </h2>
            </div>

            {/* Progress steps */}
            <div className="flex items-center gap-3">
              <div
                className={`relative w-full h-2 bg-[#0e5f97]/10 rounded-full overflow-hidden`}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] transition-all duration-500"
                  style={{ width: state.pinStep === "create" ? "50%" : "100%" }}
                ></div>
              </div>
              <span className="text-sm text-[#0e5f97] font-medium">
                {state.pinStep === "create" ? "Step 1/2" : "Step 2/2"}
              </span>
            </div>

            {/* Action buttons */}
            {state.pinStep === "create" && state.pin.length === 4 && (
              <button
                onClick={() =>
                  updateState({
                    pinStep: "confirm",
                    pinError: "",
                    confirmPin: "",
                  })
                }
                className="w-full h-12 mt-4 bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] hover:from-[#0c4d7a] hover:to-[#0a3d62] text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
                <div className="flex items-center justify-center gap-2 relative z-10">
                  <span>Next: Confirm PIN</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            )}

            {state.pinStep === "confirm" && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button
                  onClick={() =>
                    updateState({
                      pinStep: "create",
                      pinError: "",
                      confirmPin: "",
                    })
                  }
                  className="h-12 bg-white hover:bg-white/90 text-[#0e5f97] rounded-lg transition-all duration-300 border border-[#0e5f97]/20 shadow hover:shadow-md flex items-center justify-center gap-1 group"
                >
                  <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handleSetupComplete}
                  disabled={state.loading || state.confirmPin.length !== 4}
                  className="col-span-2 h-12 bg-gradient-to-r from-[#0e5f97] to-[#0c4d7a] hover:from-[#0c4d7a] hover:to-[#0a3d62] text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>

                  {state.loading ? (
                    <div className="flex items-center justify-center gap-2 relative z-10">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Setting up...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 relative z-10">
                      <span>Complete Setup</span>
                      <Check className="h-4 w-4 group-hover:scale-125 transition-transform" />
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column - PIN Input */}
        <div className="col-span-7 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 p-5 shadow-md relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#0e5f97]/10 rounded-full blur-xl"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-[#0e5f97]/10 rounded-full blur-xl"></div>

          {/* PIN display */}
          <div className="mb-2">
            {renderPinDisplay()}
            <p className="text-center text-xs text-gray-500 italic mt-1">
              {state.pinStep === "create"
                ? "Enter a 4-digit PIN to secure your machine"
                : "Re-enter your PIN to confirm"}
            </p>
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 relative">
            {/* Enhanced background effects */}
            <div className="absolute -inset-3 bg-gradient-to-br from-[#0e5f97]/5 to-transparent rounded-xl blur-lg opacity-70"></div>

            {/* Numpad buttons */}
            {NUMBER_PAD.map((row, rowIndex) =>
              row.map((digit, colIndex) => {
                const isSpecial = digit === "C" || digit === "⌫";
                const isPinComplete =
                  (state.pinStep === "create"
                    ? state.pin.length === 4
                    : state.confirmPin.length === 4) && !isSpecial;

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handlePinInput(digit)}
                    disabled={state.loading || isPinComplete}
                    className={`
                      h-16 text-2xl font-medium rounded-xl transition-all duration-300 
                      relative group overflow-hidden
                      ${
                        isSpecial
                          ? "bg-gradient-to-br from-white to-gray-50 text-[#0e5f97] border border-[#0e5f97]/20"
                          : "bg-gradient-to-br from-white to-gray-50 text-gray-700 border border-white/50"
                      }
                      shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]
                      active:shadow-inner
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    `}
                  >
                    {/* Inner shadow effect */}
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/80 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></span>

                    {/* Button press effect */}
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/5 to-transparent opacity-0 group-active:opacity-100 transition-opacity"></span>

                    {/* Highlight effect */}
                    <span className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/50 to-transparent rounded-t-xl"></span>

                    {/* Button content */}
                    <span className="relative z-10 flex items-center justify-center h-full">
                      {isSpecial && digit === "C" && (
                        <span className="text-sm font-semibold">CLEAR</span>
                      )}
                      {isSpecial && digit === "⌫" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                          <line x1="18" y1="9" x2="12" y2="15"></line>
                          <line x1="12" y1="9" x2="18" y2="15"></line>
                        </svg>
                      )}
                      {!isSpecial && digit}
                    </span>

                    {/* Bottom shadow */}
                    <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-black/5 rounded-full"></span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // Main Render
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0e5f97] pt-6 px-4 pb-4 flex flex-col items-center relative overflow-hidden">
      {/* Machine Loading Animation */}
      <div className="mt-16 w-full absolute">
        <MachineLoading
          isLoading={showMachineLoading}
          progress={generationProgress}
          currentStage={generationStage}
        />
      </div>

      {/* Success Modal */}
      {state.showSuccessModal && <SuccessModal />}

      {/* PIN Error Modal */}
      {state.pinError && <PinErrorModal />}

      {/* Dynamic background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0wIDMwaDMwdjMwSDB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwSDB2MzBoMzB6IiBzdHJva2U9InRnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwaDMwdjMwSDMweiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iLjUiLz48L2c+PC9zdmc+')] opacity-70"></div>

      {/* Main content */}
      <div
        className={`max-w-3xl w-full transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        } relative`}
      >
        {/* Large background logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="relative w-[80%] h-[80%] opacity-10">
            <Image
              src="/Logos/logoblue.png"
              alt="MEGG Logo Background"
              fill
              className="object-contain select-none"
            />
          </div>
        </div>

        {/* Card with glass morphism effect */}
        <div className="relative backdrop-blur-sm bg-white/70 rounded-2xl shadow-2xl overflow-hidden border border-white/50 h-[440px]">
          {/* Holographic overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-300/10 to-transparent opacity-50 mix-blend-overlay"></div>

          {/* Animated edge glow */}
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl animate-border-glow"></div>
          </div>

          {state.step === "generate" ? <GenerateStep /> : <PinStep />}

          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-t-2 border-l-2 border-[#0e5f97]/30 rounded-tl-2xl"></div>
            <div className="absolute top-2 left-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16">
            <div className="absolute top-0 right-0 w-full h-full border-t-2 border-r-2 border-[#0e5f97]/30 rounded-tr-2xl"></div>
            <div className="absolute top-2 right-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-16 h-16">
            <div className="absolute bottom-0 left-0 w-full h-full border-b-2 border-l-2 border-[#0e5f97]/30 rounded-bl-2xl"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 right-0 w-16 h-16">
            <div className="absolute bottom-0 right-0 w-full h-full border-b-2 border-r-2 border-[#0e5f97]/30 rounded-br-2xl"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 bg-[#0e5f97]/20 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Add keyframes for animations */}
      <style jsx global>{`
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.4;
          }
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          20%,
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes border-glow {
          0%,
          100% {
            box-shadow: 0 0 5px rgba(14, 95, 151, 0.3),
              0 0 10px rgba(14, 95, 151, 0.2), 0 0 15px rgba(14, 95, 151, 0.1);
          }
          50% {
            box-shadow: 0 0 10px rgba(14, 95, 151, 0.5),
              0 0 20px rgba(14, 95, 151, 0.3), 0 0 30px rgba(14, 95, 151, 0.2);
          }
        }

        @keyframes grow {
          0% {
            transform: scaleX(0);
          }
          100% {
            transform: scaleX(1);
          }
        }

        @keyframes animate-progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-progress {
          animation: animate-progress 3s linear forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }

        .animate-grow {
          animation: grow 1.5s ease-in-out infinite alternate;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes pulse-subtle {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes animate-gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
