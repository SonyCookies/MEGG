"use client";

import Link from "next/link";
import { MoveLeft, Clock3, Settings } from "lucide-react";
import { useState } from "react";

export default function SecuritySettingsPage() {
  const [isEnable, setIsEnable] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#0e5f97] p-3 sm:p-4 relative">
      {/* Background pattern */}
      <BackgroundElements />

      <div className="max-w-3xl mx-auto relative">
        <div className="bg-gradient-to-br from-white to-[#f0f7ff] rounded-2xl p-4 h-[440px]">
          <div className="flex flex-col gap-6 h-full">
            {/* nav */}
            <div className="flex items-center justify-between text-black">
              {/* left of nav */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-2xl text-[#0e5f97] font-bold">
                  <Settings className="w-8 h-8" />
                  Security Settings
                </div>
              </div>

              {/* right of nav */}
              <div className="flex items-center justify-end">
                <Link
                  href="/account"
                  className="px-6 py-3 bg-white rounded-lg shadow-sm flex items-center gap-2 text-[#0e5f97] hover:bg-[#0e5f97] hover:text-white transition-all duration-300"
                >
                  <MoveLeft className="w-5 h-5" />
                  Back
                </Link>
              </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 flex-col gap-6 items-baseline bg-blue  ">
              {/* preference */}
              <div className="flex items-center jusitfy-between w-full">
                {/* left */}
                <div className="flex items-center gap-3 flex-1 text-[#0e5f97]">
                  <Clock3 className="w-8 h-8" />
                  <div className="flex flex-col gap-">
                    <span className="font-medium text-lg">
                      Auto-logout Preference
                    </span>
                    <p className="text-gray-500 text-s">
                      Automatically log out after period of inactivity.
                    </p>
                  </div>
                </div>
                {/* right */}
                <div className="flex items-center">
                  <label class="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value=""
                      class="sr-only peer"
                      onChange={() => setIsEnable(!isEnable)}
                    />
                    <div class="relative w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer    peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all  peer-checked:bg-blue-600 "></div>
                  </label>
                </div>
              </div>

              {/* toggle autologout */}
              {isEnable && (
                <div className="flex items-center justify-between gap-4 rounded-lg p-4 bg-white shadow-sm w-full text-[#0e5f97]">
                  <div className="">Logout after inactivity period</div>
                  {/* dropdown */}
                  <div className="flex">
                    <form action="">
                      <select
                        id="large"
                        class="block w-full px-4 py-3 text-base text-gray-900 border border-gray-300 rounded-lg bg-gray-100  "
                      >
                        <option selected>Never</option>
                        <option value="fifteen">15 Minutes</option>
                        <option value="thirty">30 Minutes</option>
                        <option value="forty-five">45 Minutes</option>
                        <option value="one">1 Hour</option>
                      </select>
                    </form>
                  </div>
                </div>
              )}
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
