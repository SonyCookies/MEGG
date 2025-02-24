import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export function Alert({ message, type }) {
  const getAlertIcon = (type) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return null
    }
  }

  return (
    <div className="flex items-center gap-2 text-primary-dark">
      {getAlertIcon(type)}
      <span className="text-sm">{message}</span>
    </div>
  )
}
