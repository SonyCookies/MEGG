export default function MachineIdStatus({ status, machineId }) {
  let statusColor = "bg-gray-300"
  let statusText = "Unknown"

  switch (status) {
    case "loading":
      statusColor = "bg-yellow-400"
      statusText = "Loading machine ID..."
      break
    case "available":
      statusColor = "bg-green-500"
      statusText = `Machine ID: ${machineId}`
      break
    case "unavailable":
      statusColor = "bg-red-500"
      statusText = "Machine ID not available"
      break
    case "error":
      statusColor = "bg-red-500"
      statusText = "Error fetching machine ID"
      break
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${statusColor}`} />
      <span className="text-sm text-gray-600">{statusText}</span>
    </div>
  )
}

