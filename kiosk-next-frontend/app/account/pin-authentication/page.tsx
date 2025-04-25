
"use client"
import { useState } from "react"
import Link from "next/link"
import { MoveLeft, KeyRound, Delete, LockKeyholeOpen, ShieldCheck, Lock , Fingerprint} from "lucide-react"

export default function PinAuthenticationPage() {
  const [pin, setPin] = useState<string[]>(["", "", "", ""])

  const handleDigitClick = (digit: string) => {
    if (pin.filter((d) => d !== "").length >= 4) return
    const newPin = [...pin]
    const nextIndex = newPin.findIndex((d) => d === "")
    if (nextIndex !== -1) {
      newPin[nextIndex] = digit
      setPin(newPin)
    }
  }

  const handleDelete = () => {
    const newPin = [...pin]
    const lastIndex = newPin.map((d, i) => [d, i]).reverse().find(([d]) => d !== "")
    if (lastIndex) {
      const index = lastIndex[1] as number
      newPin[index] = ""
      setPin(newPin)
    }

  }

  const handleClear = () => {
    setPin(["", "", "", ""])
  }

  const isFull = pin.every((d) => d !== "")

  return (
    <div className="h-screen overflow-hidden bg-[#0e5f97] p-3 sm:p-4 relative">
      <BackgroundElements />

      <div className="max-w-3xl mx-auto relative text-black">
        <div className="bg-gradient-to-br from-white to-[#f0f7ff] rounded-2xl p-4 h-[440px]">
          <div className="flex flex-col gap-6 h-full">
            <div className="flex flex-1 gap-4">
              {/* informations */}
              <div className="flex flex-col gap-6 w-[350px] bg-red-00">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xl text-[#0e5f97] font-bold">
                      <LockKeyholeOpen className="w-6 h-6" />
                      Pin Authentication
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <Link
                      href="/account"
                      className="px-4 py-3 rounded-lg bg-white shadow-sm flex items-center gap-2 text-[#0e5f97] hover:bg-[#0e5f97] hover:text-white transition-all duration-300"
                    >
                      <MoveLeft className="w-5 h-5" />
                      Back
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col gap-4 bg-red-00 h-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4  ">
                      <div className="flex items-center gap-2 text-[#0e5f97]">
                        <KeyRound className="w-5 h-5" />
                        <span className="text-lg font-medium">Change PIN</span>
                      </div>

                      <div className="px-3 py-1.5 rounded-full bg-green-100 text-green-500 font-medium text-sm flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" />
                        Active
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6 p-4 text-base text-[#0e5f97] rounded-lg h-ful bg-white shadow-sm border border-[#0e5f97]/20">
                    {/* Additional info could go here */}
                    <div className="flex gap-2 items- ">
                      {/* logo */}
                      <div className="flex ">
                        <Lock className="w-4 h-4 mt-1" />

                      </div>
                      {/* info */}
                      <div className="flex flex-col gap-">
                        <span className="font-medium">
                          Access Control
                        </span>
                        <p className="text-gray-500 text-sm">
                          PIN provides secure access to machine settings and prevents unauthorized access.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 items- ">
                      {/* logo */}
                      <div className="flex items-baseline">
                        <Fingerprint className="w-4 h-4 mt-1" />

                      </div>
                      {/* info */}
                      <div className="flex flex-col gap- items-baseline ">
                        <span className="font-medium">
                          PIN Guidelines
                        </span>
                        <p className="text-gray-500 text-sm">
                          Choose a unique 4-digit code that you haven't used before and can rememeber easily.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-[#0e5f97] text-center w-full text-sm">
                    <span className="font-semibold">
                      Forgot your PIN? {" "}
                    </span>
                    Contact your system administrator for assistance with PIN reset.
                  </div>
                </div>
              </div>

              {/* pin interface */}
              <div className="flex flex-1 px-4 pt-3">
                <div className=" flex flex-col gap-6 w-full">
                  <div className="flex flex-col gap-4">
                    <span className="text-center font-medium text-[#0e5f97]">
                      Enter your current PIN
                    </span>

                    <div className="flex gap-3 w-full justify-center">
                      {pin.map((digit, index) => (
                        <div
                          key={index}
                          className={`w-12 h-12 border rounded-lg flex items-center justify-center text-xl font-semibold transition-all duration-200 ${digit
                            ? "bg-[#0e5f97] border-[#0e5f97] text-white"
                            : "border-gray-200 text-transparent"
                            }`}
                        >
                          {digit && "•"}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* pin numbers */}
                  <div className="bg-red-0 h-full text-[#0e5f97]">
                    {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"]].map((row, i) => (
                      <div key={i} className="grid grid-cols-3 gap-3 mb-3">
                        {row.map((num) => (
                          <button
                            key={num}
                            onClick={() => handleDigitClick(num)}
                            className="p-4 rounded-lg bg-white text-center font-semibold shadow active:bg-[#0e5f97] active:text-white transition-all duration-300"
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    ))}
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={handleClear}
                        className="p-4 rounded-lg bg-white text-center font-semibold shadow active:bg-[#0e5f97] active:text-white transition-all duration-300"
                      >
                        CLEAR
                      </button>

                      <button
                        onClick={() => {
                          if (!isFull) handleDigitClick("0")
                          else alert("Verifying...") // you can replace this with real verification logic
                        }}
                        className={`p-4 rounded-lg text-center font-semibold shadow transition-all duration-300 ${isFull
                          ? "bg-[#0e5f97] text-white"
                          : "bg-white text-[#0e5f97] active:bg-[#0e5f97] active:text-white"
                          }`}
                      >
                        {isFull ? "Verify" : "0"}
                      </button>

                      <button
                        onClick={handleDelete}
                        className="p-4 rounded-lg bg-white text-center font-semibold shadow active:bg-[#0e5f97] active:text-white transition-all duration-300 flex items-center justify-center"
                      >
                        <Delete className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0wIDMwaDMwdjMwSDB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwSDB2MzBoMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwaDMwdjMwSDMweiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iLjUiLz48L2c+PC9zdmc+')] opacity-60"></div>

      {/* Animated egg shapes */}
      <div
        className="absolute top-1/4 right-1/4 w-64 h-80 bg-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] blur-3xl animate-pulse opacity-30"
        style={{ animationDuration: "8s" }}
      ></div>
      <div
        className="absolute bottom-1/4 left-1/4 w-64 h-80 bg-white/5 rounded-[60%_40%_40%_60%/60%_60%_40%_40%] blur-3xl animate-pulse opacity-30"
        style={{ animationDuration: "10s", animationDelay: "2s" }}
      ></div>

      {/* Light beams */}
      <div className="absolute -top-20 left-1/2 w-1 h-60 bg-gradient-to-b from-cyan-300/20 to-transparent blur-md transform -translate-x-1/2 rotate-15 opacity-30"></div>
      <div className="absolute -top-20 left-1/3 w-1 h-60 bg-gradient-to-b from-cyan-300/10 to-transparent blur-md transform -translate-x-1/2 -rotate-15 opacity-30"></div>
    </div>
  );
}
