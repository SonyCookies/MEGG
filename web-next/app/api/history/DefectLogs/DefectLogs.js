import { NextResponse } from "next/server"
import { getDefectLogs, getFilteredDefectLogs, getBatchNumbers, getDefectTypes } from "../../../lib/history/DefectLogHistory"

// GET /api/defect-logs
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    // Check if we need to filter
    const defectType = searchParams.get("defectType")
    const date = searchParams.get("date")
    const batchNumber = searchParams.get("batchNumber")
    const searchQuery = searchParams.get("searchQuery")

    if (defectType || date || batchNumber || searchQuery) {
      const filters = {
        defectType: defectType || "All Types",
        date: date || "",
        batchNumber: batchNumber || "All Batches",
        searchQuery: searchQuery || "",
      }

      const filteredLogs = await getFilteredDefectLogs(filters)
      return NextResponse.json({ logs: filteredLogs })
    } else {
      const logs = await getDefectLogs()
      return NextResponse.json({ logs })
    }
  } catch (error) {
    console.error("Error in GET /api/defect-logs:", error)
    return NextResponse.json({ error: "Failed to fetch defect logs" }, { status: 500 })
  }
}

// GET /api/batch-numbers
export async function getBatchNumbersHandler(request) {
  try {
    const batchNumbers = await getBatchNumbers()
    return NextResponse.json({ batchNumbers })
  } catch (error) {
    console.error("Error in GET /api/batch-numbers:", error)
    return NextResponse.json({ error: "Failed to fetch batch numbers" }, { status: 500 })
  }
}

// GET /api/defect-types
export async function getDefectTypesHandler(request) {
  try {
    const defectTypes = await getDefectTypes()
    return NextResponse.json({ defectTypes })
  } catch (error) {
    console.error("Error in GET /api/defect-types:", error)
    return NextResponse.json({ error: "Failed to fetch defect types" }, { status: 500 })
  }
}

