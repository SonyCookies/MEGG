export function StatItem({ label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-primary/70">{label}</span>
      </div>
      <span className="text-primary">{value}</span>
    </div>
  )
}
