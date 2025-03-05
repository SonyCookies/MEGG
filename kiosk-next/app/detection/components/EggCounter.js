// D:\4TH YEAR\CAPSTONE\MEGG\kiosk-next\app\detection\components\EggCounter.js

export default function EggCounter({ defectCounts }) {
  return (
    <div className="bg-[#fcfcfd] rounded-xl shadow-md p-4">
      <h2 className="text-lg font-semibold text-[#0e5f97] mb-4">Egg Counter</h2>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(defectCounts).map(([type, count]) => (
          <div key={type} className="bg-[#f0f4f8] rounded-lg p-2 flex items-center justify-between">
            <span className="text-xs font-medium text-[#171717] capitalize">{type}</span>
            <span className="font-bold text-sm text-[#0e5f97]">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

