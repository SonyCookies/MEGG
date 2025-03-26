"use client"

import { useState, useRef, useEffect } from "react"
import {
  Search,
  SlidersHorizontal,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  Package,
} from "lucide-react"
import {
  getDefectLogs,
  getFilteredDefectLogs,
  getBatchNumbers,
  getDefectTypes,
  exportDefectLogs,
} from "../../../../../lib/history/DefectLogHistory"

export default function DefectLog() {
  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(6)
  const [showRowsDropdown, setShowRowsDropdown] = useState(false)
  const rowsDropdownRef = useRef(null)

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [defectType, setDefectType] = useState("All Types")
  const [date, setDate] = useState("")
  const [batchNumber, setBatchNumber] = useState("All Batches")
  const [sortBy, setSortBy] = useState("Newest First")

  // Data state
  const [defectLogs, setDefectLogs] = useState([])
  const [filteredAndSortedLogs, setFilteredAndSortedLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [batchOptions, setBatchOptions] = useState(["All Batches"])
  const [defectTypeOptions, setDefectTypeOptions] = useState(["All Types"])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const exportDropdownRef = useRef(null)

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)

        // Fetch defect logs
        const logs = await getDefectLogs()
        setDefectLogs(logs)

        // Fetch batch numbers for filter dropdown
        const batches = await getBatchNumbers()
        setBatchOptions(["All Batches", ...batches])

        // Fetch defect types for filter dropdown
        const types = await getDefectTypes()
        setDefectTypeOptions(["All Types", ...types])

        setLoading(false)
      } catch (error) {
        console.error("Error fetching initial data:", error)
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  // Apply filters and sorting
  useEffect(() => {
    const applyFiltersAndSort = async () => {
      try {
        // If we have search or filters, get filtered data from Firebase
        if (searchQuery !== "" || defectType !== "All Types" || date !== "" || batchNumber !== "All Batches") {
          const filters = {
            defectType,
            date,
            batchNumber,
            searchQuery,
          }

          const filteredLogs = await getFilteredDefectLogs(filters)

          // Apply sorting
          const sortedLogs = sortLogs(filteredLogs, sortBy)
          setFilteredAndSortedLogs(sortedLogs)
        } else {
          // Otherwise, just sort the existing logs
          const sortedLogs = sortLogs(defectLogs, sortBy)
          setFilteredAndSortedLogs(sortedLogs)
        }
      } catch (error) {
        console.error("Error applying filters:", error)
      }
    }

    applyFiltersAndSort()
  }, [defectLogs, searchQuery, defectType, date, batchNumber, sortBy])

  // Sort logs based on selected option
  const sortLogs = (logs, sortOption) => {
    return [...logs].sort((a, b) => {
      switch (sortOption) {
        case "Newest First":
          // Sort by timestamp and time (newest first)
          return a.timestamp === b.timestamp ? b.time.localeCompare(a.time) : b.timestamp.localeCompare(a.timestamp)

        case "Oldest First":
          // Sort by timestamp and time (oldest first)
          return a.timestamp === b.timestamp ? a.time.localeCompare(b.time) : a.timestamp.localeCompare(a.timestamp)

        case "Confidence: High to Low":
          // Sort by confidence (high to low)
          return b.confidence - a.confidence

        case "Confidence: Low to High":
          // Sort by confidence (low to high)
          return a.confidence - b.confidence

        default:
          return 0
      }
    })
  }

  // Reset to first page when search query or filters change
  useEffect(() => {
    if (
      searchQuery !== "" ||
      defectType !== "All Types" ||
      date !== "" ||
      batchNumber !== "All Batches" ||
      sortBy !== "Newest First"
    ) {
      setCurrentPage(1)
    }
  }, [searchQuery, defectType, date, batchNumber, sortBy])

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)

      // Fetch fresh data
      const logs = await getDefectLogs()
      setDefectLogs(logs)

      // Reset filters
      setSearchQuery("")
      setDefectType("All Types")
      setDate("")
      setBatchNumber("All Batches")
      setSortBy("Newest First")
      setCurrentPage(1)

      setIsRefreshing(false)
    } catch (error) {
      console.error("Error refreshing data:", error)
      setIsRefreshing(false)
    }
  }

  // Handle export
  // const handleExport = () => {
  //   exportDefectLogs(filteredAndSortedLogs)
  // }

  // Total pages calculation based on filtered logs
  const totalPages = Math.ceil(filteredAndSortedLogs.length / rowsPerPage)

  // Get current page data from filtered logs
  const indexOfLastItem = currentPage * rowsPerPage
  const indexOfFirstItem = indexOfLastItem - rowsPerPage
  const currentItems = filteredAndSortedLogs.slice(indexOfFirstItem, indexOfLastItem)

  // Handle outside click for rows dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (rowsDropdownRef.current && !rowsDropdownRef.current.contains(event.target)) {
        setShowRowsDropdown(false)
      }
    }

    if (showRowsDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showRowsDropdown])

  useEffect(() => {
    function handleClickOutside(event) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false)
      }
    }

    if (showExportDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showExportDropdown])

  // Navigation functions
  const goToFirstPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const goToLastPage = () => setCurrentPage(totalPages)

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const exportDefectLogsToCSV = (data, type) => {
    // Placeholder function for exporting defect logs
    // In a real application, this function would handle the actual export logic
    console.log(`Exporting defect logs to ${type}...`, data)
    exportDefectLogs(data)
  }

  // Update the handleExportFormat function in defect-log.js
  const handleExportFormat = (format) => {
    exportDefectLogs(filteredAndSortedLogs, format)
    setShowExportDropdown(false)
  }

  return (
    <div className="flex flex-col gap-6 bg-white border p-6 rounded-2xl shadow relative flex-1">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-medium">Defect Logs</h3>

          <p className="text-gray-500 text-sm">View and analyze inspection results</p>
        </div>
        <button
          className={`text-gray-500 hover:text-gray-700 absolute top-6 right-6 ${isRefreshing ? "animate-spin" : ""}`}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by defect type..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery("")}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="relative md:static px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 w-full"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${showFilters ? "rotate-180" : ""}`} />
            </button>
            <div className="relative" ref={exportDropdownRef}>
              <button
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2 w-full"
                onClick={() => setShowExportDropdown(!showExportDropdown)}
              >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${showExportDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showExportDropdown && (
                <div className="absolute top-full mt-2 right-0 border bg-white shadow rounded-lg overflow-hidden z-40 w-40">
                  <button
                    onClick={() => {
                      handleExportFormat("excel")
                    }}
                    className="px-4 py-2 text-sm w-full text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="text-green-600">Excel</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExportFormat("document")
                    }}
                    className="px-4 py-2 text-sm w-full text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="text-blue-600">Document</span>
                  </button>
                  {/* <button
                    onClick={() => {
                      handleExportFormat("please")
                    }}
                    className="px-4 py-2 text-sm w-full text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="text-purple-600">PLEASE</span>
                  </button> */}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-300/20 transition-all duration-150">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Defect Type</label>
              <select
                value={defectType}
                onChange={(e) => setDefectType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {defectTypeOptions.map((type, index) => (
                  <option key={index}>{type}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Batch Number</label>
              <select
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {batchOptions.map((batch, index) => (
                  <option key={index}>{batch}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option>Newest First</option>
                <option>Oldest First</option>
                <option>Confidence: High to Low</option>
                <option>Confidence: Low to High</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <RefreshCw className="w-12 h-12 mb-4 text-gray-300 animate-spin" />
            <p className="text-lg font-medium">Loading data...</p>
          </div>
        ) : filteredAndSortedLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Search className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No results found</p>
            <p className="text-sm">Try adjusting your search query or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentItems.map((log, index) => (
              <div
                key={index}
                className="flex flex-col gap-4 rounded-lg border transition-colors duration-150 hover:bg-gray-300/20 p-4"
              >
                {/* title and date */}
                <div className="flex items-center">
                  <div className="flex flex-1 flex-col gap-1">
                    <h3 className="font-medium">
                      {searchQuery ? (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: log.batchNumber.replace(
                              new RegExp(searchQuery, "gi"),
                              (match) => `<span class="bg-yellow-200">${match}</span>`,
                            ),
                          }}
                        />
                      ) : (
                        log.batchNumber
                      )}
                    </h3>
                    <span className="text-gray-500 text-xs flex items-center gap-2">
                      {log.timestamp} {log.time}
                    </span>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                    <Package className="w-5 h-5" />
                  </div>
                </div>

                {/* Defect type */}
                <div className="flex flex-col gap-1">
                  <h3 className="text-3xl font-bold text-orange-500">
                    {searchQuery ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: log.defectType.replace(
                            new RegExp(searchQuery, "gi"),
                            (match) => `<span class="bg-yellow-200">${match}</span>`,
                          ),
                        }}
                      />
                    ) : (
                      log.defectType
                    )}
                  </h3>
                </div>

                {/* confidence */}
                <div className="flex flex-col gap-1 text-xs text-gray-500">
                  Confidence Level:
                  <span className="text-green-500 flex gap-2 text-sm items-center">
                    <TrendingUp className="w-4 h-4" />
                    {log.confidence.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* pagination - only show if there are results */}
        {filteredAndSortedLogs.length > 0 && (
          <div className="flex items-center justify-between py-2">
            {/* Pagination controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border ${
                  currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border ${
                  currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-sm border rounded-lg px-4 py-2 bg-blue-50 text-blue-600">{currentPage}</div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border ${
                  currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border ${
                  currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            {/* Rows per page selector - moved to the right */}
            <div className="relative" ref={rowsDropdownRef}>
              <button
                onClick={() => setShowRowsDropdown(!showRowsDropdown)}
                className="text-sm border rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-50"
              >
                {rowsPerPage} per page
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${showRowsDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showRowsDropdown && (
                <div className="absolute bottom-full mb-2 border bg-white shadow rounded-lg overflow-hidden z-40">
                  {[6, 9, 12, 15].map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        setRowsPerPage(value)
                        setShowRowsDropdown(false)
                        setCurrentPage(1) // Reset to first page when changing rows per page
                      }}
                      className={`px-4 py-2 text-sm w-full text-left hover:bg-gray-50 ${
                        rowsPerPage === value ? "bg-blue-50 text-blue-600" : ""
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

