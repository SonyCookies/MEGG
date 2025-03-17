"use client"

import { useState, useEffect } from "react"
import {
  Cpu,
  Wifi,
  Database,
  Bell,
  Shield,
  RefreshCw,
  X,
  Save,
  Globe,
  Loader2,
  AlertCircle,
  Camera,
  Sliders,
  Crosshair,
  Maximize,
  RotateCw,
} from "lucide-react"
import NetworkService from "../util/networkservice"

export default function SystemSettingsTab() {
  const [showNetworkModal, setShowNetworkModal] = useState(false)
  const [networkSettings, setNetworkSettings] = useState({
    networkName: "MEGG_Network",
    connectionType: "wifi",
    ipAddress: "192.168.1.100",
    subnetMask: "255.255.255.0",
    gateway: "192.168.1.1",
    dns: "8.8.8.8",
    useDhcp: true,
  })
  const [loading, setLoading] = useState(false)
  const [availableNetworks, setAvailableNetworks] = useState([])
  const [scanningNetworks, setScanningNetworks] = useState(false)
  const [error, setError] = useState(null)
  const [isSimulated, setIsSimulated] = useState(false)

  const [calibrationMode, setCalibrationMode] = useState(false)
  const [calibrationStep, setCalibrationStep] = useState(0)

  const startCalibration = () => {
    setCalibrationMode(true)
    setCalibrationStep(1)
  }

  const nextCalibrationStep = () => {
    if (calibrationStep < 3) {
      setCalibrationStep(calibrationStep + 1)
    } else {
      // Finish calibration
      setCalibrationMode(false)
      setCalibrationStep(0)
      alert("Camera calibration completed successfully!")
    }
  }

  const cancelCalibration = () => {
    setCalibrationMode(false)
    setCalibrationStep(0)
  }

  // Fetch current network status when component mounts
  useEffect(() => {
    const fetchNetworkStatus = async () => {
      try {
        setError(null)
        const status = await NetworkService.getNetworkStatus()

        // Check if we're using simulated data
        setIsSimulated(!status.isReal)

        setNetworkSettings((prev) => ({
          ...prev,
          networkName: status.networkName,
          connectionType: status.connectionType,
          useDhcp: status.useDhcp,
          ipAddress: status.ipAddress || prev.ipAddress,
        }))
      } catch (error) {
        console.error("Failed to fetch network status:", error)
        setError("Could not retrieve network status. Using default values.")
        setIsSimulated(true)
      }
    }

    fetchNetworkStatus()
  }, [])

  const handleNetworkChange = (field, value) => {
    setNetworkSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const scanForNetworks = async () => {
    setScanningNetworks(true)
    setError(null)
    try {
      const networks = await NetworkService.scanWifiNetworks()
      setAvailableNetworks(networks)
    } catch (error) {
      console.error("Failed to scan for networks:", error)
      setError("Could not scan for networks. Using sample data.")
    } finally {
      setScanningNetworks(false)
    }
  }

  const saveNetworkSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await NetworkService.applyNetworkSettings(networkSettings)

      if (result.success) {
        // Close the modal
        setShowNetworkModal(false)

        // Show success message (in a real app, use a toast notification)
        alert(result.message || "Network settings saved successfully!")
      } else {
        setError(`Failed to save network settings: ${result.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error saving network settings:", error)
      setError("An error occurred while saving network settings.")
    } finally {
      setLoading(false)
    }
  }

  const openNetworkModal = () => {
    setShowNetworkModal(true)
    setError(null)
    // Scan for networks when modal opens
    scanForNetworks()
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#0e5f97] mb-4 flex items-center">
        <Cpu className="w-5 h-5 mr-2" />
        System Settings
      </h2>

      {isSimulated && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            Using simulated network data. Real network configuration is not available in this environment.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Camera Calibration Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3 flex items-center">
            <Camera className="w-4 h-4 text-[#0e5f97] mr-2" />
            Camera Calibration
          </h3>

          {!calibrationMode ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Calibrate the camera to ensure accurate egg detection and sorting. This process will adjust the camera's
                position, focus, and detection parameters.
              </p>

              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                <div>
                  <h4 className="font-medium text-[#0e4772]">Last Calibration</h4>
                  <p className="text-xs text-gray-500">2023-09-15 10:30 AM</p>
                </div>
                <button
                  onClick={startCalibration}
                  className="px-3 py-1.5 bg-[#0e5f97] text-white rounded-lg text-sm hover:bg-[#0e4772] transition-colors flex items-center gap-1"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  Start Calibration
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-[#0e5f97]" />
                    Detection Sensitivity
                  </h4>
                  <p className="text-sm text-gray-500">85%</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Maximize className="w-3.5 h-3.5 text-[#0e5f97]" />
                    Field of View
                  </h4>
                  <p className="text-sm text-gray-500">Standard (120°)</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-[#0e4772] mb-2 flex items-center gap-1">
                  <Crosshair className="w-4 h-4" />
                  Calibration Step {calibrationStep} of 3
                </h4>

                {calibrationStep === 1 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      Place the calibration card in the center of the conveyor belt.
                    </p>
                    <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Make sure the calibration card is clearly visible and well-lit.
                    </p>
                  </div>
                )}

                {calibrationStep === 2 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">Adjusting camera focus and alignment...</p>
                    <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                      <RotateCw className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                    <p className="text-xs text-gray-500">Please wait while the system adjusts the camera parameters.</p>
                  </div>
                )}

                {calibrationStep === 3 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">Verifying calibration with test objects...</p>
                    <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-20 rounded-full border-2 border-green-500 flex items-center justify-center">
                          <span className="text-xs text-green-600">Detected</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      The system is verifying that objects are correctly detected.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={cancelCalibration}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={nextCalibrationStep}
                    className="px-3 py-1.5 bg-[#0e5f97] text-white rounded-lg text-sm hover:bg-[#0e4772] transition-colors"
                  >
                    {calibrationStep < 3 ? "Next Step" : "Finish"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Network Configuration</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wifi className="w-4 h-4 text-[#0e5f97] mr-2" />
                <div>
                  <h4 className="font-medium text-[#171717]">Network Connection</h4>
                  <p className="text-xs text-gray-500">Connected to {networkSettings.networkName}</p>
                </div>
              </div>
              <button onClick={openNetworkModal} className="text-xs text-[#0e5f97] hover:underline">
                Configure
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Database className="w-4 h-4 text-[#0e5f97] mr-2" />
                <div>
                  <h4 className="font-medium text-[#171717]">Data Storage</h4>
                  <p className="text-xs text-gray-500">Local + Cloud Sync</p>
                </div>
              </div>
              <button className="text-xs text-[#0e5f97] hover:underline">Configure</button>
            </div>
          </div>
        </div>

        {/* Notifications Section - Kept from original */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="w-4 h-4 text-[#0e5f97] mr-2" />
                <span>Error Alerts</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0e5f97]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="w-4 h-4 text-[#0e5f97] mr-2" />
                <span>Maintenance Reminders</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0e5f97]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* System Updates Section - Kept from original */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">System Updates</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 text-[#0e5f97] mr-2" />
              <div>
                <h4 className="font-medium text-[#171717]">Software Version</h4>
                <p className="text-xs text-gray-500">v2.3.5 (Latest)</p>
              </div>
            </div>
            <button className="px-3 py-1 text-xs bg-[#0e5f97] text-white rounded hover:bg-[#0e4772]">
              Check for Updates
            </button>
          </div>
        </div>

        {/* Security Section - Kept from original */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Security</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-4 h-4 text-[#0e5f97] mr-2" />
              <div>
                <h4 className="font-medium text-[#171717]">Access Control</h4>
                <p className="text-xs text-gray-500">PIN protection enabled</p>
              </div>
            </div>
            <button className="text-xs text-[#0e5f97] hover:underline">Configure</button>
          </div>
        </div>
      </div>

      {/* Network Configuration Modal */}
      {showNetworkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0e5f97] flex items-center">
                <Wifi className="w-5 h-5 mr-2" />
                Network Configuration
              </h3>
              <button onClick={() => setShowNetworkModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSimulated && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>Using simulated mode. Changes won't affect the actual network.</p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Connection Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Connection Type</label>
                <select
                  value={networkSettings.connectionType}
                  onChange={(e) => handleNetworkChange("connectionType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0e5f97]"
                >
                  <option value="wifi">Wi-Fi</option>
                  <option value="ethernet">Ethernet</option>
                  <option value="cellular">Cellular</option>
                </select>
              </div>

              {/* Available Networks - Only show for WiFi */}
              {networkSettings.connectionType === "wifi" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Available Networks</label>
                    <button
                      onClick={scanForNetworks}
                      className="text-xs text-[#0e5f97] hover:underline flex items-center gap-1"
                      disabled={scanningNetworks}
                    >
                      {scanningNetworks ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          Scan
                        </>
                      )}
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    {scanningNetworks ? (
                      <div className="p-4 text-center text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Scanning for networks...
                      </div>
                    ) : availableNetworks.length > 0 ? (
                      <div className="max-h-40 overflow-y-auto">
                        {availableNetworks.map((network, index) => (
                          <div
                            key={index}
                            className={`p-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                              networkSettings.networkName === network.ssid ? "bg-blue-50" : ""
                            }`}
                            onClick={() => handleNetworkChange("networkName", network.ssid)}
                          >
                            <div className="flex items-center">
                              <Wifi
                                className={`w-4 h-4 mr-2 ${
                                  network.signal > 70
                                    ? "text-green-500"
                                    : network.signal > 40
                                      ? "text-yellow-500"
                                      : "text-red-500"
                                }`}
                              />
                              <span>{network.ssid}</span>
                              {network.secured && <Shield className="w-3 h-3 ml-1 text-gray-400" />}
                            </div>
                            <div className="text-xs text-gray-500">{network.signal}%</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No networks found. Click "Scan" to search for available networks.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Network Name - Manual input for WiFi */}
              {networkSettings.connectionType === "wifi" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Network Name (SSID)</label>
                  <input
                    type="text"
                    value={networkSettings.networkName}
                    onChange={(e) => handleNetworkChange("networkName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0e5f97]"
                  />
                </div>
              )}

              {/* DHCP Toggle */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div>
                  <h4 className="font-medium text-[#171717]">Use DHCP</h4>
                  <p className="text-xs text-gray-500">Automatically obtain IP address</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={networkSettings.useDhcp}
                    onChange={(e) => handleNetworkChange("useDhcp", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0e5f97]"></div>
                </label>
              </div>

              {/* Static IP Settings - Only show if DHCP is off */}
              {!networkSettings.useDhcp && (
                <div className="space-y-3 border-t pt-3">
                  <h4 className="font-medium text-[#171717] flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-[#0e5f97]" />
                    Static IP Configuration
                  </h4>

                  {/* IP Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                    <input
                      type="text"
                      value={networkSettings.ipAddress}
                      onChange={(e) => handleNetworkChange("ipAddress", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0e5f97]"
                    />
                  </div>

                  {/* Subnet Mask */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subnet Mask</label>
                    <input
                      type="text"
                      value={networkSettings.subnetMask}
                      onChange={(e) => handleNetworkChange("subnetMask", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0e5f97]"
                    />
                  </div>

                  {/* Gateway */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gateway</label>
                    <input
                      type="text"
                      value={networkSettings.gateway}
                      onChange={(e) => handleNetworkChange("gateway", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0e5f97]"
                    />
                  </div>

                  {/* DNS */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DNS Server</label>
                    <input
                      type="text"
                      value={networkSettings.dns}
                      onChange={(e) => handleNetworkChange("dns", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0e5f97]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowNetworkModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveNetworkSettings}
                disabled={loading}
                className="px-4 py-2 bg-[#0e5f97] text-white rounded-md hover:bg-[#0e4772] flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

