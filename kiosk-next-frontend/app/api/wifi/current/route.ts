import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import os from "os"

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    console.log("=== Getting current WiFi network ===" + request)
    const platform = os.platform()
    console.log("Platform:", platform)
    let network = null

    switch (platform) {
      case "linux":
        network = await getCurrentLinux()
        break
      case "darwin": // macOS
        network = await getCurrentMacOS()
        break
      case "win32": // Windows
        network = await getCurrentWindows()
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    console.log("=== Final current network result ===", network)
    return NextResponse.json({ network })
  } catch (error) {
    console.error("Get current network error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get current network",
        network: null,
      },
      { status: 500 },
    )
  }
}

async function getCurrentLinux() {
  try {
    console.log("--- Linux: Getting current network ---")

    // First try to get the active connection
    const { stdout: connectionStdout } = await execAsync("nmcli -t -f NAME,TYPE,DEVICE connection show --active")
    console.log("Active connections output:", connectionStdout)

    const wifiConnection = connectionStdout
      .split("\n")
      .find((line) => line.includes("wifi") || line.includes("wireless"))

    if (!wifiConnection) {
      console.log("No active WiFi connection found in nmcli")
      return null
    }

    console.log("Found WiFi connection:", wifiConnection)

    // Get detailed info about the active connection
    const { stdout } = await execAsync("nmcli -t -f ACTIVE,SSID,SIGNAL,SECURITY dev wifi list")
    console.log("WiFi list output:", stdout)

    const activeConnection = stdout.split("\n").find((line) => line.startsWith("yes:"))
    console.log("Active connection line:", activeConnection)

    if (!activeConnection) {
      console.log("No active connection found in wifi list")
      return null
    }

    const [, ssid, signal, security] = activeConnection.split(":")
    console.log("Parsed - SSID:", ssid, "Signal:", signal, "Security:", security)

    const result = {
      ssid: ssid.trim(),
      signal: Number.parseInt(signal) || 0,
      security: parseSecurityType(security),
      connected: true,
    }

    console.log("Linux current network result:", result)
    return result
  } catch (error) {
    console.error("Linux getCurrentNetwork failed:", error)
    return null
  }
}

async function getCurrentMacOS() {
  try {
    console.log("--- macOS: Getting current network ---")

    const { stdout } = await execAsync(
      "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I",
    )
    console.log("macOS airport output:", stdout)

    const ssidMatch = stdout.match(/\s+SSID: (.+)/)
    const rssiMatch = stdout.match(/\s+agrCtlRSSI: (-?\d+)/)
    const stateMatch = stdout.match(/\s+state: (.+)/)

    console.log("SSID match:", ssidMatch)
    console.log("State match:", stateMatch)

    if (!ssidMatch) {
      console.log("No SSID found in macOS output")
      return null
    }

    const ssid = ssidMatch[1].trim()
    const state = stateMatch ? stateMatch[1].trim() : ""

    console.log("Parsed SSID:", ssid, "State:", state)

    // Check if actually connected
    if (state.toLowerCase() !== "running") {
      console.log("macOS WiFi state is not running:", state)
      return null
    }

    const rssi = rssiMatch ? Number.parseInt(rssiMatch[1]) : -50

    const result = {
      ssid,
      signal: rssiToPercentage(rssi),
      security: "wpa2", // Default assumption
      connected: true,
    }

    console.log("macOS current network result:", result)
    return result
  } catch (error) {
    console.error("macOS getCurrentNetwork failed:", error)
    return null
  }
}

async function getCurrentWindows() {
  try {
    console.log("--- Windows: Getting current network ---")

    // Try the basic interface command first
    const { stdout } = await execAsync("netsh wlan show interfaces")
    console.log("Windows netsh interfaces output:")
    console.log(stdout)

    // Parse the output more carefully
    const lines = stdout.split("\n").map((line) => line.trim())
    let currentSSID = null
    let currentSignal = 50
    let currentAuth = "WPA2-Personal"
    let isConnected = false

    for (const line of lines) {
      console.log("Processing line:", line)

      // Check connection state
      if (line.toLowerCase().includes("state") && line.toLowerCase().includes("connected")) {
        isConnected = true
        console.log("WiFi is connected!")
      }

      // Extract SSID - be more specific about the pattern
      const ssidMatch = line.match(/^\s*SSID\s*:\s*(.+)$/i)
      if (ssidMatch) {
        currentSSID = ssidMatch[1].trim()
        console.log("Found SSID:", currentSSID)
      }

      // Extract signal strength
      const signalMatch = line.match(/^\s*Signal\s*:\s*(\d+)%/i)
      if (signalMatch) {
        currentSignal = Number.parseInt(signalMatch[1])
        console.log("Found signal:", currentSignal)
      }

      // Extract authentication
      const authMatch = line.match(/^\s*Authentication\s*:\s*(.+)$/i)
      if (authMatch) {
        currentAuth = authMatch[1].trim()
        console.log("Found auth:", currentAuth)
      }
    }

    console.log("Final parsing results:")
    console.log("- SSID:", currentSSID)
    console.log("- Connected:", isConnected)
    console.log("- Signal:", currentSignal)
    console.log("- Auth:", currentAuth)

    if (!currentSSID || !isConnected) {
      console.log("No connected WiFi found - SSID:", currentSSID, "Connected:", isConnected)
      return null
    }

    // Validate SSID is not a BSSID (MAC address)
    const bssidPattern = /^[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}$/
    if (bssidPattern.test(currentSSID)) {
      console.log("Detected BSSID instead of SSID, trying alternative method")
      return await getCurrentWindowsAlternative()
    }

    const result = {
      ssid: currentSSID,
      signal: currentSignal,
      security: parseSecurityType(currentAuth),
      connected: true,
    }

    console.log("Windows current network result:", result)
    return result
  } catch (error) {
    console.error("Windows getCurrentNetwork failed:", error)
    return await getCurrentWindowsAlternative()
  }
}

async function getCurrentWindowsAlternative() {
  console.log("--- Windows: Trying alternative method ---")

  try {
    // Try PowerShell to get current WiFi connection
    const { stdout } = await execAsync(
      `powershell -Command "Get-NetConnectionProfile | Where-Object {$_.InterfaceAlias -like '*Wi-Fi*'} | Select-Object Name, InterfaceAlias, NetworkCategory"`,
    )
    console.log("PowerShell connection profile output:", stdout)

    if (stdout && stdout.includes("Name")) {
      const lines = stdout.split("\n")
      for (const line of lines) {
        // Look for the network name line
        const nameMatch = line.match(/^(.+?)\s+Wi-Fi/i)
        if (nameMatch) {
          const networkName = nameMatch[1].trim()
          console.log("Found network name via PowerShell:", networkName)

          // Validate it's not a BSSID
          const bssidPattern =
            /^[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}$/
          if (!bssidPattern.test(networkName) && networkName !== "Name") {
            return {
              ssid: networkName,
              signal: 75,
              security: "wpa2",
              connected: true,
            }
          }
        }
      }
    }

    // Try another PowerShell approach
    const { stdout: wifiStdout } = await execAsync(
      `powershell -Command "(Get-NetAdapter | Where-Object {$_.InterfaceDescription -like '*Wi-Fi*'}).Name"`,
    )
    console.log("WiFi adapter name:", wifiStdout.trim())

    if (wifiStdout.trim()) {
      // Try to get the profile name
      const { stdout: profileStdout } = await execAsync(
        `powershell -Command "netsh wlan show interfaces | Select-String 'SSID'"`,
      )
      console.log("Profile SSID output:", profileStdout)

      const ssidMatch = profileStdout.match(/SSID\s*:\s*(.+)/i)
      if (ssidMatch) {
        const ssid = ssidMatch[1].trim()
        const bssidPattern =
          /^[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}:[a-fA-F0-9]{2}$/

        if (!bssidPattern.test(ssid)) {
          return {
            ssid,
            signal: 75,
            security: "wpa2",
            connected: true,
          }
        }
      }
    }
  } catch (error) {
    console.log("Alternative method failed:", error)
  }

  console.log("All Windows current network methods failed")
  return null
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

function rssiToPercentage(rssi: number): number {
  // Convert RSSI to percentage (typical range: -100 to -30 dBm)
  return Math.max(0, Math.min(100, (rssi + 100) * 1.43))
}
