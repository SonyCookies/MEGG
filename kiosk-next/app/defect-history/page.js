import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"

export default function DefectHistory() {
  const defectHistoryData = [
    { id: 1, date: "2023-06-20", batchNumber: "B001", defectType: "Crack", quantity: 5 },
    { id: 2, date: "2023-06-19", batchNumber: "B002", defectType: "Dirt", quantity: 3 },
    { id: 3, date: "2023-06-18", batchNumber: "B003", defectType: "Deformity", quantity: 2 },
    { id: 4, date: "2023-06-17", batchNumber: "B004", defectType: "Crack", quantity: 4 },
    { id: 5, date: "2023-06-16", batchNumber: "B005", defectType: "Dirt", quantity: 1 },
  ]

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/home" className="text-[#0e5f97] hover:text-[#0e4772] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-[#0e5f97]">Defect History</h1>
          <div className="w-6 h-6" /> {/* Placeholder for symmetry */}
        </header>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by batch number or defect type"
              className="w-full p-2 pl-10 pr-4 border border-[#0e5f97] rounded-md"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0e5f97]" />
          </div>
        </div>

        {/* Defect History Table */}
        <div className="bg-[#fcfcfd] rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0e5f97] text-[#fcfcfd]">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Batch Number</th>
                <th className="p-2 text-left">Defect Type</th>
                <th className="p-2 text-left">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {defectHistoryData.map((item) => (
                <tr key={item.id} className="border-b border-[#ecb662]">
                  <td className="p-2">{item.date}</td>
                  <td className="p-2">{item.batchNumber}</td>
                  <td className="p-2">{item.defectType}</td>
                  <td className="p-2">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* System Status */}
        <div className="mt-6 bg-[#fcfcfd] rounded-lg p-4 shadow-md">
          <div className="text-sm text-center text-[#171717]/60">
            System Status: <span className="text-[#0e5f97] font-medium">Online - Viewing History</span>
          </div>
        </div>
      </div>
    </div>
  )
}

