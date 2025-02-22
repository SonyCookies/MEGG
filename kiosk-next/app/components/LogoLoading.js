export function LogoLoading() {
  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="relative w-14 h-14">
        {/* Base squares */}
        <div className="grid grid-cols-2 gap-2">
          <div className="w-6 h-6 bg-[#0e5f97]/20 rounded-lg animate-pulse"></div>
          <div className="w-6 h-6 bg-[#0e5f97]/20 rounded-lg animate-pulse [animation-delay:150ms]"></div>
          <div className="w-6 h-6 bg-[#0e5f97]/20 rounded-lg animate-pulse [animation-delay:300ms]"></div>
          <div className="w-6 h-6 bg-[#0e5f97]/20 rounded-lg animate-pulse [animation-delay:450ms]"></div>
        </div>
        
        {/* Animated overlay squares */}
        <div className="absolute inset-0">
          <div className="grid grid-cols-2 gap-2">
            <div className="w-6 h-6 bg-[#0e5f97] rounded-lg animate-loading-square"></div>
            <div className="w-6 h-6 bg-[#ff6b4a] rounded-lg animate-loading-square [animation-delay:150ms]"></div>
            <div className="w-6 h-6 bg-[#0e5f97] rounded-lg animate-loading-square [animation-delay:300ms]"></div>
            <div className="w-6 h-6 bg-[#0e5f97] rounded-lg animate-loading-square [animation-delay:450ms]"></div>
          </div>
        </div>
      </div>
      
      {/* Animated text */}
      <div className="text-sm text-[#0e5f97]/70 animate-fade-text">
        Fetching data
        <span className="animate-ellipsis">.</span>
        <span className="animate-ellipsis [animation-delay:200ms]">.</span>
        <span className="animate-ellipsis [animation-delay:400ms]">.</span>
      </div>
    </div>
  )
}