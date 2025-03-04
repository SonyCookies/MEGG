"use client"

import { Key, AlertCircle } from "lucide-react"

const numberPad = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["C", "0", "⌫"],
]

export function PinEntry({ pin, loading, error, success, onPinInput, onClear, onBackspace, onSubmit, disabled }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
          <Key className="w-6 h-6" />
          Enter PIN
        </h2>
        <p className="text-gray-500">Enter your 4-digit security PIN</p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* PIN Display */}
        <div className="text-center space-y-4">
          <div className="flex gap-3 justify-center">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200
                  ${
                    i < pin.length
                      ? "border-[#0e5f97] bg-[#0e5f97]/5 text-[#0e5f97]"
                      : "border-gray-200 text-transparent"
                  }`}
              >
                •
              </div>
            ))}
          </div>
        </div>

        {/* Number Pad */}
        <div className="flex flex-col items-center justify-center gap-4">
          {numberPad.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-4">
              {row.map((digit, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => {
                  if (digit === "C") onClear()
                  else if (digit === "⌫") onBackspace()
                  else onPinInput(digit)
                }}
                disabled={loading}
                className={`w-16 h-16 text-xl font-medium rounded-lg transition-all duration-200
                  ${
                    digit === "C" || digit === "⌫"
                      ? "border-2 border-[#0e5f97] text-[#0e5f97] hover:bg-[#0e5f97]/10"
                      : "bg-gray-50 hover:bg-gray-100 hover:scale-105"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                `}
              >
                {digit}
              </button>
              ))}
              </div>
            ))}
        </div>

        {/* Login Button */}
        {pin.length === 4 && (
          <button
            onClick={onSubmit}
            disabled={loading || disabled}
            className="w-full bg-[#0e5f97] hover:bg-[#0e4772] text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </div>
            ) : (
              "Login"
            )}
          </button>
        )}
      </div>
    </div>
  )
}

