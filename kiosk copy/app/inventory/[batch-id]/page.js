"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Package, Egg, Droplet, Sun, CloudMoon } from "lucide-react"

export default function BatchDetails({ params }) {
  const router = useRouter()
  const { batchId } = params
  const [batchData, setBatchData] = useState(null)

  useEffect(() => {
    // Simulating API call to fetch batch data
    // Replace this with your actual API call
    const fetchBatchData = async () => {
      // Simulated data
      const data = {
        id: batchId,
        batchNumber: `B00${batchId}`,
        date: "2023-06-20",
        status: "Completed",
        totalEggs: 750,
        sortingTime: "2 hours 15 minutes",
        eggCounts: {
          small: 150,
          medium: 250,
          large: 200,
          xl: 100,
          jumbo: 50,
        },
        defectCounts: {
          good: 680,
          cracked: 25,
          dirty: 35,
          darkSpots: 10,
        },
      }
      setBatchData(data)
    }

    fetchBatchData()
  }, [batchId])

  if (!batchData) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/inventory" className="text-[#0e5f97] hover:text-[#0e4772] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-[#0e5f97]">Batch Details</h1>
          <div className="w-6 h-6" /> {/* Placeholder for symmetry */}
        </header>

        {/* Batch Information */}
        <div className="bg-[#fcfcfd] rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Package className="w-8 h-8 text-[#0e5f97] mr-2" />
            <h2 className="text-xl font-semibold text-[#0e5f97]">{batchData.batchNumber}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#171717]/60">Date</p>
              <p className="font-medium">{batchData.date}</p>
            </div>
            <div>
              <p className="text-sm text-[#171717]/60">Status</p>
              <p className="font-medium">{batchData.status}</p>
            </div>
            <div>
              <p className="text-sm text-[#171717]/60">Total Eggs</p>
              <p className="font-medium">{batchData.totalEggs}</p>
            </div>
            <div>
              <p className="text-sm text-[#171717]/60">Sorting Time</p>
              <p className="font-medium">{batchData.sortingTime}</p>
            </div>
          </div>
        </div>

        {/* Egg Counts */}
        <div className="bg-[#fcfcfd] rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#0e5f97] mb-4">Egg Counts by Size</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(batchData.eggCounts).map(([size, count]) => (
              <div key={size} className="bg-[#ecb662] rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-[#171717] capitalize">{size}</p>
                <p className="text-2xl font-bold text-[#0e5f97]">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Defect Counts */}
        <div className="bg-[#fcfcfd] rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#0e5f97] mb-4">Egg Quality Counts</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-green-100 rounded-lg p-4 text-center">
              <Egg className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium text-[#171717]">Good Eggs</p>
              <p className="text-2xl font-bold text-green-600">{batchData.defectCounts.good}</p>
            </div>
            <div className="bg-red-100 rounded-lg p-4 text-center">
              <Droplet className="w-6 h-6 mx-auto mb-2 text-red-600" />
              <p className="text-sm font-medium text-[#171717]">Cracked Eggs</p>
              <p className="text-2xl font-bold text-red-600">{batchData.defectCounts.cracked}</p>
            </div>
            <div className="bg-yellow-100 rounded-lg p-4 text-center">
              <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
              <p className="text-sm font-medium text-[#171717]">Dirty Eggs</p>
              <p className="text-2xl font-bold text-yellow-600">{batchData.defectCounts.dirty}</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <CloudMoon className="w-6 h-6 mx-auto mb-2 text-gray-600" />
              <p className="text-sm font-medium text-[#171717]">Dark Spots</p>
              <p className="text-2xl font-bold text-gray-600">{batchData.defectCounts.darkSpots}</p>
            </div>
          </div>
        </div>

        {/* Analytics Placeholder */}
        <div className="bg-[#fcfcfd] rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#0e5f97] mb-4">Analytics</h3>
          <p className="text-[#171717]/60">Detailed analytics would be displayed here.</p>
        </div>

        {/* System Status */}
        <div className="mt-6 bg-[#fcfcfd] rounded-lg p-4 shadow-md">
          <div className="text-sm text-center text-[#171717]/60">
            System Status: <span className="text-[#0e5f97] font-medium">Online - Batch Details</span>
          </div>
        </div>
      </div>
    </div>
  )
}

