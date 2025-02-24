export function MachineStatus({ name, status }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "operational":
        return "text-green-500"
      case "maintenance":
        return "text-yellow-500"
      case "error":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="flex items-center justify-between rounded-3xl bg-secondary/20 p-3">
      <span className="text-primary">{name}</span>
      <span className={`font-medium ${getStatusColor(status)}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  )
}
