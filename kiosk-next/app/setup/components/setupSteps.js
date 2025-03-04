import { Cpu, QrCode, Shield, KeyRound } from "lucide-react"

const setupSteps = [
  {
    icon: Cpu,
    title: "Machine Registration",
    description: "Generate a unique machine ID with format MEGG-YYYY-XXX-XXX",
  },
  {
    icon: QrCode,
    title: "QR Code Generation",
    description: "System creates a secure QR code for easy machine identification",
  },
  {
    icon: Shield,
    title: "Security Setup",
    description: "Configure access controls and security settings",
  },
  {
    icon: KeyRound,
    title: "PIN Protection",
    description: "Set up a secure 4-digit PIN for machine access",
  },
]

export function SetupSteps() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {setupSteps.map((step, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="bg-[#0e5f97]/10 rounded-lg p-2">
              <step.icon className="h-6 w-6 text-[#0e5f97]" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{step.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

