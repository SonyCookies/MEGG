import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"

export default function SortingHistory() {
  const sortingHistoryData = [
    { id: 1, date: "2023-06-20", batchNumber: "B001", small: 50, medium: 100, large: 80, xl: 30, jumbo: 10 },
    { id: 2, date: "2023-06-19", batchNumber: "B002", small: 40, medium: 90, large: 70, xl: 35, jumbo: 15 },
    { id: 3, date: "2023-06-18", batchNumber: "B003", small: 55, medium: 110, large: 75, xl: 25, jumbo: 5 },
    { id: 4, date: "2023-06-17", batchNumber: "B004", small: 45, medium: 95, large: 85, xl: 20, jumbo: 20 },
    { id: 5, date: "2023-06-16", batchNumber: "B005", small: 60, medium: 105, large: 90, xl: 40, jumbo: 8 },
  ]

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/home" className="text-[#0e5f97] hover:text-[#0e4772] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-[#0e5f97]">Sorting History</h1>
          <div className="w-6 h-6" /> {/* Placeholder for symmetry */}
        </header>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by batch number"
              className="w-full p-2 pl-10 pr-4 border border-[#0e5f97] rounded-md"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0e5f97]" />
          </div>
        </div>

        {/* Sorting History Table */}
        <div className="bg-[#fcfcfd] rounded-xl shadow-md overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0e5f97] text-[#fcfcfd]">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Batch Number</th>
                <th className="p-2 text-left">Small</th>
                <th className="p-2 text-left">Medium</th>
                <th className="p-2 text-left">Large</th>
                <th className="p-2 text-left">XL</th>
                <th className="p-2 text-left">Jumbo</th>
              </tr>
            </thead>
            <tbody>
              {sortingHistoryData.map((item) => (
                <tr key={item.id} className="border-b border-[#ecb662]">
                  <td className="p-2">{item.date}</td>
                  <td className="p-2">{item.batchNumber}</td>
                  <td className="p-2">{item.small}</td>
                  <td className="p-2">{item.medium}</td>
                  <td className="p-2">{item.large}</td>
                  <td className="p-2">{item.xl}</td>
                  <td className="p-2">{item.jumbo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* System Status */}
        <div className="mt-6 bg-[#fcfcfd] rounded-lg p-4 shadow-md">
          <div className="text-sm text-center text-[#171717]/60">
            System Status: <span className="text-[#0e5f97] font-medium">Online - Viewing Sorting History</span>
          </div>
        </div>
      </div>
    </div>
  )
}

