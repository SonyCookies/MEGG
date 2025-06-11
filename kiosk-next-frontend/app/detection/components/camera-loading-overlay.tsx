import { Loader } from "lucide-react"

export function CameraLoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="relative w-20 h-20 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
        <div
          className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin"
          style={{ animationDuration: "1s" }}
        ></div>
      </div>
      <div className="text-white font-medium text-2xl mb-2">Initializing Camera</div>
      <div className="text-white/70 text-lg mb-6">Please wait...</div>
      <div className="flex items-center gap-2 text-white/80">
        <Loader className="w-5 h-5 animate-spin" />
        <span>Connecting to camera hardware</span>
      </div>
    </div>
  )
}
