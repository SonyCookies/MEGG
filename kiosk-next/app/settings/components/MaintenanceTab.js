import { WrenchIcon, Calendar, AlertCircle, Clock, CheckCircle, RotateCw } from "lucide-react"

export default function MaintenanceTab() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[#0e5f97] mb-4 flex items-center">
        <WrenchIcon className="w-5 h-5 mr-2" />
        Machine Maintenance
      </h2>

      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Maintenance Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#ecb662] bg-opacity-20 p-3 rounded-lg">
              <div className="flex items-center mb-1">
                <Calendar className="w-4 h-4 mr-2 text-[#0e5f97]" />
                <h4 className="font-medium text-[#171717]">Last Maintenance</h4>
              </div>
              <p className="text-[#171717]">2023-06-15</p>
            </div>
            <div className="bg-[#ecb662] bg-opacity-20 p-3 rounded-lg">
              <div className="flex items-center mb-1">
                <Calendar className="w-4 h-4 mr-2 text-[#0e5f97]" />
                <h4 className="font-medium text-[#171717]">Next Scheduled</h4>
              </div>
              <p className="text-[#171717]">2023-09-15</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Machine Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#ecb662] bg-opacity-20 p-3 rounded-lg">
              <div className="flex items-center mb-1">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                <h4 className="font-medium text-[#171717]">Current Status</h4>
              </div>
              <p className="text-[#0e5f97] font-medium">Operational</p>
            </div>
            <div className="bg-[#ecb662] bg-opacity-20 p-3 rounded-lg">
              <div className="flex items-center mb-1">
                <Clock className="w-4 h-4 mr-2 text-[#0e5f97]" />
                <h4 className="font-medium text-[#171717]">Total Runtime</h4>
              </div>
              <p className="text-[#171717]">1,250 hours</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Maintenance Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-2 bg-blue-50 rounded-lg text-[#0e5f97] hover:bg-blue-100 transition-colors">
              <div className="flex items-center">
                <WrenchIcon className="w-4 h-4 mr-2" />
                <span>Run Diagnostic Test</span>
              </div>
              <span className="text-xs">~5 minutes</span>
            </button>

            <button className="w-full flex items-center justify-between p-2 bg-blue-50 rounded-lg text-[#0e5f97] hover:bg-blue-100 transition-colors">
              <div className="flex items-center">
                <RotateCw className="w-4 h-4 mr-2" />
                <span>Calibrate Sensors</span>
              </div>
              <span className="text-xs">~10 minutes</span>
            </button>

            <button className="w-full flex items-center justify-between p-2 bg-red-50 rounded-lg text-red-600 hover:bg-red-100 transition-colors">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>Factory Reset</span>
              </div>
              <span className="text-xs">Caution</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

