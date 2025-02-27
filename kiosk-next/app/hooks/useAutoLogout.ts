// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\hooks\useAutoLogout.ts

"use client"

import { useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { addAccessLog } from "../utils/logging"

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"]

export function useAutoLogout(enabled: boolean, timeoutMinutes: number) {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const logoutChannel = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    logoutChannel.current = new BroadcastChannel("auto_logout_channel")

    return () => {
      logoutChannel.current?.close()
    }
  }, [])

  const handleLogout = useCallback(
    async (reason = "auto_logout") => {
      try {
        const sessionResponse = await fetch("/api/auth/session")
        const sessionData = await sessionResponse.json()
        const machineId = sessionData.machineId

        if (machineId) {
          await addAccessLog({
            action: "logout",
            status: "success",
            details: `Auto-logout due to ${reason}`,
          },machineId,
          )
        }

        logoutChannel.current?.postMessage({ type: "auto_logout", reason })

        await fetch("/api/auth/logout", { method: "POST" })

        router.push("/login")
      } catch (error) {
        console.error("Error during auto-logout:", error)
      }
    },
    [router],
  )

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (enabled && timeoutMinutes > 0) {
      timeoutRef.current = setTimeout(
        () => {
          handleLogout("inactivity")
        },
        timeoutMinutes * 60 * 1000,
      )
    }
  }, [enabled, timeoutMinutes, handleLogout])

  useEffect(() => {
    if (!enabled) return

    const handleActivity = () => {
      resetTimer()
    }

    const handleLogoutMessage = (event: MessageEvent) => {
      if (event.data.type === "auto_logout") {
        router.push("/login")
      }
    }

    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity)
    })

    logoutChannel.current?.addEventListener("message", handleLogoutMessage)

    resetTimer()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })

      logoutChannel.current?.removeEventListener("message", handleLogoutMessage)
    }
  }, [enabled, resetTimer, router])

  return { handleLogout }
}

