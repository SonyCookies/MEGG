"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { db, storage } from "../../firebaseConfig"
import { collection, query, orderBy, limit, startAfter, getDocs } from "firebase/firestore"
import { ref, getDownloadURL } from "firebase/storage"
import {
  Loader2,
  Search,
  Filter,
  Download,
  Calendar,
  Package2,
  AlertTriangle,
  Target,
  ImageIcon,
  X,
  ChevronDown,
} from "lucide-react"

// Constants
const ITEMS_PER_PAGE = 12

// Defect type styles
const defectStyles = {
  good: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    badge: "bg-emerald-500",
    icon: "✓",
  },
  dirty: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-500",
    icon: "!",
  },
  cracked: {
    bg: "bg-red-50",
    text: "text-red-700",
    badge: "bg-red-500",
    icon: "⚠",
  },
  bloodspots: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    badge: "bg-rose-500",
    icon: "⚠",
  },
  default: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    badge: "bg-gray-500",
    icon: "?",
  },
}

const getDefectStyle = (type) => {
  const normalizedType = type?.toLowerCase().trim() || ""
  return defectStyles[normalizedType] || defectStyles.default
}

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

// Image component with loading state
const ImageWithLoader = ({ src, alt, onClick, className }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <AlertTriangle className="h-6 w-6 text-gray-400" />
        </div>
      ) : (
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className={className}
          onClick={onClick}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setError(true)
          }}
          style={{ display: isLoading ? "none" : "block" }}
        />
      )}
    </div>
  )
}

export default function ImagesTab() {
  // Refs for tracking mounted state and image cache
  const isMounted = useRef(true)
  const imageCache = useRef(new Map())

  // State
  const [images, setImages] = useState([])
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    defectType: "all",
    date: "",
    batchNumber: "",
    sortBy: "newest",
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Fetch image URL with caching
  const fetchImageUrl = useCallback(async (path) => {
    try {
      // Check memory cache first
      if (imageCache.current.has(path)) {
        return imageCache.current.get(path)
      }

      const imageRef = ref(storage, path)
      const url = await getDownloadURL(imageRef)

      // Update cache only if component is still mounted
      if (isMounted.current) {
        imageCache.current.set(path, url)
      }

      return url
    } catch (error) {
      console.error("Error fetching image URL:", error)
      return null
    }
  }, [])

  // Process images data
  const processImages = useCallback(
    async (docs) => {
      const processedImages = docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        path: `images/${doc.data().batch_number}/${doc.data().image_id}`,
        imageUrl: null,
      }))

      // Fetch all image URLs in parallel
      const imagePromises = processedImages.map(async (image) => {
        const url = await fetchImageUrl(image.path)
        return { ...image, imageUrl: url }
      })

      const imagesWithUrls = await Promise.all(imagePromises)
      return imagesWithUrls
    },
    [fetchImageUrl],
  )

  // Fetch images from Firestore
  const fetchImages = useCallback(
    async (lastDoc = null) => {
      try {
        const imagesRef = collection(db, "defect_logs")
        let q = query(imagesRef, orderBy("timestamp", "desc"), limit(ITEMS_PER_PAGE))

        if (lastDoc) {
          q = query(imagesRef, orderBy("timestamp", "desc"), startAfter(lastDoc), limit(ITEMS_PER_PAGE))
        }

        const snapshot = await getDocs(q)
        const processedImages = await processImages(snapshot.docs)

        if (isMounted.current) {
          setLastVisible(snapshot.docs[snapshot.docs.length - 1])
          setHasMore(snapshot.docs.length === ITEMS_PER_PAGE)
        }

        return processedImages
      } catch (error) {
        throw new Error("Failed to fetch images")
      }
    },
    [processImages],
  )

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        const initialImages = await fetchImages()

        if (isMounted.current) {
          setImages(initialImages)
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message)
        }
      } finally {
        if (isMounted.current) {
          setLoading(false)
        }
      }
    }

    loadInitialData()
  }, [fetchImages])

  // Load more
  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return

    try {
      setLoadingMore(true)
      const newImages = await fetchImages(lastVisible)

      if (isMounted.current) {
        setImages((prev) => [...prev, ...newImages])
      }
    } catch (err) {
      if (isMounted.current) {
        setError("Failed to load more images")
      }
    } finally {
      if (isMounted.current) {
        setLoadingMore(false)
      }
    }
  }

  // Filter images
  const filteredImages = images.filter((image) => {
    const matchesSearch =
      searchQuery === "" ||
      image.batch_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.defect_type.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType =
      filters.defectType === "all" || image.defect_type.toLowerCase() === filters.defectType.toLowerCase()

    const matchesDate = !filters.date || new Date(image.timestamp).toISOString().split("T")[0] === filters.date

    const matchesBatch = !filters.batchNumber || image.batch_number === filters.batchNumber

    return matchesSearch && matchesType && matchesDate && matchesBatch
  })

  // Sort images
  const sortedImages = [...filteredImages].sort((a, b) => {
    if (filters.sortBy === "newest") {
      return new Date(b.timestamp) - new Date(a.timestamp)
    }
    return new Date(a.timestamp) - new Date(b.timestamp)
  })

  // Export data
  const handleExport = () => {
    const csvData = [
      ["Timestamp", "Batch Number", "Defect Type", "Confidence Score", "Image URL"],
      ...filteredImages.map((image) => [
        formatDate(image.timestamp),
        image.batch_number,
        image.defect_type,
        (image.confidence_score * 100).toFixed(1) + "%",
        image.imageUrl || "Not available",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvData], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `defect-images-${new Date().toISOString()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-medium">Error loading images</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[#0e4772] flex items-center gap-2">
          <ImageIcon className="w-6 h-6" />
          Image Gallery
        </h2>
        <p className="text-gray-500">View and analyze defect detection images</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by batch number or defect type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e5f97]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Defect Type</label>
              <select
                value={filters.defectType}
                onChange={(e) => setFilters((prev) => ({ ...prev, defectType: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Types</option>
                <option value="good">Good</option>
                <option value="dirty">Dirty</option>
                <option value="cracked">Cracked</option>
                <option value="bloodspots">Bloodspots</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
              <select
                value={filters.batchNumber}
                onChange={(e) => setFilters((prev) => ({ ...prev, batchNumber: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Batches</option>
                {[...new Set(images.map((img) => img.batch_number))].map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#0e5f97]" />
        </div>
      ) : sortedImages.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No images found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedImages.map((image) => {
            const style = getDefectStyle(image.defect_type)
            return (
              <div
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 border border-gray-200"
              >
                <ImageWithLoader
                  src={image.imageUrl || "/placeholder.svg"}
                  alt={`${image.defect_type} defect`}
                  onClick={() => setSelectedImage(image)}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                />

                {/* Defect Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <div className={`${style.badge} px-3 py-1 rounded-full text-white text-sm font-medium shadow-lg`}>
                    <span className="mr-1">{style.icon}</span>
                    {image.defect_type}
                  </div>
                </div>

                {/* Info Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package2 className="h-4 w-4" />
                        <span>{image.batch_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(image.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span>{(image.confidence_score * 100).toFixed(1)}% confidence</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-4 py-2 bg-[#0e5f97] text-white rounded-lg hover:bg-[#0e4772] disabled:bg-gray-300 disabled:cursor-not-allowed"
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

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="relative max-w-4xl w-full bg-white rounded-xl overflow-hidden">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative aspect-video">
              <ImageWithLoader
                src={selectedImage.imageUrl || "/placeholder.svg"}
                alt={`${selectedImage.defect_type} defect`}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Batch Number</p>
                  <p className="font-medium">{selectedImage.batch_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Defect Type</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getDefectStyle(selectedImage.defect_type).badge}`} />
                    <p className="font-medium">{selectedImage.defect_type}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Confidence Score</p>
                  <p className="font-medium">{(selectedImage.confidence_score * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Timestamp</p>
                  <p className="font-medium">{formatDate(selectedImage.timestamp)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

