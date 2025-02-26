"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation";
import { Search, Menu, Bell, Egg, Bug } from "lucide-react"
import { TotalEggsChart } from "./components/TotalEggsChart"
import { EggSizesChart } from "./components/EggSizesChart"
import { EggSizeDonutChart } from "./components/EggSizeDonutChart"
import { TotalEggDefectChart } from "./components/TotalEggDefectChart"
import { EggDefectsChart } from "./components/EggDefectsChart"
import { EggDefectDonutChart } from "./components/EggDefectDonutChart"
import { MachineStatus } from "./components/MachineStatus"
import { Alert } from "./components/Alert"
import { EventItem } from "./components/EventItem"
import { StatItem } from "./components/StatItem"
import { EggSizeStats } from "./components/EggSizeStats"
import { EggDefectStats } from "./components/EggDefectStats"

export default function DashboardPage() {
  const [timeFrame, setTimeFrame] = useState("daily")
  const [chartType, setChartType] = useState("total")
  const [activeTab, setActiveTab] = useState("sizing")
  const router = useRouter();
  const timeoutRef = useRef()


  // useEffect(() => {
  //   const checkAuth = () => {
  //     const user = localStorage.getItem('user')
  //     if (!user) {
  //       router.replace('/login')
  //       return false
  //     }
  //     return true
  //   }

  //   if (!checkAuth()) return

  //   const events = ['mousemove', 'keydown', 'click', 'scroll']
  //   const resetTimer = () => {
  //     if (timeoutRef.current) clearTimeout(timeoutRef.current)
  //     timeoutRef.current = setTimeout(() => {
  //       localStorage.removeItem('user')
  //       router.replace('/login')
  //     }, 60 * 1000) // 15 minutes
  //   }

  //   resetTimer()

  //   events.forEach(event => window.addEventListener(event, resetTimer))

  //   return () => {
  //     events.forEach(event => window.removeEventListener(event, resetTimer))
  //     if (timeoutRef.current) clearTimeout(timeoutRef.current)
  //   }
  // }, [router]) 
      
    



  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setChartType("total") // Reset chart type when switching tabs
  }

  const tabs = [
    { id: "sizing", label: "Egg Sizing", icon: Egg },
    { id: "defects", label: "Egg Defects", icon: Bug },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white p-4 shadow-sm lg:py-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 lg:gap-8">
              <Menu className="h-6 w-6 text-primary lg:hidden" />
              <h1 className="text-xl font-bold text-primary lg:text-2xl">Dashboard</h1>
              <div className="hidden lg:block">
                <div className="relative">
                  <input
                    type="text"
                    className="w-[300px] rounded-full border-2 border-primary/20 bg-white py-2 pl-12 pr-4 text-sm text-primary placeholder-primary/50 outline-none focus:border-primary"
                    placeholder="Search machines, alerts..."
                  />
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/50" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Bell className="h-6 w-6 text-primary lg:hidden" />
              <div className="hidden items-center gap-3 lg:flex">
                <span className="text-primary">Emily Smith</span>
              </div>
              <div className="h-8 w-8 rounded-full overflow-hidden lg:h-10 lg:w-10">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Ljb3x24eu8aylJh0CAg6VaHDBLOrws.png"
                  alt="User"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] space-y-4 p-4 lg:max-w-[1200px] lg:p-6 lg:space-y-6">
        {/* Tab Buttons */}
        <div className="mb-6">
          <div className="flex justify-center">
            <div className="inline-flex rounded-3xl bg-white p-2 shadow-md">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  className={`flex items-center px-6 py-3 rounded-3xl transition-all duration-300 ${
                    activeTab === tab.id ? "bg-primary text-white shadow-inner" : "text-primary hover:bg-gray-100"
                  } ${index === 0 ? "mr-2" : ""}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <tab.icon className={`w-5 h-5 mr-2 ${activeTab === tab.id ? "animate-pulse" : ""}`} />
                  <span className="font-medium text-sm">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-4 lg:space-y-6">
            {/* Egg Size/Defect Overview Section */}
            <div className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
                <h3 className="font-semibold text-primary text-lg">
                  {activeTab === "sizing" ? "Egg Size Overview" : "Egg Defect Overview"}
                </h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <select
                    className="w-full sm:w-auto rounded-full border border-primary/20 bg-white px-3 py-2 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                    value={timeFrame}
                    onChange={(e) => setTimeFrame(e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <select
                    className="w-full sm:w-auto rounded-full border border-primary/20 bg-white px-3 py-2 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                  >
                    <option value="total">Total Eggs</option>
                    <option value="details">{activeTab === "sizing" ? "Egg Sizes" : "Defect Types"}</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 h-[300px]">
                {activeTab === "sizing" ? (
                  chartType === "total" ? (
                    <TotalEggsChart timeFrame={timeFrame} />
                  ) : (
                    <EggSizesChart timeFrame={timeFrame} />
                  )
                ) : chartType === "total" ? (
                  <TotalEggDefectChart timeFrame={timeFrame} />
                ) : (
                  <EggDefectsChart timeFrame={timeFrame} />
                )}
              </div>
            </div>

            {/* Stats Grid */}
            {activeTab === "sizing" ? <EggSizeStats /> : <EggDefectStats />}

            {/* Machine Status */}
            <div className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
              <h3 className="font-semibold text-primary text-lg mb-4">Machine Status</h3>
              <div className="space-y-3">
                <MachineStatus name="Sorter A" status="operational" />
                <MachineStatus name="Sorter B" status="maintenance" />
                <MachineStatus name="Detector X" status="operational" />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-4 lg:space-y-6 mt-4 lg:mt-0">
            {/* Donut Chart */}
            <div className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
              <h3 className="font-semibold text-primary text-lg mb-4">
                {activeTab === "sizing" ? "Egg Size Distribution" : "Egg Defect Distribution"}
              </h3>
              <div className="aspect-square">
                {activeTab === "sizing" ? <EggSizeDonutChart /> : <EggDefectDonutChart />}
              </div>
              <div className="mt-4 space-y-2">
                {activeTab === "sizing" ? (
                  <>
                    <StatItem label="Jumbo" value="10%" color="#0e5f97" />
                    <StatItem label="Extra Large" value="25%" color="#0e4772" />
                    <StatItem label="Large" value="35%" color="#b0b0b0" />
                    <StatItem label="Medium" value="20%" color="#fb510f" />
                    <StatItem label="Small" value="10%" color="#ecb662" />
                  </>
                ) : (
                  <>
                    <StatItem label="Cracks" value="40%" color="#0e5f97" />
                    <StatItem label="Dirt" value="25%" color="#0e4772" />
                    <StatItem label="Deformities" value="20%" color="#b0b0b0" />
                    <StatItem label="Blood Spots" value="10%" color="#fb510f" />
                    <StatItem label="Other" value="5%" color="#ecb662" />
                  </>
                )}
              </div>
            </div>

            {/* Live Alerts */}
            <div className="rounded-3xl bg-secondary p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary-dark text-lg">Live Alerts</h3>
                <span className="text-sm text-primary-dark/80 cursor-pointer hover:underline">View all</span>
              </div>
              <div className="space-y-2">
                <Alert message="Maintenance required for Sorter B" type="warning" />
                <Alert
                  message={
                    activeTab === "sizing"
                      ? "High defect rate detected in batch #45678"
                      : "Unusual defect pattern detected"
                  }
                  type="error"
                />
                <Alert
                  message={
                    activeTab === "sizing"
                      ? "Daily sorting goal achieved"
                      : "Defect inspection completed for batch #45678"
                  }
                  type="success"
                />
              </div>
            </div>

            {/* Recent Events */}
            <div className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary text-lg">Recent Events</h3>
                <span className="text-sm text-accent cursor-pointer hover:underline">See all</span>
              </div>
              <div className="space-y-4">
                <EventItem
                  icon="🥚"
                  name={activeTab === "sizing" ? "Large batch sorted" : "Defect inspection completed"}
                  date="10:35 AM"
                  id="45678"
                  amount={activeTab === "sizing" ? "10,000 eggs" : "150 defects found"}
                  type="success"
                />
                <EventItem
                  icon="🔧"
                  name="Maintenance completed"
                  date="09:20 AM"
                  id="M-7890"
                  amount="Sorter B"
                  type="maintenance"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

