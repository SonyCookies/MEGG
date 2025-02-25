import { BarChart3, ArrowRight } from "lucide-react"

export function MachineIdFormat() {
  return (
    <div className="bg-[#0e5f97]/5 rounded-lg p-4 mb-6">
      <h3 className="font-medium text-[#0e4772] flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4" />
        Machine ID Format
      </h3>
      <div className="flex items-center justify-center gap-2 font-mono text-lg">
        <span className="bg-white px-3 py-1 rounded border">MEGG</span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className="bg-white px-3 py-1 rounded border">2025</span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className="bg-white px-3 py-1 rounded border">94M</span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className="bg-white px-3 py-1 rounded border">019</span>
      </div>
      <p className="text-sm text-center text-gray-500 mt-2">Format: PREFIX-YEAR-SERIAL-CODE</p>
    </div>
  )
}

