import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import os from "os"

const execAsync = promisify(exec)

interface WiFiNetwork {
  ssid: string
  signal: number
  security: string
  connected: boolean
  frequency?: number
  bssid?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("Starting WiFi scan..." + request)
    const platform = os.platform()
    let networks: WiFiNetwork[] = []

    switch (platform) {
      case "linux":
        networks = await scanLinux()
        break
      case "darwin": // macOS
        networks = await scanMacOS()
        break
      case "win32": // Windows
        networks = await scanWindowsWithBetterParsing()
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    console.log(`Found ${networks.length} networks`)
    return NextResponse.json({ networks })
  } catch (error) {
    console.error("WiFi scan error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to scan WiFi networks",
        networks: [], // Return empty array as fallback
      },
      { status: 500 },
    )
  }
}

async function scanLinux(): Promise<WiFiNetwork[]> {
  try {
    // Try nmcli first (NetworkManager)
    const { stdout } = await execAsync("nmcli -t -f SSID,SIGNAL,SECURITY,ACTIVE dev wifi list")

    const networks = stdout
      .split("\n")
      .filter((line) => line.trim())
      .map((line): WiFiNetwork | null => {
        const parts = line.split(":")
        if (parts.length < 3) return null

        const [ssid, signal, security, active] = parts
        const trimmedSSID = ssid.trim()

        if (!trimmedSSID) return null

        return {
          ssid: trimmedSSID,
          signal: Number.parseInt(signal) || 0,
          security: parseSecurityType(security),
          connected: active === "yes",
        }
      })
      .filter((network): network is WiFiNetwork => network !== null)

    return networks
  } catch (error) {
    console.log("nmcli failed, trying iwlist...")

    try {
      // Fallback to iwlist
      const { stdout } = await execAsync("sudo iwlist scan | grep -E 'ESSID|Quality|Encryption'")
      return parseIwlistOutput(stdout)
    } catch (iwlistError) {
      console.error("Both nmcli and iwlist failed:", error, iwlistError)
      throw new Error("WiFi scanning not available on this system")
    }
  }
}

async function scanMacOS(): Promise<WiFiNetwork[]> {
  try {
    // Get current network first
    const { stdout: currentStdout } = await execAsync(
      "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I",
    )
    const currentSSID = currentStdout.match(/\s+SSID: (.+)/)?.[1]?.trim()

    // Scan for networks
    const { stdout } = await execAsync(
      "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s",
    )

    const networks = stdout
      .split("\n")
      .slice(1) // Skip header
      .filter((line) => line.trim())
      .map((line): WiFiNetwork | null => {
        // Parse airport output format
        const match = line.match(/^(.+?)\s+([a-fA-F0-9:]{17})\s+(-?\d+)\s+(\d+)\s+(.+)$/)
        if (!match) return null

        const [, ssid, bssid, rssi, security] = match
        const trimmedSSID = ssid.trim()

        if (!trimmedSSID) return null

        return {
          ssid: trimmedSSID,
          signal: rssiToPercentage(Number.parseInt(rssi)),
          security: parseSecurityType(security),
          connected: trimmedSSID === currentSSID,
          bssid: bssid,
        }
      })
      .filter((network): network is WiFiNetwork => network !== null)

    return networks
  } catch (error) {
    console.error("macOS WiFi scan failed:", error)
    throw new Error("WiFi scanning failed on macOS")
  }
}

async function scanWindowsWithBetterParsing(): Promise<WiFiNetwork[]> {
  console.log("=== Windows WiFi Scan with Better SSID Parsing ===")

  // Get current connected network first
  let currentSSID: string | null = null
  try {
    const { stdout: currentStdout } = await execAsync("netsh wlan show interfaces")

    // More careful SSID extraction
    const lines = currentStdout.split("\n")
    for (const line of lines) {
      const ssidMatch = line.match(/^\s*SSID\s*:\s*(.+)$/i)
      if (ssidMatch) {
        const extractedSSID = ssidMatch[1].trim()

        // Validate it's not a BSSID (MAC address)
        const bssidPattern =
          /^[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}$/
        if (!bssidPattern.test(extractedSSID)) {
          currentSSID = extractedSSID
          console.log("Current connected SSID:", currentSSID)
          break
        } else {
          console.log("Skipping BSSID:", extractedSSID)
        }
      }
    }
  } catch (error) {
    console.log("Could not get current network:", error)
  }

  // Try different methods to get available networks
  const methods = [
    () => tryWindowsNetshScanImproved(currentSSID),
    () => tryWindowsPowerShellScanImproved(currentSSID),
    () => tryWindowsProfileScanImproved(currentSSID),
  ]

  for (const [index, method] of methods.entries()) {
    try {
      console.log(`--- Trying Windows method ${index + 1} ---`)
      const networks = await method()
      if (networks.length > 0) {
        console.log(`Method ${index + 1} succeeded with ${networks.length} networks`)

        // Filter out any networks with BSSID as SSID
        const validNetworks = networks.filter((network) => {
          const bssidPattern =
            /^[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}$/
          return !bssidPattern.test(network.ssid)
        })

        if (validNetworks.length > 0) {
          return validNetworks
        }
      }
    } catch (error) {
      console.log(`Method ${index + 1} failed:`, error)
    }
  }

  console.log("All Windows scanning methods failed")
  return []
}

async function tryWindowsNetshScanImproved(currentSSID: string | null): Promise<WiFiNetwork[]> {
  console.log("Trying improved netsh wlan show networks...")

  try {
    // Try with mode=bssid first but parse more carefully
    const { stdout } = await execAsync("netsh wlan show networks mode=bssid")

    // Check if we got permission error
    if (stdout.toLowerCase().includes("location") || stdout.toLowerCase().includes("permission")) {
      console.log("Location permission required for detailed scan")
      throw new Error("Location permission required")
    }

    const networks = parseNetshNetworksImproved(stdout, currentSSID)
    if (networks.length > 0) return networks

    // Try basic scan
    const { stdout: basicStdout } = await execAsync("netsh wlan show networks")
    return parseBasicNetshNetworksImproved(basicStdout, currentSSID)
  } catch (error) {
    console.log("netsh scan failed:", error)
    throw error
  }
}

async function tryWindowsPowerShellScanImproved(currentSSID: string | null): Promise<WiFiNetwork[]> {
  console.log("Trying improved PowerShell WiFi scan...")

  try {
    // Try to get available networks through PowerShell
    const { stdout } = await execAsync(
      `powershell -Command "netsh wlan show networks | Select-String -Pattern 'SSID|Authentication|Encryption'"`,
    )

    if (stdout.trim()) {
      console.log("PowerShell netsh output:", stdout)
      return parseBasicNetshNetworksImproved(stdout, currentSSID)
    }

    throw new Error("No networks found via PowerShell")
  } catch (error) {
    console.log("PowerShell scan failed:", error)
    throw error
  }
}

async function tryWindowsProfileScanImproved(currentSSID: string | null): Promise<WiFiNetwork[]> {
  console.log("Trying improved saved profiles scan...")

  try {
    const { stdout } = await execAsync("netsh wlan show profiles")
    const networks: WiFiNetwork[] = []
    const profileLines = stdout.split("\n")

    for (const line of profileLines) {
      const profileMatch = line.match(/All User Profile\s*:\s*(.+)/)
      if (profileMatch) {
        const profileName = profileMatch[1].trim()

        try {
          const { stdout: detailStdout } = await execAsync(`netsh wlan show profile name="${profileName}"`)
          const ssidMatch = detailStdout.match(/SSID name\s*:\s*"(.+)"/)
          const authMatch = detailStdout.match(/Authentication\s*:\s*(.+)/)

          if (ssidMatch) {
            const ssid = ssidMatch[1].trim()

            // Validate SSID is not a BSSID
            const bssidPattern =
              /^[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}$/
            if (!bssidPattern.test(ssid)) {
              const auth = authMatch ? authMatch[1].trim() : "WPA2-Personal"

              networks.push({
                ssid,
                signal: ssid === currentSSID ? 85 : 60,
                security: parseWindowsSecurity(auth, ""),
                connected: ssid === currentSSID,
              })

              console.log(`Added valid profile: ${ssid} (connected: ${ssid === currentSSID})`)
            } else {
              console.log(`Skipped BSSID profile: ${ssid}`)
            }
          }
        } catch (profileError) {
          console.log(`Failed to get details for profile "${profileName}" Error : ` + profileError)
        }
      }
    }

    return networks
  } catch (error) {
    console.log("Profile scan failed:", error)
    throw error
  }
}

function parseNetshNetworksImproved(output: string, currentSSID: string | null): WiFiNetwork[] {
  const networks: WiFiNetwork[] = []
  const lines = output.split("\n").map((line) => line.trim())

  let currentNetwork: Partial<WiFiNetwork> = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Look for SSID (not BSSID)
    const ssidMatch = line.match(/SSID\s+\d+\s*:\s*(.+)/)
    if (ssidMatch) {
      // Save previous network if it exists and is valid
      if (currentNetwork.ssid) {
        const bssidPattern =
          /^[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}$/
        if (!bssidPattern.test(currentNetwork.ssid)) {
          networks.push({
            ssid: currentNetwork.ssid,
            signal: currentNetwork.signal || 50,
            security: currentNetwork.security || "wpa2",
            connected: currentNetwork.ssid === currentSSID,
          })
        }
      }

      // Start new network - validate SSID
      const extractedSSID = ssidMatch[1].trim()
      const bssidPattern = /^[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}$/

      if (!bssidPattern.test(extractedSSID)) {
        currentNetwork = { ssid: extractedSSID }
        console.log("Found valid SSID:", extractedSSID)
      } else {
        console.log("Skipping BSSID:", extractedSSID)
        currentNetwork = {}
      }
      continue
    }

    // Look for authentication
    const authMatch = line.match(/Authentication\s*:\s*(.+)/)
    if (authMatch && currentNetwork.ssid) {
      currentNetwork.security = parseWindowsSecurity(authMatch[1].trim(), "")
      continue
    }

    // Look for signal strength in BSSID entries (but don't use BSSID as SSID)
    const bssidMatch = line.match(/BSSID\s+\d+\s*:\s*([a-fA-F0-9:]{17})/)
    if (bssidMatch && currentNetwork.ssid) {
      // Look for signal in next line
      if (i + 1 < lines.length) {
        const signalMatch = lines[i + 1].match(/Signal\s*:\s*(\d+)%/)
        if (signalMatch) {
          currentNetwork.signal = Number.parseInt(signalMatch[1])
        }
      }
      continue
    }
  }

  // Don't forget the last network
  if (currentNetwork.ssid) {
    const bssidPattern = /^[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}$/
    if (!bssidPattern.test(currentNetwork.ssid)) {
      networks.push({
        ssid: currentNetwork.ssid,
        signal: currentNetwork.signal || 50,
        security: currentNetwork.security || "wpa2",
        connected: currentNetwork.ssid === currentSSID,
      })
    }
  }

  console.log(`Parsed ${networks.length} valid networks from detailed netsh output`)
  networks.forEach((n) => console.log(`  - ${n.ssid} (${n.signal}%, ${n.security}, connected: ${n.connected})`))

  return networks
}

function parseBasicNetshNetworksImproved(output: string, currentSSID: string | null): WiFiNetwork[] {
  const networks: WiFiNetwork[] = []
  const lines = output.split("\n")

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Look for SSID lines
    const ssidMatch = line.match(/SSID\s+\d+\s*:\s*(.+)/)
    if (ssidMatch) {
      const ssid = ssidMatch[1].trim()

      if (!ssid || ssid === "") continue

      // Validate SSID is not a BSSID
      const bssidPattern = /^[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}$/
      if (bssidPattern.test(ssid)) {
        console.log("Skipping BSSID in basic scan:", ssid)
        continue
      }

      // Look for network details in the next few lines
      let authentication = "WPA2-Personal"
      let encryption = "AES"

      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const nextLine = lines[j].trim()

        if (nextLine.includes("Authentication")) {
          authentication = nextLine.split(":")[1]?.trim() || authentication
        }
        if (nextLine.includes("Encryption")) {
          encryption = nextLine.split(":")[1]?.trim() || encryption
        }

        // Stop if we hit another SSID
        if (nextLine.includes("SSID") && nextLine !== line) break
      }

      networks.push({
        ssid,
        signal: ssid === currentSSID ? 85 : Math.floor(Math.random() * 40) + 40,
        security: parseWindowsSecurity(authentication, encryption),
        connected: ssid === currentSSID,
      })

      console.log(`Added valid network: ${ssid} (connected: ${ssid === currentSSID})`)
    }
  }

  console.log(`Parsed ${networks.length} valid networks from basic netsh output`)
  return networks
}

function parseIwlistOutput(output: string): WiFiNetwork[] {
  const networks: WiFiNetwork[] = []
  const blocks = output.split("Cell ")

  for (const block of blocks) {
    const ssidMatch = block.match(/ESSID:"(.+)"/)
    const qualityMatch = block.match(/Quality=(\d+)\/(\d+)/)
    const encryptionMatch = block.match(/Encryption key:(on|off)/)

    if (ssidMatch) {
      const ssid = ssidMatch[1].trim()
      if (!ssid) continue

      const quality = qualityMatch ? (Number.parseInt(qualityMatch[1]) / Number.parseInt(qualityMatch[2])) * 100 : 50
      const hasEncryption = encryptionMatch?.[1] === "on"

      networks.push({
        ssid,
        signal: Math.round(quality),
        security: hasEncryption ? "wpa2" : "open",
        connected: false,
      })
    }
  }

  return networks
}

function parseSecurityType(security: string): string {
  if (!security) return "open"

  const securityLower = security.toLowerCase()
  if (securityLower.includes("wpa3")) return "wpa3"
  if (securityLower.includes("wpa2") || securityLower.includes("wpa-psk")) return "wpa2"
  if (securityLower.includes("wpa")) return "wpa"
  if (securityLower.includes("wep")) return "wep"
  if (securityLower.includes("none") || securityLower.includes("open")) return "open"

  return "wpa2" // Default assumption
}

function parseWindowsSecurity(auth: string, encryption: string): string {
  const authLower = auth.toLowerCase()
  const encryptionLower = encryption.toLowerCase()

  if (authLower.includes("wpa3")) return "wpa3"
  if (authLower.includes("wpa2") || authLower.includes("wpa2-personal")) return "wpa2"
  if (authLower.includes("wpa")) return "wpa"
  if (authLower.includes("wep") || encryptionLower.includes("wep")) return "wep"
  if (authLower.includes("open") || encryptionLower.includes("none") || authLower.includes("none")) return "open"

  return "wpa2" // Default assumption
}

function rssiToPercentage(rssi: number): number {
  // Convert RSSI to percentage (typical range: -100 to -30 dBm)
  return Math.max(0, Math.min(100, (rssi + 100) * 1.43))
}
