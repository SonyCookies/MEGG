"use client";

import { useState, useEffect } from "react";
import {
  Check,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Info,
  Lock,
  Fingerprint,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { addAccessLog } from "../../utils/logging";

export default function PinAuthTab() {
  const [step, setStep] = useState("loading"); // loading, current, new, confirm
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasPinSetup, setHasPinSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if PIN exists on component mount
  useEffect(() => {
    const checkPinSetup = async () => {
      try {
        // Get machineId from session
        const sessionResponse = await fetch("/api/auth/session");
        const sessionData = await sessionResponse.json();

        if (!sessionResponse.ok) {
          throw new Error(sessionData.error || "Session invalid");
        }

        const machineId = sessionData.machineId;
        if (!machineId) {
          setError("Machine ID not found");
          setStep("new");
          return;
        }

        const machineRef = doc(db, "machines", machineId);
        const machineDoc = await getDoc(machineRef);

        if (machineDoc.exists()) {
          const data = machineDoc.data();
          setHasPinSetup(!!data.pin);
          setStep(data.pin ? "current" : "new");
        } else {
          setError("Machine not found");
          setStep("new");
        }
      } catch (err) {
        console.error("Error checking PIN setup:", err);
        setError("Failed to check PIN status");
        setStep("new");
      } finally {
        setLoading(false);
      }
    };

    checkPinSetup();
  }, []);

  const handlePinInput = (digit, pinType) => {
    setError("");
    switch (pinType) {
      case "current":
        if (currentPin.length < 4) {
          setCurrentPin((prev) => prev + digit);
        }
        break;
      case "new":
        if (newPin.length < 4) {
          setNewPin((prev) => prev + digit);
        }
        break;
      case "confirm":
        if (confirmPin.length < 4) {
          setConfirmPin((prev) => prev + digit);
        }
        break;
    }
  };

  const handleBackspace = (pinType) => {
    switch (pinType) {
      case "current":
        setCurrentPin((prev) => prev.slice(0, -1));
        break;
      case "new":
        setNewPin((prev) => prev.slice(0, -1));
        break;
      case "confirm":
        setConfirmPin((prev) => prev.slice(0, -1));
        break;
    }
  };

  const handleClear = (pinType) => {
    switch (pinType) {
      case "current":
        setCurrentPin("");
        break;
      case "new":
        setNewPin("");
        break;
      case "confirm":
        setConfirmPin("");
        break;
    }
  };

  const handleNext = async () => {
    if (step === "current" && currentPin.length === 4) {
      try {
        // Get machineId from session
        const sessionResponse = await fetch("/api/auth/session");
        const sessionData = await sessionResponse.json();

        if (!sessionResponse.ok) {
          throw new Error(sessionData.error || "Session invalid");
        }

        const machineId = sessionData.machineId;
        if (!machineId) throw new Error("Machine ID not found");

        // Verify current PIN through API
        const response = await fetch("/api/auth/verify-pin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            machineId,
            pin: currentPin,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to verify current PIN");
        }

        // If verification successful, move to next step
        setStep("new");
        setCurrentPin("");
      } catch (err) {
        console.error("Error verifying current PIN:", err);
        setError(err.message || "Incorrect PIN");
        setCurrentPin("");

        // Get machineId for logging
        const sessionResponse = await fetch("/api/auth/session");
        const sessionData = await sessionResponse.json();
        const machineId = sessionData.machineId;

        // Log failed verification
        if (machineId) {
          await addAccessLog(
            {
              action: "pin_verify",
              status: "failed",
              details: "Failed to verify current PIN",
            },
            machineId
          );
        }
      }
    } else if (step === "new" && newPin.length === 4) {
      setStep("confirm");
    }
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("new");
      setConfirmPin("");
    } else if (step === "new" && hasPinSetup) {
      setStep("current");
      setNewPin("");
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    // Basic validation
    if (newPin !== confirmPin) {
      setError("New PINs do not match");
      return;
    }

    if (newPin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    if (!/^\d+$/.test(newPin)) {
      setError("PIN must contain only numbers");
      return;
    }

    try {
      // Get machineId from session
      const sessionResponse = await fetch("/api/auth/session");
      const sessionData = await sessionResponse.json();

      if (!sessionResponse.ok) {
        throw new Error(sessionData.error || "Session invalid");
      }

      const machineId = sessionData.machineId;
      if (!machineId) throw new Error("Machine ID not found");

      // Update PIN through API
      const response = await fetch("/api/auth/change-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machineId,
          currentPin: hasPinSetup ? currentPin : null,
          newPin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update PIN");
      }

      // Log successful PIN change
      await addAccessLog(
        {
          action: "pin_change",
          status: "success",
          details: "PIN successfully updated",
        },
        machineId
      );

      setSuccess("PIN successfully updated");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setStep("current");
      setHasPinSetup(true);
    } catch (err) {
      console.error("Error updating PIN:", err);
      setError(err.message || "Failed to update PIN");

      // Get machineId for logging
      const sessionResponse = await fetch("/api/auth/session");
      const sessionData = await sessionResponse.json();
      const machineId = sessionData.machineId;

      // Log the error
      if (machineId) {
        await addAccessLog(
          {
            action: "pin_change",
            status: "failed",
            details: "Failed to update PIN",
            error: err.message,
          },
          machineId
        );
      }
    }
  };

  const numberPad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "⌫"],
  ];

  const getCurrentPin = () => {
    switch (step) {
      case "current":
        return currentPin;
      case "new":
        return newPin;
      case "confirm":
        return confirmPin;
      default:
        return "";
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "loading":
        return "Loading...";
      case "current":
        return "Enter Current PIN";
      case "new":
        return hasPinSetup ? "Enter New PIN" : "Set Up PIN";
      case "confirm":
        return "Confirm New PIN";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Information */}
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
                  <KeyRound className="w-6 h-6" />
                  {hasPinSetup ? "Change PIN" : "Set Up PIN"}
                </h2>
                <p className="text-gray-500">Enter Current PIN</p>
              </div>
              {hasPinSetup && (
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">PIN Active</span>
                </div>
              )}
            </div>

            {/* Security Info Box */}
            <div className="bg-[#0e5f97]/5 rounded-lg p-4">
              <h3 className="font-medium text-[#0e4772] flex items-center gap-2 mb-3">
                <Info className="w-4 h-4" />
                Security Information
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <Lock className="w-4 h-4 text-[#0e5f97] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">Access Control</p>
                    <p>
                      PIN provides secure access to machine settings and
                      prevents unauthorized access
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <Fingerprint className="w-4 h-4 text-[#0e5f97] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">PIN Guidelines</p>
                    <p>
                      Choose a unique 4-digit code that you haven't used before
                      and can remember easily
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* PIN Requirements */}
            <div className="space-y-4">
              <h3 className="font-medium text-[#0e4772] flex items-center gap-2">
                <Lock className="w-4 h-4" />
                PIN Requirements
              </h3>
              <div className="grid gap-4 text-sm">
                <div className="bg-white border rounded-lg p-4">
                  <p className="font-medium text-gray-700 mb-1">
                    Length & Format
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0e5f97]" />
                      Must be exactly 4 digits
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0e5f97]" />
                      Numbers only (0-9)
                    </li>
                  </ul>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <p className="font-medium text-gray-700 mb-1">
                    Security Tips
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0e5f97]" />
                      Avoid sequential numbers (1234)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0e5f97]" />
                      Don't use birth years or obvious dates
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0e5f97]" />
                      Change your PIN periodically
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Help Text */}
            {step === "current" && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-700">
                    Forgot your PIN?
                  </span>{" "}
                  Contact your system administrator for assistance with PIN
                  reset.
                </p>
              </div>
            )}
          </div>

          {/* Right Column - PIN Entry */}
          <div className="lg:pl-8 lg:border-l">
            {/* PIN Entry Section */}
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <div className="flex flex-col items-center space-y-8">
                {/* PIN Display */}
                <div className="text-center space-y-4">
                  <div className="h-5 w-48 mx-auto animate-shimmer rounded" />
                  <div className="flex gap-3 justify-center">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-lg border-2 border-gray-200 animate-shimmer"
                      />
                    ))}
                  </div>
                </div>

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-5 mx-auto">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="w-14 h-14 rounded-lg animate-shimmer"
                    />
                  ))}
                </div>

                {/* Action Button */}
                <div className="flex flex-col gap-3 w-full max-w-[200px]">
                  <div className="h-12 w-full rounded-lg animate-shimmer" />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-6 text-center">
              <div className="h-5 w-64 mx-auto animate-shimmer rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Information */}
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
                <KeyRound className="w-6 h-6" />
                {hasPinSetup ? "Change PIN" : "Set Up PIN"}
              </h2>
              <p className="text-gray-500">{getStepTitle()}</p>
            </div>
            {hasPinSetup && (
              <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-sm font-medium">PIN Active</span>
              </div>
            )}
          </div>

          {/* Security Info Box */}
          <div className="bg-[#0e5f97]/5 rounded-lg p-4">
            <h3 className="font-medium text-[#0e4772] flex items-center gap-2 mb-3">
              <Info className="w-4 h-4" />
              Security Information
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <Lock className="w-4 h-4 text-[#0e5f97] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700">Access Control</p>
                  <p>
                    PIN provides secure access to machine settings and prevents
                    unauthorized access
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <Fingerprint className="w-4 h-4 text-[#0e5f97] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700">PIN Guidelines</p>
                  <p>
                    Choose a unique 4-digit code that you haven't used before
                    and can remember easily
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* PIN Requirements */}
          <div className="space-y-4">
            <h3 className="font-medium text-[#0e4772] flex items-center gap-2">
              <Lock className="w-4 h-4" />
              PIN Requirements
            </h3>
            <div className="grid gap-4 text-sm">
              <div className="bg-white border rounded-lg p-4">
                <p className="font-medium text-gray-700 mb-1">
                  Length & Format
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0e5f97]" />
                    Must be exactly 4 digits
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0e5f97]" />
                    Numbers only (0-9)
                  </li>
                </ul>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="font-medium text-gray-700 mb-1">Security Tips</p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0e5f97]" />
                    Avoid sequential numbers (1234)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0e5f97]" />
                    Don't use birth years or obvious dates
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0e5f97]" />
                    Change your PIN periodically
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Help Text */}
          {step === "current" && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-700">
                  Forgot your PIN?
                </span>{" "}
                Contact your system administrator for assistance with PIN reset.
              </p>
            </div>
          )}
        </div>

        {/* Right Column - PIN Entry */}
        <div className="lg:pl-8 lg:border-l">
          {!hasPinSetup && step === "new" && (
            <div className="bg-[#ecb662]/10 border border-[#ecb662] text-[#ecb662] px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                Please set up a PIN to secure your machine.
              </p>
            </div>
          )}

          {(error || success) && (
            <div
              className={`${
                error
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-green-50 border-green-200 text-green-700"
              } border px-4 py-3 rounded-lg flex gap-2 items-start mb-6`}
            >
              <span className="text-sm">{error || success}</span>
            </div>
          )}

          {/* PIN Entry Section */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="flex flex-col items-center space-y-8">
              {/* PIN Display */}
              <div className="text-center space-y-4">
                <p className="text-sm font-medium text-gray-600">
                  {step === "current"
                    ? "Enter your current PIN"
                    : step === "new"
                    ? "Enter a new 4-digit PIN"
                    : "Confirm your new PIN"}
                </p>
                <div className="flex gap-3 justify-center">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200
                        ${
                          i < getCurrentPin().length
                            ? "border-[#0e5f97] bg-[#0e5f97]/5 text-[#0e5f97]"
                            : "border-gray-200 text-transparent"
                        }`}
                    >
                      {i < getCurrentPin().length ? "•" : ""}
                    </div>
                  ))}
                </div>
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-5 mx-auto">
                {numberPad.map((row, rowIndex) =>
                  row.map((digit, colIndex) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => {
                        if (digit === "C") handleClear(step);
                        else if (digit === "⌫") handleBackspace(step);
                        else handlePinInput(digit, step);
                      }}
                      className={`w-14 h-14 text-xl font-medium rounded-lg transition-all duration-200
                        ${
                          digit === "C" || digit === "⌫"
                            ? "border-2 border-[#0e5f97] text-[#0e5f97] hover:bg-[#0e5f97]/10"
                            : "bg-gray-50 hover:bg-gray-100 hover:scale-105"
                        }
                      `}
                    >
                      {digit}
                    </button>
                  ))
                )}
              </div>

              {/* Action Button */}
              <div className="flex flex-col gap-3 w-full max-w-[200px]">
                {step === "confirm" && confirmPin.length === 4 ? (
                  <>
                    <button
                      onClick={handleSubmit}
                      className="w-full bg-[#0e5f97] hover:bg-[#0e4772] text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      {hasPinSetup ? "Update PIN" : "Set PIN"}
                    </button>
                    <button
                      onClick={handleBack}
                      className="w-full border border-gray-300 text-gray-600 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {getCurrentPin().length === 4 && (
                      <button
                        onClick={handleNext}
                        className="w-full bg-[#0e5f97] hover:bg-[#0e4772] text-white py-3 px-4 rounded-lg transition-colors duration-200"
                      >
                        Next
                      </button>
                    )}
                    {(step === "new" || step === "confirm") && (
                      <button
                        onClick={handleBack}
                        className="w-full border border-gray-300 text-gray-600 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {step === "current"
                ? "Enter your current PIN to proceed with changes"
                : "Your PIN will be required for future access"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
