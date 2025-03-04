import { Shield, Info, Lock } from "lucide-react"

export function MachineIdInput({ machineId, onMachineIdChange, maxAttempts=5 }) {
  const formatMachineId = (value) => {
    const cleaned = value.replace(/[^A-Z0-9]/gi, "").toUpperCase()

    let formatted = ""

    formatted += cleaned.slice(0, 4)
    if (cleaned.length > 4) {
      formatted += "-"
      formatted += cleaned.slice(4, 8)
      if (cleaned.length > 8) {
        formatted += "-"
        formatted += cleaned.slice(8, 11)
        if (cleaned.length > 11) {
          formatted += "-"
          formatted += cleaned.slice(11, 14)
        }
      }
    }

    return formatted
  }

  const handleChange = (e) => {
    const formatted = formatMachineId(e.target.value)
    onMachineIdChange(formatted)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Machine Login
          </h2>
          <p className="text-gray-500">Enter your machine credentials</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="machine-id" className="block text-sm font-medium text-gray-700">
              Machine ID
            </label>
            <input
              id="machine-id"
              type="text"
              placeholder="MEGG-2025-94M-019"
              value={machineId}
              onChange={handleChange}
              maxLength={17}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e5f97] focus:border-[#0e5f97] font-mono"
              style={{ letterSpacing: "0.5px" }}
            />
            <p className="text-xs text-gray-500">Format: XXXX-XXXX-XXX-XXX</p>
          </div>

          <div className="bg-[#0e5f97]/5 rounded-lg p-4">
            <h3 className="font-medium text-[#0e4772] flex items-center gap-2 mb-3">
              <Info className="w-4 h-4" />
              Security Notice
            </h3>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <Lock className="w-4 h-4 text-[#0e5f97] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Account Protection</p>
                <p>Your account will be temporarily locked after {maxAttempts} failed attempts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

