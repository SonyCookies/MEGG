"use client"

import { useState, useEffect } from "react"
import { Wifi, RefreshCw, Loader2, Shield, Globe } from "lucide-react"

export default function NetworkConfigTab() {
  const [networkSettings, setNetworkSettings] = useState({
    connectionType: "wifi",
    networkName: "MEGG_Network",
    useDhcp: true,
    ipAddress: "192.168.1.100",
    subnetMask: "255.255.255.0",
    gateway: "192.168.1.1",
    dns: "8.8.8.8",
  })
  const [availableNetworks, setAvailableNetworks] = useState([])
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    // Simulate loading available networks
    scanNetworks()
  }, [])

  const scanNetworks = () => {
    setScanning(true)
    // Simulate network scanning
    setTimeout(() => {
      setAvailableNetworks([
        { ssid: "MEGG_Network", signal: 90, secured: true },
        { ssid: "Farm_WiFi", signal: 75, secured: true },
        { ssid: "Guest_Network", signal: 60, secured: false },
        { ssid: "Office_5G", signal: 85, secured: true },
      ])
      setScanning(false)
    }, 2000)
  }

  const handleNetworkChange = (field, value) => {
    setNetworkSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const selectNetwork = (ssid) => {
    setNetworkSettings((prev) => ({
      ...prev,
      networkName: ssid,
    }))
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#0e5f97] mb-4 flex items-center">
        <Wifi className="w-5 h-5 mr-2" />
        Network Configuration
      </h2>

      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Connection Type</h3>
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => handleNetworkChange("connectionType", "wifi")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                networkSettings.connectionType === "wifi"
                  ? "bg-[#0e5f97] text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              <Wifi className="w-4 h-4" />
              Wi-Fi
            </button>
            <button
              onClick={() => handleNetworkChange("connectionType", "ethernet")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                networkSettings.connectionType === "ethernet"
                  ? "bg-[#0e5f97] text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              <Globe className="w-4 h-4" />
              Ethernet
            </button>
          </div>

          {networkSettings.connectionType === "wifi" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Available Networks</label>
                  <button
                    onClick={scanNetworks}
                    disabled={scanning}
                    className="text-xs text-[#0e5f97] hover:underline flex items-center gap-1"
                  >
                    {scanning ? (
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

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {scanning ? (
                    <div className="p-4 text-center text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Scanning for networks...
                    </div>
                  ) : availableNetworks.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto">
                      {availableNetworks.map((network, index) => (
                        <div
                          key={index}
                          className={`p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                            networkSettings.networkName === network.ssid ? "bg-blue-50" : ""
                          }`}
                          onClick={() => selectNetwork(network.ssid)}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Network Name (SSID)</label>
                <input
                  type="text"
                  value={networkSettings.networkName}
                  onChange={(e) => handleNetworkChange("networkName", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e5f97]"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-[#171717]">IP Configuration</h3>
              <p className="text-xs text-gray-500">Configure how this machine obtains an IP address</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={networkSettings.useDhcp}
                onChange={(e) => handleNetworkChange("useDhcp", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0e5f97]"></div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                {networkSettings.useDhcp ? "DHCP" : "Static IP"}
              </span>
            </label>
          </div>

          {!networkSettings.useDhcp && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                <input
                  type="text"
                  value={networkSettings.ipAddress}
                  onChange={(e) => handleNetworkChange("ipAddress", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e5f97]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subnet Mask</label>
                <input
                  type="text"
                  value={networkSettings.subnetMask}
                  onChange={(e) => handleNetworkChange("subnetMask", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e5f97]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gateway</label>
                <input
                  type="text"
                  value={networkSettings.gateway}
                  onChange={(e) => handleNetworkChange("gateway", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e5f97]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNS Server</label>
                <input
                  type="text"
                  value={networkSettings.dns}
                  onChange={(e) => handleNetworkChange("dns", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e5f97]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

