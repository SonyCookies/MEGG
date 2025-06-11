// WiFi API abstraction layer
export interface WiFiNetwork {
  ssid: string
  signal: number
  security: "open" | "wep" | "wpa" | "wpa2" | "wpa3"
  connected: boolean
  frequency?: number
  bssid?: string
}

export interface WiFiAPI {
  scanNetworks(): Promise<WiFiNetwork[]>
  connectToNetwork(ssid: string, password?: string): Promise<boolean>
  disconnectFromNetwork(ssid: string): Promise<boolean>
  getCurrentNetwork(): Promise<WiFiNetwork | null>
}

// Backend API WiFi Service
class BackendWiFiAPI implements WiFiAPI {
  private baseUrl: string

  constructor(baseUrl = "/api/wifi") {
    this.baseUrl = baseUrl
  }

  async scanNetworks(): Promise<WiFiNetwork[]> {
    try {
      console.log("Scanning networks via backend API...")
      const response = await fetch(`${this.baseUrl}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.networks || []
    } catch (error) {
      console.error("Failed to scan networks:", error)
      throw new Error(error instanceof Error ? error.message : "Failed to scan WiFi networks")
    }
  }

  async connectToNetwork(ssid: string, password?: string): Promise<boolean> {
    try {
      console.log(`Connecting to network: ${ssid}`)
      const response = await fetch(`${this.baseUrl}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssid, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Connection failed")
      }

      return data.success || false
    } catch (error) {
      console.error("Failed to connect:", error)
      throw new Error(error instanceof Error ? error.message : "Connection failed")
    }
  }

  async disconnectFromNetwork(ssid: string): Promise<boolean> {
    try {
      console.log(`Disconnecting from network: ${ssid}`)
      const response = await fetch(`${this.baseUrl}/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssid }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Disconnect failed")
      }

      return data.success || false
    } catch (error) {
      console.error("Failed to disconnect:", error)
      throw new Error(error instanceof Error ? error.message : "Disconnect failed")
    }
  }

  async getCurrentNetwork(): Promise<WiFiNetwork | null> {
    try {
      console.log("Getting current network...")
      const response = await fetch(`${this.baseUrl}/current`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to get current network")
      }

      const data = await response.json()
      return data.network || null
    } catch (error) {
      console.error("Failed to get current network:", error)
      return null // Don't throw here, just return null
    }
  }
}

// Factory function to create the WiFi API
export function createWiFiAPI(): WiFiAPI {
  return new BackendWiFiAPI()
}
