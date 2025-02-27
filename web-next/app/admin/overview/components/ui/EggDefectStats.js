import { EggDefectDonutChart } from "./EggDefectDonutChart";
import { StatItem } from "./StatItem";

export function EggDefectStats() {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="grid grid-cols-2 gap-6 w-full">
        <div className="col-span-1 bg-blue-500 text-white p-6 rounded-2xl shadow flex flex-col gap-4">
          <h3 className="text-3xl font-semibold">100</h3>
          <span className="text-gray-50 text-sm">Total Eggs Inspected</span>
        </div>
        <div className="col-span-1 bg-green-400 text-white p-6 rounded-2xl shadow flex flex-col gap-4">
          <h3 className="text-3xl font-semibold">25</h3>
          <span className="text-gray-50 text-sm">Avg. Eggs /hr</span>
        </div>
        <div className="col-span-1 bg-purple-400 text-white p-6 rounded-2xl shadow flex flex-col gap-4">
          <h3 className="text-3xl font-semibold">99.99%</h3>
          <span className="text-gray-50 text-sm">Defect Rate</span>
        </div>
        <div className="col-span-1 bg-yellow-400 text-white p-6 rounded-2xl shadow flex flex-col gap-4">
          <h3 className="text-3xl font-semibold">Cracked</h3>
          <span className="text-gray-50 text-sm">Most Common Defect</span>
        </div>
      </div>

      {/* Egg Distribution Doughnut Chart Placeholder */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border shadow">
        <div className="flex flex-col gap-6">
          <h3 className="text-xl font-medium">Egg Defect Distribution</h3>
        </div>

        <div className="size-72">
          <EggDefectDonutChart />
        </div>

        <div className="flex flex-col gap-2">
          <StatItem label="Cracks" value="40%" color="#0e5f97" />
          <StatItem label="Dirt" value="25%" color="#0e4772" />
          <StatItem label="Deformities" value="20%" color="#b0b0b0" />
          <StatItem label="Blood Spots" value="10%" color="#fb510f" />
          <StatItem label="Other" value="5%" color="#ecb662" />
        </div>
      </div>
    </div>
  );
}
