import {
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  CheckSquare,
  Archive,
  BarChart2,
} from "lucide-react";

export default function BatchInfo({ batch, onCompleteBatch }) {
  if (!batch) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get defect type icon and color
  const getDefectTypeStyles = (type) => {
    switch (type.toLowerCase()) {
      case "good":
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          borderColor: "border-green-200",
        };
      case "dirty":
        return {
          icon: <AlertCircle className="w-4 h-4 text-yellow-500" />,
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-700",
          borderColor: "border-yellow-200",
        };
      case "broken":
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-500" />,
          bgColor: "bg-red-100",
          textColor: "text-red-700",
          borderColor: "border-red-200",
        };
      case "cracked":
        return {
          icon: <AlertCircle className="w-4 h-4 text-orange-500" />,
          bgColor: "bg-orange-100",
          textColor: "text-orange-700",
          borderColor: "border-orange-200",
        };
      default:
        return {
          icon: <CheckSquare className="w-4 h-4 text-blue-500" />,
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
          borderColor: "border-blue-200",
        };
    }
  };

  // Calculate percentage for each defect type
  const calculatePercentage = (count) => {
    if (batch.total_count === 0) return 0;
    return Math.round((count / batch.total_count) * 100);
  };

  return (
    <div className="bg-gradient-to-br from-white to-[#f8fafc] rounded-xl shadow-md p-5 mb-4 border border-[#e2e8f0]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-[#0e5f97]/10 flex items-center justify-center mr-3">
            <BarChart2 className="w-5 h-5 text-[#0e5f97]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0e5f97]">
              Batch {batch.batch_number}
            </h3>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              <span>{formatDate(batch.created_at)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onCompleteBatch}
          className="flex items-center gap-1 text-sm bg-gradient-to-r from-[#0e5f97] to-[#0e4772] text-white px-3 py-2 rounded-lg hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <Archive className="w-4 h-4" />
          <span>Complete</span>
        </button>
      </div>

      {batch.notes && (
        <div className="mb-4 p-3 bg-[#f0f4f8] rounded-lg border border-[#e2e8f0]">
          <div className="flex items-start">
            <FileText className="w-4 h-4 mr-2 mt-0.5 text-[#0e5f97]" />
            <div>
              <span className="text-xs font-medium text-gray-500">NOTES</span>
              <p className="text-sm text-gray-700">{batch.notes}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Total eggs processed
          </span>
          <span className="text-lg font-bold text-[#0e5f97]">
            {batch.total_count}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
            style={{ width: "100%" }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(batch.defect_counts).map(([type, count]) => {
          const { icon, bgColor, textColor, borderColor } =
            getDefectTypeStyles(type);
          const percentage = calculatePercentage(count);

          return (
            <div
              key={type}
              className={`${bgColor} ${borderColor} border rounded-lg p-3 transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  {icon}
                  <span
                    className={`ml-1 text-xs font-semibold ${textColor} capitalize`}
                  >
                    {type}
                  </span>
                </div>
                <span className={`text-xs font-medium ${textColor}`}>
                  {percentage}%
                </span>
              </div>
              <div className="flex items-end justify-between">
                <span className={`text-lg font-bold ${textColor}`}>
                  {count}
                </span>
                <div className="h-8 w-full max-w-[60px]">
                  <div className="h-full bg-white/50 rounded-sm relative overflow-hidden">
                    <div
                      className={`absolute bottom-0 left-0 right-0 ${bgColor} bg-opacity-70`}
                      style={{ height: `${Math.max(percentage, 5)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
