"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, getDocs, addDoc, doc, updateDoc, orderBy } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import { logger } from "../utils"

const log = logger("useBatchManagement")

// Helper function to generate a batch number with sequential numbering
const generateBatchNumber = (existingBatches) => {
  const now = new Date()
  const datePrefix = `B${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`

  // Find batches with the same date prefix
  const todaysBatches = existingBatches.filter(
    (batch) => batch.batch_number && batch.batch_number.startsWith(datePrefix),
  )

  // Find the highest sequence number
  let highestSequence = 0
  todaysBatches.forEach((batch) => {
    const sequencePart = batch.batch_number.split("-")[1]
    if (sequencePart) {
      const sequence = Number.parseInt(sequencePart, 10)
      if (!isNaN(sequence) && sequence > highestSequence) {
        highestSequence = sequence
      }
    }
  })

  // Generate the next sequence number
  const nextSequence = highestSequence + 1
  const sequenceFormatted = String(nextSequence).padStart(4, "0")

  return `${datePrefix}-${sequenceFormatted}`
}

// Create a new batch with the proper structure
const createNewBatch = (machineId, batchNumber) => {
  return {
    machine_id: machineId,
    batch_number: batchNumber,
    status: "active",
    total_count: 0,
    defect_counts: {
      good: 0,
      dirty: 0,
      broken: 0,
      cracked: 0,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export default function useBatchManagement(machineId) {
  const [batches, setBatches] = useState([])
  const [currentBatch, setCurrentBatch] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all batches for this machine (not just active ones)
  const fetchBatches = useCallback(async () => {
    if (!machineId) {
      setError("Machine ID is required to fetch batches")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // Query for all batches for this machine, ordered by creation date (newest first)
      // Removed the status filter to get all batches regardless of status
      const batchesQuery = query(
        collection(db, "batches"),
        where("machine_id", "==", machineId),
        orderBy("created_at", "desc"),
      )

      const querySnapshot = await getDocs(batchesQuery)
      const batchList = []

      querySnapshot.forEach((doc) => {
        const batchData = doc.data()

        // Handle both old and new batch structures
        // If batch_number doesn't exist, generate one from the timestamp
        if (!batchData.batch_number) {
          const date = new Date(batchData.created_at)
          batchData.batch_number = `B${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-0001`
          log(`Generated batch_number for existing batch: ${batchData.batch_number}`)
        }

        batchList.push({ id: doc.id, ...batchData })
      })

      log(`Fetched ${batchList.length} batches for machine ${machineId}`)
      setBatches(batchList)

      // If there's at least one active batch, set the most recent one as current
      const activeBatches = batchList.filter((batch) => batch.status === "active")
      if (activeBatches.length > 0) {
        log(`Setting current batch to: ${activeBatches[0].batch_number}`)
        setCurrentBatch(activeBatches[0])
      } else {
        log("No active batches found")
      }

      setIsLoading(false)
    } catch (err) {
      log(`Error fetching batches: ${err.message}`)
      setError(`Failed to fetch batches: ${err.message}`)
      setIsLoading(false)
    }
  }, [machineId])

  // Create a new batch
  const createBatch = useCallback(
    async (notes = "") => {
      if (!machineId) {
        setError("Machine ID is required to create a batch")
        return null
      }

      try {
        // Generate a sequential batch number based on existing batches
        const batchNumber = generateBatchNumber(batches)
        const newBatchData = createNewBatch(machineId, batchNumber)

        if (notes) {
          newBatchData.notes = notes
        }

        log(`Creating new batch with number: ${newBatchData.batch_number}`)

        const docRef = await addDoc(collection(db, "batches"), newBatchData)
        const batchWithId = { ...newBatchData, id: docRef.id }

        log(`Created new batch: ${batchWithId.batch_number} with ID: ${docRef.id}`)

        setBatches((prev) => [batchWithId, ...prev])
        setCurrentBatch(batchWithId)

        return batchWithId
      } catch (err) {
        log(`Error creating batch: ${err.message}`)
        setError(`Failed to create batch: ${err.message}`)
        return null
      }
    },
    [machineId, batches],
  )

  // Select an existing batch
  const selectBatch = useCallback(
    (batchId) => {
      const selected = batches.find((batch) => batch.id === batchId)
      if (selected) {
        // If the batch is not active, reactivate it
        if (selected.status !== "active") {
          log(`Reactivating batch: ${selected.batch_number}`)
          const batchRef = doc(db, "batches", selected.id)
          updateDoc(batchRef, {
            status: "active",
            updated_at: new Date().toISOString(),
          })
            .then(() => {
              // Update the batch in the local state
              const updatedBatch = { ...selected, status: "active", updated_at: new Date().toISOString() }
              setBatches((prev) => prev.map((b) => (b.id === selected.id ? updatedBatch : b)))
              setCurrentBatch(updatedBatch)
            })
            .catch((err) => {
              log(`Error reactivating batch: ${err.message}`)
              setError(`Failed to reactivate batch: ${err.message}`)
            })
        } else {
          setCurrentBatch(selected)
        }

        log(`Selected batch: ${selected.batch_number}`)
        return true
      }
      setError(`Batch with ID ${batchId} not found`)
      return false
    },
    [batches],
  )

  // Update batch counts
  const updateBatchCounts = useCallback(
    async (defectType) => {
      if (!currentBatch) return

      try {
        // Update local state first for immediate feedback
        const updatedBatch = {
          ...currentBatch,
          total_count: currentBatch.total_count + 1,
          defect_counts: {
            ...currentBatch.defect_counts,
            [defectType]: currentBatch.defect_counts[defectType] + 1,
          },
          updated_at: new Date().toISOString(),
        }

        setCurrentBatch(updatedBatch)

        // Make sure we're using the document ID, not the batch_number
        const batchRef = doc(db, "batches", currentBatch.id)

        log(`Updating batch with ID: ${currentBatch.id}`)

        await updateDoc(batchRef, {
          total_count: updatedBatch.total_count,
          [`defect_counts.${defectType}`]: updatedBatch.defect_counts[defectType],
          updated_at: updatedBatch.updated_at,
        })

        // Update in the batches array
        setBatches((prev) => prev.map((batch) => (batch.id === currentBatch.id ? updatedBatch : batch)))

        log(`Successfully updated batch counts for ${defectType}`)
      } catch (err) {
        log(`Error updating batch counts: ${err.message}`)
        setError(`Failed to update batch: ${err.message}`)

        // Log more details to help debug
        if (currentBatch) {
          log(`Current batch details - ID: ${currentBatch.id}, Number: ${currentBatch.batch_number}`)
        }
      }
    },
    [currentBatch],
  )

  // Complete a batch
  const completeBatch = useCallback(async () => {
    if (!currentBatch) return false

    try {
      const batchRef = doc(db, "batches", currentBatch.id)
      await updateDoc(batchRef, {
        status: "completed",
        updated_at: new Date().toISOString(),
      })

      // Update the batch in the local state
      const updatedBatch = { ...currentBatch, status: "completed", updated_at: new Date().toISOString() }
      setBatches((prev) => prev.map((batch) => (batch.id === currentBatch.id ? updatedBatch : batch)))
      setCurrentBatch(null)

      log(`Completed batch: ${currentBatch.batch_number}`)
      return true
    } catch (err) {
      log(`Error completing batch: ${err.message}`)
      setError(`Failed to complete batch: ${err.message}`)
      return false
    }
  }, [currentBatch])

  // Load batches when machineId is available
  useEffect(() => {
    if (machineId) {
      fetchBatches()
    }
  }, [machineId, fetchBatches])

  return {
    batches,
    currentBatch,
    isLoading,
    error,
    fetchBatches,
    createBatch,
    selectBatch,
    updateBatchCounts,
    completeBatch,
  }
}
