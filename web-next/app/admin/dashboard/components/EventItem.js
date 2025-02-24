export function EventItem({ icon, name, date, id, amount, type }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20">
          {icon}
        </div>
        <div>
          <div className="font-medium text-primary">{name}</div>
          <div className="text-sm text-primary/70">
            {date} • ID: {id}
          </div>
        </div>
      </div>
      <div className={type === "defect" ? "text-accent" : "text-primary"}>
        {amount}
      </div>
    </div>
  )
}
