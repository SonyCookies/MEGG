// This file can be used if you're using Next.js API routes
// Place this in pages/api/statistics.js or app/api/statistics/route.js depending on your Next.js version

import { calculateStatistics } from "../../../lib/history/Statistics"

// For Pages Router (Next.js)
export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const timeFilter = req.query.timeFilter || "24h"
      const stats = await calculateStatistics(timeFilter)
      res.status(200).json(stats)
    } catch (error) {
      console.error("Error fetching statistics:", error)
      res.status(500).json({ error: "Failed to fetch statistics" })
    }
  } else {
    res.setHeader("Allow", ["GET"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

// For App Router (Next.js 13+)
// Uncomment this if you're using App Router
/*
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeFilter = searchParams.get('timeFilter') || '24h';
    
    const stats = await calculateStatistics(timeFilter);
    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch statistics' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
*/

