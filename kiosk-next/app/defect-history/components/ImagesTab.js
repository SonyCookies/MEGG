"use client"

import { useState, useEffect, useCallback } from "react"
import { db, storage } from "../../firebaseConfig"
import { collection, query, orderBy, limit, startAfter, getDocs } from "firebase/firestore"
import { ref, getDownloadURL } from "firebase/storage"
import { Loader2 } from "lucide-react"

const IMAGES_PER_PAGE = 6

// Define color schemes for different defect types with semantic meaning
const defectColors = {
  good: {
    light: "bg-green-100",
    border: "border-green-500",
    text: "text-green-700",
    badge: "bg-green-500",
    gradient: "from-green-900/60",
  },
  dirty: {
    light: "bg-amber-100",
    border: "border-amber-500",
    text: "text-amber-700",
    badge: "bg-amber-500",
    gradient: "from-amber-900/60",
  },
  cracked: {
    light: "bg-yellow-100",
    border: "border-yellow-500",
    text: "text-yellow-700",
    badge: "bg-yellow-500",
    gradient: "from-yellow-900/60",
  },
  bloodspots: {
    light: "bg-red-100",
    border: "border-red-500",
    text: "text-red-700",
    badge: "bg-red-500",
    gradient: "from-red-900/60",
  },
  default: {
    light: "bg-gray-100",
    border: "border-gray-500",
    text: "text-gray-700",
    badge: "bg-gray-500",
    gradient: "from-gray-900/60",
  },
}

// Helper functions for consistent data handling
const getDefectColors = (defectType) => {
  const normalizedType = defectType?.toLowerCase().trim() || ""
  return defectColors[normalizedType] || defectColors.default
}

const formatDateTime = (timestamp) => {
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export default function ImagesTab() {
  const [combinedRecords, setCombinedRecords] = useState([])
  const [imageUrls, setImageUrls] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)
  // Add a flag to prevent duplicate loads
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  // Optimized image URL fetching without imageUrls dependency
  const fetchImageUrl = useCallback(
    async (storagePath) => {
      try {
        // Check cache first
        if (imageUrls[storagePath]) return imageUrls[storagePath]

        const imageRef = ref(storage, storagePath)
        const url = await getDownloadURL(imageRef)

        // Batch update image URLs to prevent multiple re-renders
        setImageUrls((prev) => {
          // If URL was already added while we were fetching, don't update
          if (prev[storagePath]) return prev
          return { ...prev, [storagePath]: url }
        })

        return url
      } catch (error) {
        console.error("Error fetching image URL:", error)
        return null
      }
    },
    [imageUrls],
  ) // Remove imageUrls dependency

  // Storage path construction
  const constructStoragePath = useCallback((batchNumber, imageId) => {
    return `images/${batchNumber}/${imageId}`
  }, [])

  // Fetch records with pagination
  const fetchCombinedRecords = useCallback(
    async (lastDoc = null) => {
      try {
        console.log("Fetching records with lastDoc:", lastDoc?.id) // Debug log

        const defectQuery = lastDoc
          ? query(
              collection(db, "defect_logs"),
              orderBy("timestamp", "desc"),
              startAfter(lastDoc),
              limit(IMAGES_PER_PAGE),
            )
          : query(collection(db, "defect_logs"), orderBy("timestamp", "desc"), limit(IMAGES_PER_PAGE))

        const defectSnapshot = await getDocs(defectQuery)
        const defectLogs = defectSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        const lastVisibleDoc = defectSnapshot.docs[defectSnapshot.docs.length - 1]
        console.log("New lastVisible doc:", lastVisibleDoc?.id) // Debug log

        const combinedResults = defectLogs.map((defectLog) => ({
          ...defectLog,
          storage_path: constructStoragePath(defectLog.batch_number, defectLog.image_id),
        }))

        return {
          records: combinedResults,
          lastVisible: lastVisibleDoc,
          hasMore: defectSnapshot.docs.length === IMAGES_PER_PAGE,
        }
      } catch (error) {
        console.error("Error fetching combined records:", error)
        throw error
      }
    },
    [constructStoragePath],
  )

  // Initial data load
  const loadInitialData = useCallback(async () => {
    if (initialLoadComplete) return // Prevent duplicate initial loads

    try {
      setLoading(true)
      setError(null)

      const { records, lastVisible: lastDoc, hasMore: hasMoreRecords } = await fetchCombinedRecords()

      setCombinedRecords(records)
      setLastVisible(lastDoc)
      setHasMore(hasMoreRecords)
      setInitialLoadComplete(true)

      // Pre-fetch images
      records.forEach((record) => {
        if (record.storage_path) {
          fetchImageUrl(record.storage_path)
        }
      })
    } catch (error) {
      console.error("Error in initial load:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [fetchCombinedRecords, fetchImageUrl, initialLoadComplete])

  // Load more data
  const loadMoreData = useCallback(async () => {
    if (!lastVisible || loadingMore) return

    try {
      setLoadingMore(true)
      console.log("Loading more with lastVisible:", lastVisible.id) // Debug log

      const { records, lastVisible: lastDoc, hasMore: hasMoreRecords } = await fetchCombinedRecords(lastVisible)

      // Append new records instead of replacing
      setCombinedRecords((prevRecords) => [...prevRecords, ...records])
      setLastVisible(lastDoc)
      setHasMore(hasMoreRecords)

      // Pre-fetch new images
      records.forEach((record) => {
        if (record.storage_path) {
          fetchImageUrl(record.storage_path)
        }
      })
    } catch (error) {
      console.error("Error loading more:", error)
      setError(error.message)
    } finally {
      setLoadingMore(false)
    }
  }, [lastVisible, loadingMore, fetchCombinedRecords, fetchImageUrl])

  // Initial load effect
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Error state
  if (error) {
    return <div className="text-red-500 p-4 text-center">Error loading images: {error}</div>
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#0e5f97]" />
      </div>
    )
  }

  // Main render
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {combinedRecords.map((record) => {
          const colors = getDefectColors(record.defect_type)
          const confidenceScore = record.confidence_score * 100
          // Remove the incorrect quality logic
          const qualityText = record.defect_type

          return (
            <div key={record.id} className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100">
              {/* Image with loading state */}
              {imageUrls[record.storage_path] ? (
                <img
                  src={imageUrls[record.storage_path] || "/placeholder.svg"}
                  alt={`${record.defect_type} defect`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg"
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              )}

              {/* Quality Indicator Badge - Now shows actual defect type */}
              <div className="absolute top-3 right-3 z-10">
                <div
                  className={`${colors.badge} px-3 py-1 rounded-full text-white text-sm font-medium capitalize shadow-lg`}
                >
                  {qualityText} {confidenceScore.toFixed(0)}%
                </div>
              </div>

              {/* Confidence Score Bar - Uses same color as defect type */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200/50">
                <div
                  className={`h-full ${colors.badge} transition-all duration-300`}
                />
              </div>

              {/* Information Overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-t ${colors.gradient} to-transparent translate-y-full transition-transform duration-300 group-hover:translate-y-0`}
              >
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <div className="space-y-3">
                    {/* Batch Number */}
                    <div>
                      <p className="text-white/70 text-sm">Batch Number</p>
                      <p className="font-medium text-base">{record.batch_number}</p>
                    </div>

                    {/* Device ID */}
                    <div>
                      <p className="text-white/70 text-sm">Device</p>
                      <p className="font-medium text-base">{record.device_id}</p>
                    </div>

                    {/* Timestamp */}
                    <div>
                      <p className="text-white/70 text-sm">Date & Time</p>
                      <p className="font-medium text-base">{formatDateTime(record.timestamp)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {combinedRecords.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">No images found</div>
      )}

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMoreData}
            disabled={loadingMore}
            className="flex items-center gap-2 rounded-lg bg-[#0e5f97] px-4 py-2 text-white transition-colors hover:bg-[#0e4772] disabled:bg-gray-300"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  )
}

