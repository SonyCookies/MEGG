"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Package, Plus, Minus, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useSearchParams } from "next/navigation"

export default function Inventory() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const action = searchParams.get("action")
  const [batchNumber, setBatchNumber] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewBatchFormOpen, setIsNewBatchFormOpen] = useState(false)
  const [eggCounts, setEggCounts] = useState({
    small: 0,
    medium: 0,
    large: 0,
    xl: 0,
    jumbo: 0,
  })

  // Mock data for existing batches
  const [batches, setBatches] = useState([
    { id: 1, batchNumber: "B001", date: "2023-06-20", status: "In Progress", totalEggs: 500 },
    { id: 2, batchNumber: "B002", date: "2023-06-19", status: "Completed", totalEggs: 750 },
    { id: 3, batchNumber: "B003", date: "2023-06-18", status: "Completed", totalEggs: 600 },
    { id: 4, batchNumber: "B004", date: "2023-06-17", status: "Completed", totalEggs: 800 },
    { id: 5, batchNumber: "B005", date: "2023-06-16", status: "Completed", totalEggs: 550 },
    { id: 6, batchNumber: "B006", date: "2023-06-15", status: "Completed", totalEggs: 700 },
  ])

  const handleCountChange = (size, change) => {
    setEggCounts((prev) => ({
      ...prev,
      [size]: Math.max(0, prev[size] + change),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Here you would typically send this data to your backend
    console.log("Submitting inventory:", { batchNumber, eggCounts })
    // After submission, you might want to redirect to the appropriate page
    if (action === "start-defect") {
      router.push(`/detection?batch=${batchNumber}`)
    } else if (action === "start-sorting") {
      router.push(`/sorting?batch=${batchNumber}`)
    }
    setIsNewBatchFormOpen(false)
  }

  const filteredBatches = batches.filter((batch) =>
    batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/home" className="text-[#0e5f97] hover:text-[#0e4772] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-[#0e5f97]">Inventory</h1>
          <div className="w-6 h-6" /> {/* Placeholder for symmetry */}
        </header>

        {/* Search and New Batch Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search batches..."
              className="w-full p-2 pl-10 border border-[#0e5f97] rounded-md"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0e5f97]" />
          </div>
          <button
            onClick={() => setIsNewBatchFormOpen(!isNewBatchFormOpen)}
            className="bg-[#0e5f97] text-[#fcfcfd] px-4 py-2 rounded-md hover:bg-[#0e4772] transition-colors flex items-center"
          >
            {isNewBatchFormOpen ? <ChevronUp className="mr-2" /> : <ChevronDown className="mr-2" />}
            {isNewBatchFormOpen ? "Close New Batch" : "New Batch"}
          </button>
        </div>

        {/* New Batch Form (Collapsible) */}
        {isNewBatchFormOpen && (
          <form onSubmit={handleSubmit} className="bg-[#fcfcfd] rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-[#0e5f97] mb-4">New Batch</h2>
            <div className="mb-6">
              <label htmlFor="batchNumber" className="block text-sm font-medium text-[#171717] mb-1">
                Batch Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="batchNumber"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full p-2 pl-10 border border-[#0e5f97] rounded-md"
                  placeholder="Enter batch number"
                  required
                />
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0e5f97]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.entries(eggCounts).map(([size, count]) => (
                <div key={size} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#171717] capitalize">{size}</span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleCountChange(size, -1)}
                      className="bg-[#ecb662] text-[#171717] p-1 rounded-md hover:bg-[#0e5f97] hover:text-[#fcfcfd] transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="mx-2 w-8 text-center">{count}</span>
                    <button
                      type="button"
                      onClick={() => handleCountChange(size, 1)}
                      className="bg-[#ecb662] text-[#171717] p-1 rounded-md hover:bg-[#0e5f97] hover:text-[#fcfcfd] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-[#0e5f97] text-[#fcfcfd] p-2 rounded-md hover:bg-[#0e4772] transition-colors"
              >
                {action === "start-defect"
                  ? "Start Defect Detection"
                  : action === "start-sorting"
                    ? "Start Sorting"
                    : "Create New Batch"}
              </button>
            </div>
          </form>
        )}

        {/* Existing Batches Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBatches.map((batch) => (
            <Link href={`/inventory/${batch.id}`} key={batch.id}>
              <div className="bg-[#fcfcfd] rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-[#0e5f97]">{batch.batchNumber}</h3>
                <p className="text-sm text-[#171717]/60">{batch.date}</p>
                <div className="flex justify-between items-center mt-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      batch.status === "Completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {batch.status}
                  </span>
                  <span className="text-sm font-medium">{batch.totalEggs} eggs</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* System Status */}
        <div className="mt-6 bg-[#fcfcfd] rounded-lg p-4 shadow-md">
          <div className="text-sm text-center text-[#171717]/60">
            System Status: <span className="text-[#0e5f97] font-medium">Online - Inventory Management</span>
          </div>
        </div>
      </div>
    </div>
  )
}
