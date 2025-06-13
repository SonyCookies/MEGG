import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import os from "os"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { ssid, password } = await request.json()

    if (!ssid) {
      return NextResponse.json({ error: "SSID is required" }, { status: 400 })
    }

    console.log(`Attempting to connect to: ${ssid}`)
    const platform = os.platform()
    let success = false

    switch (platform) {
      case "linux":
        success = await connectLinux(ssid, password)
        break
      case "darwin": // macOS
        success = await connectMacOS(ssid, password)
        break
      case "win32": // Windows
        success = await connectWindowsSimplified(ssid, password)
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    if (success) {
      console.log(`Successfully connected to: ${ssid}`)
      return NextResponse.json({ success: true })
    } else {
      throw new Error("Connection failed")
    }
  } catch (error) {
    console.error("WiFi connect error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      },
      { status: 500 },
    )
  }
}

async function connectLinux(ssid: string, password?: string): Promise<boolean> {
  try {
    // Try nmcli first
    const command = password
      ? `nmcli dev wifi connect "${ssid}" password "${password}"`
      : `nmcli dev wifi connect "${ssid}"`

    const { stdout, stderr } = await execAsync(command)

    if (stderr && !stderr.includes("successfully") && !stdout.includes("successfully")) {
      throw new Error(stderr || "Connection failed")
    }

    // Verify connection
    await new Promise((resolve) => setTimeout(resolve, 3000)) // Wait 3 seconds
    const { stdout: statusStdout } = await execAsync("nmcli -t -f ACTIVE,SSID dev wifi list")
    const isConnected = statusStdout.includes(`yes:${ssid}`)

    return isConnected
  } catch (error) {
    console.error("nmcli connection failed:", error)
    throw error
  }
}

async function connectMacOS(ssid: string, password?: string): Promise<boolean> {
  try {
    const command = password
      ? `networksetup -setairportnetwork en0 "${ssid}" "${password}"`
      : `networksetup -setairportnetwork en0 "${ssid}"`

    const { stderr } = await execAsync(command)

    if (stderr) {
      throw new Error(stderr)
    }

    // Verify connection
    await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5 seconds
    const { stdout: statusStdout } = await execAsync(
      "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I",
    )
    const currentSSID = statusStdout.match(/\s+SSID: (.+)/)?.[1]?.trim()

    return currentSSID === ssid
  } catch (error) {
    console.error("macOS connection failed:", error)
    throw error
  }
}

async function connectWindowsSimplified(ssid: string, password?: string): Promise<boolean> {
  console.log(`=== Windows WiFi Connection (Simplified): ${ssid} ===`)

  // Try connection methods that don't require profile creation
  const connectionMethods = [
    () => tryExistingProfile(ssid),
    () => tryDirectConnection(ssid),
    () => tryOpenNetworkConnection(ssid, password),
    () => tryUserGuidance(ssid, password),
  ]

  for (const [index, method] of connectionMethods.entries()) {
    try {
      console.log(`--- Trying method ${index + 1} ---`)
      const success = await method()
      if (success) {
        console.log(`Method ${index + 1} succeeded!`)
        return true
      }
    } catch (error) {
      console.log(`Method ${index + 1} failed:`, error)
    }
  }

  // If all methods fail, provide helpful guidance
  throw new Error(
    `Unable to connect to "${ssid}" automatically. Please connect manually through Windows Settings: Settings > Network & Internet > Wi-Fi > Show available networks > Select "${ssid}" and enter password if required.`,
  )
}

async function tryExistingProfile(ssid: string): Promise<boolean> {
  console.log("Checking for existing profile...")

  try {
    // Check if profile already exists
    const { stdout: profilesStdout } = await execAsync("netsh wlan show profiles")
    console.log("Available profiles:", profilesStdout)

    if (profilesStdout.includes(ssid)) {
      console.log(`Profile for "${ssid}" already exists, attempting connection...`)

      // Try to connect using existing profile
      const { stdout, stderr } = await execAsync(`netsh wlan connect name="${ssid}"`)
      console.log("Connection output:", stdout)

      if (stderr && stderr.toLowerCase().includes("error")) {
        throw new Error(stderr)
      }

      // Wait and verify
      await new Promise((resolve) => setTimeout(resolve, 8000))
      return await verifyConnection(ssid)
    } else {
      throw new Error("No existing profile found")
    }
  } catch (error) {
    console.log("Existing profile method failed:", error)
    throw error
  }
}

async function tryDirectConnection(ssid: string): Promise<boolean> {
  console.log("Trying direct connection...")

  try {
    // Try direct connection command
    const { stdout, stderr } = await execAsync(`netsh wlan connect name="${ssid}"`)
    console.log("Direct connection output:", stdout)

    if (stderr && stderr.toLowerCase().includes("error")) {
      throw new Error(stderr)
    }

    // Check if the command was successful
    if (stdout.toLowerCase().includes("connection request was completed successfully")) {
      await new Promise((resolve) => setTimeout(resolve, 8000))
      return await verifyConnection(ssid)
    } else {
      throw new Error("Direct connection command did not indicate success")
    }
  } catch (error) {
    console.log("Direct connection failed:", error)
    throw error
  }
}

async function tryOpenNetworkConnection(ssid: string, password?: string): Promise<boolean> {
  console.log("Checking if this is an open network...")

  try {
    // If no password provided, this might be an open network
    if (!password) {
      console.log("No password provided, treating as open network")

      // Try to connect to open network
      const { stdout } = await execAsync(`netsh wlan connect name="${ssid}"`)
      console.log("Open network connection output:", stdout)

      if (stdout.toLowerCase().includes("connection request was completed successfully")) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        return await verifyConnection(ssid)
      }
    }

    throw new Error("Not an open network or connection failed")
  } catch (error) {
    console.log("Open network connection failed:", error)
    throw error
  }
}

async function tryUserGuidance(ssid: string, password?: string): Promise<boolean> {
  console.log("Providing user guidance for manual connection...")

  // This method doesn't actually connect, but provides guidance
  // We'll return false to indicate automatic connection failed
  const guidanceMessage = password
    ? `To connect to "${ssid}": 1) Open Windows Settings, 2) Go to Network & Internet > Wi-Fi, 3) Click "Show available networks", 4) Select "${ssid}", 5) Enter password: ${password}`
    : `To connect to "${ssid}": 1) Open Windows Settings, 2) Go to Network & Internet > Wi-Fi, 3) Click "Show available networks", 4) Select "${ssid}"`

  console.log("User guidance:", guidanceMessage)

  // Check if user might have connected manually during our attempts
  await new Promise((resolve) => setTimeout(resolve, 3000))
  return await verifyConnection(ssid)
}

async function verifyConnection(ssid: string): Promise<boolean> {
  try {
    console.log(`Verifying connection to: ${ssid}`)
    const { stdout } = await execAsync("netsh wlan show interfaces")
    console.log("Current interface status:")
    console.log(stdout)

    // Parse the output to check connection
    const lines = stdout.split("\n")
    let isConnected = false
    let currentSSID = null

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Check connection state
      if (trimmedLine.toLowerCase().includes("state") && trimmedLine.toLowerCase().includes("connected")) {
        isConnected = true
        console.log("WiFi adapter is connected")
      }

      // Extract current SSID
      const ssidMatch = trimmedLine.match(/^SSID\s*:\s*(.+)$/i)
      if (ssidMatch) {
        currentSSID = ssidMatch[1].trim()
        console.log(`Current SSID: ${currentSSID}`)
      }
    }

    const success = isConnected && currentSSID === ssid
    console.log(`Connection verification result:`)
    console.log(`- WiFi Connected: ${isConnected}`)
    console.log(`- Current SSID: ${currentSSID}`)
    console.log(`- Target SSID: ${ssid}`)
    console.log(`- Match: ${success}`)

    return success
  } catch (error) {
    console.error("Connection verification failed:", error)
    return false
  }
}
