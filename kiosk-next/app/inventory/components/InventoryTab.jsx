"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Clock, Package, Filter, Search, X, RefreshCcw } from "lucide-react"
import { collection, query, where, orderBy, limit, startAfter, getDocs } from "firebase/firestore"
import { db } from "../../firebaseConfig"

// Constants
const ITEMS_PER_PAGE = 10

export default function InventoryTab({ selectedBatch, loading, recentUpdates }) {
  const [inventoryData, setInventoryData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    eggSize: "all",
    dateRange: "today",
    sortBy: "newest",
  })
  const [highlightedRows, setHighlightedRows] = useState([])

  // Fetch inventory data when selectedBatch changes
  useEffect(() => {
    if (!selectedBatch) return

    const fetchInventoryData = async () => {
      setLoadingData(true)
      setError(null)

      try {
        // Build query
        const inventoryRef = collection(db, "egg_inventory")
        let inventoryQuery = query(
          inventoryRef,
          where("batch_id", "==", selectedBatch.id),
          orderBy("timestamp", filters.sortBy === "newest" ? "desc" : "asc"),
          limit(ITEMS_PER_PAGE),
        )

        // Apply egg size filter if not "all"
        if (filters.eggSize !== "all") {
          inventoryQuery = query(
            inventoryRef,
            where("batch_id", "==", selectedBatch.id),
            where("egg_size", "==", filters.eggSize),
            orderBy("timestamp", filters.sortBy === "newest" ? "desc" : "asc"),
            limit(ITEMS_PER_PAGE),
          )
        }

        // Apply date range filter
        if (filters.dateRange !== "all") {
          const now = new Date()
          let startDate

          if (filters.dateRange === "today") {
            startDate = new Date(now.setHours(0, 0, 0, 0))
          } else if (filters.dateRange === "week") {
            startDate = new Date(now)
            startDate.setDate(startDate.getDate() - 7)
          } else if (filters.dateRange === "month") {
            startDate = new Date(now)
            startDate.setMonth(startDate.getMonth() - 1)
          }

          inventoryQuery = query(
            inventoryRef,
            where("batch_id", "==", selectedBatch.id),
            where("timestamp", ">=", startDate.toISOString()),
            orderBy("timestamp", filters.sortBy === "newest" ? "desc" : "asc"),
            limit(ITEMS_PER_PAGE),
          )

          // Apply egg size filter with date range
          if (filters.eggSize !== "all") {
            inventoryQuery = query(
              inventoryRef,
              where("batch_id", "==", selectedBatch.id),
              where("egg_size", "==", filters.eggSize),
              where("timestamp", ">=", startDate.toISOString()),
              orderBy("timestamp", filters.sortBy === "newest" ? "desc" : "asc"),
              limit(ITEMS_PER_PAGE),
            )
          }
        }

        // Execute query
        const snapshot = await getDocs(inventoryQuery)
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Update state
        setInventoryData(data)
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null)
        setHasMore(snapshot.docs.length === ITEMS_PER_PAGE)

        // Get total count
        const countQuery = query(inventoryRef, where("batch_id", "==", selectedBatch.id))

        // This is a simplified approach - in a real app, you'd use a more efficient
        // method to get the count, like a separate counter document
        const countSnapshot = await getDocs(countQuery)
        setTotalItems(countSnapshot.size)
      } catch (err) {
        console.error("Error fetching inventory data:", err)
        setError("Failed to load inventory data")
      } finally {
        setLoadingData(false)
      }
    }

    fetchInventoryData()
  }, [selectedBatch, filters])

  // Highlight newly added rows
  useEffect(() => {
    if (recentUpdates.length > 0) {
      const newIds = recentUpdates.map((update) => update.id)
      setHighlightedRows(newIds)

      // Remove highlight after animation
      const timer = setTimeout(() => {
        setHighlightedRows([])
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [recentUpdates])

  // Handle page change
  const handlePageChange = async (newPage) => {
    if (newPage < 1 || (newPage > currentPage && !hasMore)) return

    setCurrentPage(newPage)

    if (newPage === 1) {
      // First page - use the initial query
      // This will be handled by the useEffect when filters change
      return
    }

    // Load next page
    setLoadingData(true)

    try {
      // Build query with startAfter
      const inventoryRef = collection(db, "egg_inventory")
      const nextPageQuery = query(
        inventoryRef,
        where("batch_id", "==", selectedBatch.id),
        orderBy("timestamp", filters.sortBy === "newest" ? "desc" : "asc"),
        startAfter(lastVisible),
        limit(ITEMS_PER_PAGE),
      )

      // Apply filters
      // (Similar logic as in the useEffect, but with startAfter)

      // Execute query
      const snapshot = await getDocs(nextPageQuery)
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Update state
      setInventoryData(data)
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null)
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE)
    } catch (err) {
      console.error("Error fetching next page:", err)
      setError("Failed to load more data")
    } finally {
      setLoadingData(false)
    }
  }

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
    setLastVisible(null)
  }

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    // Client-side filtering by egg size or ID
    // In a real app, you'd implement server-side search
    console.log("Search query:", searchQuery)
  }

  if (loading || loadingData) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0e5f97] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading inventory data...</p>
      </div>
    )
  }

  if (!selectedBatch) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center">
        <p className="text-gray-600">Please select a batch to view inventory data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Search by egg size or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e5f97]"
                />
              </form>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={() => {
                  setFilters({
                    eggSize: "all",
                    dateRange: "today",
                    sortBy: "newest",
                  })
                  setCurrentPage(1)
                  setLastVisible(null)
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
              <button
                onClick={() => setShowFilters(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Egg Size</label>
                  <select
                    value={filters.eggSize}
                    onChange={(e) => handleFilterChange({ eggSize: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="all">All Sizes</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="xlarge">Extra Large</option>
                    <option value="jumbo">Jumbo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange({ dateRange: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Clock className="w-4 h-4" />
                    Timestamp
                  </div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Package className="w-4 h-4" />
                    Egg Size
                  </div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">Count</div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">Grader ID</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventoryData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No inventory data found matching your criteria
                  </td>
                </tr>
              ) : (
                inventoryData.map((item) => {
                  const isHighlighted = highlightedRows.includes(item.id)

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isHighlighted ? "bg-blue-50 animate-pulse" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{new Date(item.timestamp).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <EggSizeBadge size={item.egg_size} />
                      </td>
                      <td className="px-6 py-4 font-medium">{item.count}</td>
                      <td className="px-6 py-4 text-gray-500">{item.grader_id || "System"}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{" "}
              {totalItems} items
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border transition-colors
                  ${
                    currentPage === 1
                      ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(totalItems / ITEMS_PER_PAGE)) }, (_, i) => {
                  const pageNumber = i + 1
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors
                        ${currentPage === pageNumber ? "bg-[#0e5f97] text-white" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      {pageNumber}
                    </button>
                  )
                })}
                {Math.ceil(totalItems / ITEMS_PER_PAGE) > 5 && <span className="px-2">...</span>}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasMore}
                className={`p-2 rounded-lg border transition-colors
                  ${
                    !hasMore ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EggSizeBadge({ size }) {
  // Define colors and labels for different egg sizes
  const sizeConfig = {
    small: {
      label: "Small",
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      borderColor: "border-blue-200",
    },
    medium: {
      label: "Medium",
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      borderColor: "border-green-200",
    },
    large: {
      label: "Large",
      bgColor: "bg-amber-100",
      textColor: "text-amber-800",
      borderColor: "border-amber-200",
    },
    xlarge: {
      label: "Extra Large",
      bgColor: "bg-purple-100",
      textColor: "text-purple-800",
      borderColor: "border-purple-200",
    },
    jumbo: {
      label: "Jumbo",
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      borderColor: "border-red-200",
    },
  }

  // Default config for unknown sizes
  const config = sizeConfig[size?.toLowerCase()] || {
    label: size || "Unknown",
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
    borderColor: "border-gray-200",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium
      ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      {config.label}
    </span>
  )
}

