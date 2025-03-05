import {
  fetchDefectLogs,
  getDefectDistribution,
  getDailyDefectData,
  getMonthlyDefectData,
  getDefectStats,
  getTotalDefectData,
} from "../../lib/api"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const timeFrame = searchParams.get("timeFrame") || "daily"

  try {
    let data

    switch (type) {
      case "all":
        data = await fetchDefectLogs()
        break
      case "distribution":
        data = await getDefectDistribution()
        break
      case "daily":
        data = await getDailyDefectData()
        break
      case "monthly":
        data = await getMonthlyDefectData()
        break
      case "stats":
        data = await getDefectStats()
        break
      case "total":
        data = await getTotalDefectData(timeFrame)
        break
      default:
        return new Response(JSON.stringify({ error: "Invalid type parameter" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("API Error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

