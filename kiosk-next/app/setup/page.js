"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Settings, ArrowLeft, AlertCircle, Key } from "lucide-react";
import { generateMachineQR } from "../utils/machine-utils";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Link from "next/link";

import { SetupSteps } from "./components/setupSteps";
import { MachineIdFormat } from "./components/machineIdFormat";
import { WhatHappensNext } from "./components/whatHappensNext";
import { PinInput } from "./components/pinInput";
import { MachineDetails } from "./components/machineDetails";

const isPinValid = (pin) => {
  if (!/^\d+$/.test(pin)) return false;

  return !(
    /^(.)\1{3}$/.test(pin) ||
    /^0123|1234|2345|3456|4567|5678|6789$/.test(pin) ||
    /^9876|8765|7654|6543|5432|4321|3210$/.test(pin)
  );
};

export default function SetupPage() {
  const router = useRouter();
  const [state, setState] = useState({
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
  });
  const setupSuccessfulRef = useRef(false);

  const updateState = (updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (state.step === "pin" && !state.success) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.step, state.success]);

  const handleGenerateMachine = async () => {
    try {
      updateState({ loading: true, error: "" });
      const { machineId: newMachineId } = await generateMachineQR();

      await updateDoc(doc(db, "machines", newMachineId), {
        createdAt: new Date().toISOString(),
        pin: null,
      });

      updateState({
        machineId: newMachineId,
        step: "pin",
      });
    } catch (err) {
      console.error("Error generating machine:", err);
      updateState({
        error: "Failed to generate machine ID. Please try again.",
      });
    } finally {
      updateState({ loading: false });
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

      updateState({
        setupComplete: true,
        success: "Setup completed successfully!",
      });

      setTimeout(() => router.push("/"), 1500);
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

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-[#0e5f97] hover:text-[#0e4772]"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
          </Link>
        </div>

        {state.step === "generate" ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold">Setup New Machine</h1>
                <p className="text-sm text-gray-500">
                  Follow the guide below to set up your MEGG machine
                </p>
              </div>

              {state.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{state.error}</p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-center gap-3 text-[#0e5f97]">
                    <Settings className="h-8 w-8" />
                    <span className="text-lg font-medium">
                      Ready to Begin Setup
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleGenerateMachine}
                  disabled={state.loading}
                  className="w-full h-12 text-lg bg-[#0e5f97] hover:bg-[#0e4772] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state.loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    "Generate Machine ID"
                  )}
                </button>
              </div>

              <SetupSteps />
              <MachineIdFormat />
            </div>

            <WhatHappensNext />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MachineDetails machineId={state.machineId} />

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
                  <Key className="w-6 h-6" />
                  Set Up PIN
                </h2>
                <p className="text-gray-500">
                  Create a secure PIN for your machine
                </p>
              </div>

              {state.success && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {state.success}
                </div>
              )}

              <PinInput
                pin={state.pin}
                confirmPin={state.confirmPin}
                pinStep={state.pinStep}
                pinError={state.pinError}
                loading={state.loading}
                onPinChange={(pin) => updateState({ pin })}
                onConfirmPinChange={(confirmPin) => updateState({ confirmPin })}
                onStepChange={(pinStep) =>
                  updateState({ pinStep, pinError: "", confirmPin: "" })
                }
                onComplete={handleSetupComplete}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
