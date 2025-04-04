import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../../config/firebaseConfig"

// Get all defect logs
export const getDefectLogs = async () => {
  try {
    const defectLogsRef = collection(db, "defect_logs")
    const snapshot = await getDocs(defectLogsRef)

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      // Convert Firestore timestamp to readable format
      const timestamp = data.timestamp ? new Date(data.timestamp) : new Date()
      const dateStr = timestamp.toLocaleDateString()
      const timeStr = timestamp.toLocaleTimeString()

      return {
        id: doc.id,
        timestamp: dateStr,
        time: timeStr,
        batchNumber: data.batch_id || "",
        defectType: data.defect_type || "",
        confidence: data.confidence_score ? Number.parseFloat(data.confidence_score) * 100 : 0,
        imageId: data.image_id || "",
        machineId: data.machine_id || "",
      }
    })
  } catch (error) {
    console.error("Error getting defect logs: ", error)
    return []
  }
}

// Get defect logs with filters
export const getFilteredDefectLogs = async (filters) => {
  try {
    const { defectType, date, batchNumber, searchQuery } = filters

    const defectLogsRef = collection(db, "defect_logs")
    const constraints = []

    // Apply filters
    if (defectType && defectType !== "All Types") {
      constraints.push(where("defect_type", "==", defectType))
    }

    if (batchNumber && batchNumber !== "All Batches") {
      constraints.push(where("batch_id", "==", batchNumber))
    }

    if (date) {
      // Convert date string to start and end of day timestamps
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)

      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)

      constraints.push(where("timestamp", ">=", startDate))
      constraints.push(where("timestamp", "<=", endDate))
    }

    // Create query with constraints
    const q = constraints.length > 0 ? query(defectLogsRef, ...constraints) : query(defectLogsRef)

    const snapshot = await getDocs(q)

    let results = snapshot.docs.map((doc) => {
      const data = doc.data()
      // Convert Firestore timestamp to readable format
      const timestamp = data.timestamp ? new Date(data.timestamp) : new Date()
      const dateStr = timestamp.toLocaleDateString()
      const timeStr = timestamp.toLocaleTimeString()

      return {
        id: doc.id,
        timestamp: dateStr,
        time: timeStr,
        batchNumber: data.batch_id || "",
        defectType: data.defect_type || "",
        confidence: data.confidence_score ? Number.parseFloat(data.confidence_score) * 100 : 0,
        imageId: data.image_id || "",
        machineId: data.machine_id || "",
      }
    })

    // Apply search query filter client-side
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (log) => log.batchNumber.toLowerCase().includes(query) || log.defectType.toLowerCase().includes(query),
      )
    }

    return results
  } catch (error) {
    console.error("Error getting filtered defect logs: ", error)
    return []
  }
}

// Get unique batch numbers for filter dropdown
export const getBatchNumbers = async () => {
  try {
    const batchesRef = collection(db, "batches")
    const snapshot = await getDocs(batchesRef)

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return data.batch_number || ""
    })
  } catch (error) {
    console.error("Error getting batch numbers: ", error)
    return []
  }
}

// Get unique defect types for filter dropdown
export const getDefectTypes = async () => {
  try {
    // Get unique defect types from defect_logs collection
    const defectLogsRef = collection(db, "defect_logs")
    const snapshot = await getDocs(defectLogsRef)

    const defectTypesSet = new Set()
    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.defect_type) {
        defectTypesSet.add(data.defect_type)
      }
    })

    return Array.from(defectTypesSet)
  } catch (error) {
    console.error("Error getting defect types: ", error)
    return []
  }
}

// Export defect logs to different formats
export const exportDefectLogs = async (filteredLogs, format = "excel") => {
  try {
    // Create data for export
    const headers = ["Date", "Time", "Batch Number", "Defect Type", "Confidence (%)"]
    const rows = filteredLogs.map((log) => [
      log.timestamp,
      log.time,
      log.batchNumber,
      log.defectType,
      log.confidence.toFixed(1),
    ])

    const timestamp = new Date().toISOString().split("T")[0]

    switch (format) {
      case "excel":
        // Export to Excel (CSV format)
        let csvContent = headers.join(",") + "\n"
        rows.forEach((row) => {
          csvContent += row.join(",") + "\n"
        })

        const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const csvUrl = URL.createObjectURL(csvBlob)
        const csvLink = document.createElement("a")
        csvLink.setAttribute("href", csvUrl)
        csvLink.setAttribute("download", `defect-logs-export-${timestamp}.csv`)
        csvLink.style.visibility = "hidden"
        document.body.appendChild(csvLink)
        csvLink.click()
        document.body.removeChild(csvLink)
        break

      case "document":
        // Export to Document (HTML format that can be opened in Word)
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Defect Logs Export</title>
            <style>
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; }
              th { background-color: #f2f2f2; text-align: left; }
              tr:nth-child(even) { background-color: #f9f9f9; }
            </style>
          </head>
          <body>
            <h1>Defect Logs Export</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <table>
              <thead>
                <tr>
                  ${headers.map((header) => `<th>${header}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${rows
                  .map(
                    (row) => `
                  <tr>
                    ${row.map((cell) => `<td>${cell}</td>`).join("")}
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </body>
          </html>
        `

        const htmlBlob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" })
        const htmlUrl = URL.createObjectURL(htmlBlob)
        const htmlLink = document.createElement("a")
        htmlLink.setAttribute("href", htmlUrl)
        htmlLink.setAttribute("download", `defect-logs-export-${timestamp}.html`)
        htmlLink.style.visibility = "hidden"
        document.body.appendChild(htmlLink)
        htmlLink.click()
        document.body.removeChild(htmlLink)
        break

      case "please":
        // Export to PLEASE format (JSON format)
        const jsonData = {
          exportDate: new Date().toISOString(),
          exportType: "PLEASE",
          headers: headers,
          data: filteredLogs.map((log) => ({
            date: log.timestamp,
            time: log.time,
            batchNumber: log.batchNumber,
            defectType: log.defectType,
            confidence: log.confidence,
          })),
        }

        const jsonContent = JSON.stringify(jsonData, null, 2)
        const jsonBlob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
        const jsonUrl = URL.createObjectURL(jsonBlob)
        const jsonLink = document.createElement("a")
        jsonLink.setAttribute("href", jsonUrl)
        jsonLink.setAttribute("download", `defect-logs-export-${timestamp}.json`)
        jsonLink.style.visibility = "hidden"
        document.body.appendChild(jsonLink)
        jsonLink.click()
        document.body.removeChild(jsonLink)
        break

      default:
        console.error("Unknown export format:", format)
    }
  } catch (error) {
    console.error("Error exporting defect logs:", error)
  }
}

