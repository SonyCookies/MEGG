import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import os from "os"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { ssid } = await request.json()

    if (!ssid) {
      return NextResponse.json({ error: "SSID is required" }, { status: 400 })
    }

    console.log(`Attempting to disconnect from: ${ssid}`)
    const platform = os.platform()
    let success = false

    switch (platform) {
      case "linux":
        success = await disconnectLinux(ssid)
        break
      case "darwin": // macOS
        success = await disconnectMacOS(ssid)
        break
      case "win32": // Windows
        success = await disconnectWindows(ssid)
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    if (success) {
      console.log(`Successfully disconnected from: ${ssid}`)
      return NextResponse.json({ success: true })
    } else {
      throw new Error("Disconnect failed")
    }
  } catch (error) {
    console.error("WiFi disconnect error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Disconnect failed",
      },
      { status: 500 },
    )
  }
}

async function disconnectLinux(ssid: string): Promise<boolean> {
  try {
    // Disconnect using nmcli
    await execAsync(`nmcli con down "${ssid}"`)

    // Alternative: disconnect all WiFi
    await execAsync("nmcli radio wifi off")
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await execAsync("nmcli radio wifi on")

    return true
  } catch (error) {
    console.error("Linux disconnect failed:", error)
    throw error
  }
}

async function disconnectMacOS(ssid: string): Promise<boolean> {
  try {
    // Turn off WiFi and turn it back on
    console.log(ssid)
    await execAsync("networksetup -setairportpower en0 off")
    await new Promise((resolve) => setTimeout(resolve, 2000))
    await execAsync("networksetup -setairportpower en0 on")

    return true
  } catch (error) {
    console.error("macOS disconnect failed:", error)
    throw error
  }
}

async function disconnectWindows(ssid: string): Promise<boolean> {
  try {
    // Disconnect from the specific network
    console.log(ssid)
    await execAsync(`netsh wlan disconnect`)

    return true
  } catch (error) {
    console.error("Windows disconnect failed:", error)
    throw error
  }
}
