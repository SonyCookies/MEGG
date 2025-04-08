// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\detection\hooks\useMachineId.js

"use client"

import { useState, useCallback, useEffect } from "react"

const logger = (message) => {
  console.log(`[useMachineId] ${new Date().toISOString()}: ${message}`)
}

export default function useMachineId(setErrorMessage) {
  const [machineId, setMachineId] = useState(null)
  const [machineIdStatus, setMachineIdStatus] = useState("loading")

  const fetchMachineId = useCallback(async () => {
    try {
      setMachineIdStatus("loading")
      const response = await fetch("/api/auth/session")
      if (response.ok) {
        const data = await response.json()
        if (data.machineId) {
          setMachineId(data.machineId)
          setMachineIdStatus("available")
          logger(`Machine ID fetched: ${data.machineId}`)
        } else {
          setMachineId(null)
          setMachineIdStatus("unavailable")
          logger("Machine ID not found in session data")
          setErrorMessage("Machine ID not found. Please log in again.")
        }
      } else {
        setMachineId(null)
        setMachineIdStatus("error")
        logger("Failed to fetch machine ID from session")
        setErrorMessage("Failed to fetch machine ID. Please check your authentication.")
      }
    } catch (error) {
      setMachineId(null)
      setMachineIdStatus("error")
      logger(`Error fetching machine ID: ${error.message}`)
      setErrorMessage(`Error fetching machine ID: ${error.message}`)
    }
  }, [setErrorMessage])

  useEffect(() => {
    fetchMachineId()
  }, [fetchMachineId])

  return {
    machineId,
    machineIdStatus,
    fetchMachineId,
  }
}

