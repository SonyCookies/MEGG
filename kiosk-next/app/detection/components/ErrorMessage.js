export default function ErrorMessage({ message }) {
  if (!message) return null

  return (
    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm" role="alert">
      <span className="font-medium">Error:</span> {message}
    </div>
  )
}

