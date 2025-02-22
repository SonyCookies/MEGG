"use client";

import { useState, useEffect } from "react";
import { List, Clock, Package2, AlertTriangle, Target, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

const LOGS_PER_PAGE = 10;

const getDefectBadgeColors = (defectType) => {
  const type = defectType?.toLowerCase();
  switch (type) {
    case "good":
      return {
        background: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        icon: "✓",
      };
    case "dirty":
      return {
        background: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        icon: "!",
      };
    case "cracked":
      return {
        background: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: "⚠",
      };
    case "bloodspots":
      return {
        background: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        icon: "⚠",
      };
    default:
      return {
        background: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
        icon: "?",
      };
  }
};

export default function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);

  // Fetch logs for a specific page
  const fetchLogs = async (page = 1) => {
    try {
      let q;
      if (page === 1) {
        // First page query
        q = query(
          collection(db, "defect_logs"),
          orderBy("timestamp", "desc"),
          limit(LOGS_PER_PAGE)
        );

        // Get total count
        const snapshot = await getCountFromServer(collection(db, "defect_logs"));
        setTotalCount(snapshot.data().count);
      } else {
        // Subsequent pages
        if (!lastVisible) return;
        
        q = query(
          collection(db, "defect_logs"),
          orderBy("timestamp", "desc"),
          startAfter(lastVisible),
          limit(LOGS_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const newLogs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setLogs(newLogs);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(err.message);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLogs(1);
  }, []);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchLogs(newPage);
  };

  const totalPages = Math.ceil(totalCount / LOGS_PER_PAGE);

  if (error) {
    return <div className="text-red-500">Error loading logs: {error}</div>;
  }

  return (
    <div>
      {/* Header */}
      {/* <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-1 bg-[#0e5f97] rounded-full" />
        <div>
          <h2 className="text-xl font-bold">Defect Detection Log</h2>
          <p className="text-gray-600">Complete history of detected defects</p>
        </div>
      </div> */}

      {/* Table */}
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timestamp
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  <div className="flex items-center gap-2">
                    <Package2 className="h-4 w-4" />
                    Batch Number
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Defect Type
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Confidence
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                    <div className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 text-xs font-medium">
                      {log.batch_number}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const colors = getDefectBadgeColors(log.defect_type);
                      return (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium capitalize
                            ${colors.background} ${colors.text} ${colors.border}`}
                        >
                          <span className="text-xs">{colors.icon}</span>
                          {log.defect_type}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${log.confidence_score * 100}%`,
                            backgroundColor:
                              log.defect_type.toLowerCase() === "good"
                                ? "#10b981"
                                : log.confidence_score >= 0.9
                                ? "#10b981"
                                : log.confidence_score >= 0.7
                                ? "#f59e0b"
                                : "#ef4444",
                          }}
                        />
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          log.defect_type.toLowerCase() === "good"
                            ? "text-emerald-600"
                            : log.confidence_score >= 0.9
                            ? "text-emerald-600"
                            : log.confidence_score >= 0.7
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {(log.confidence_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-500">
            Showing {Math.min((currentPage - 1) * LOGS_PER_PAGE + 1, totalCount)}-
            {Math.min(currentPage * LOGS_PER_PAGE, totalCount)} of {totalCount} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`
                p-2 rounded-lg border transition-colors flex items-center justify-center
                ${
                  currentPage === 1
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                }
              `}
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`
                p-2 rounded-lg border transition-colors flex items-center justify-center
                ${
                  currentPage === 1
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                }
              `}
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`
                    w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors
                    ${
                      currentPage === i + 1
                        ? "bg-[#0e5f97] text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }
                  `}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`
                p-2 rounded-lg border transition-colors flex items-center justify-center
                ${
                  currentPage >= totalPages
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                }
              `}
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages}
              className={`
                p-2 rounded-lg border transition-colors flex items-center justify-center
                ${
                  currentPage >= totalPages
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                }
              `}
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}