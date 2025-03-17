"use client"

import { Sliders, Bell, Globe, User } from "lucide-react"

export default function GeneralSettingsTab({ sortingSpeed, onSpeedChange }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[#0e5f97] mb-4 flex items-center">
        <Sliders className="w-5 h-5 mr-2" />
        General Settings
      </h2>

      <div className="space-y-6">
        {/* Display Settings */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Display Settings</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Units of Measurement</h4>
                <p className="text-xs text-gray-500">Choose your preferred units</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded bg-[#0e5f97] text-white text-sm">Metric</button>
                <button className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm">Imperial</button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Date Format</h4>
                <p className="text-xs text-gray-500">Choose your preferred date format</p>
              </div>
              <select className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Language & Region */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3 flex items-center">
            <Globe className="w-4 h-4 mr-2 text-[#0e5f97]" />
            Language & Region
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e5f97]">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e5f97]">
                <option>UTC-08:00 (Pacific Time)</option>
                <option>UTC-07:00 (Mountain Time)</option>
                <option>UTC-06:00 (Central Time)</option>
                <option>UTC-05:00 (Eastern Time)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3 flex items-center">
            <Bell className="w-4 h-4 mr-2 text-[#0e5f97]" />
            Notification Settings
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Error Alerts</h4>
                <p className="text-xs text-gray-500">Notify when errors occur</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0e5f97]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Maintenance Reminders</h4>
                <p className="text-xs text-gray-500">Scheduled maintenance notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0e5f97]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">System Updates</h4>
                <p className="text-xs text-gray-500">Notify about available updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0e5f97]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* User Preferences */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3 flex items-center">
            <User className="w-4 h-4 mr-2 text-[#0e5f97]" />
            User Preferences
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Auto-logout</h4>
                <p className="text-xs text-gray-500">Automatically log out after inactivity</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0e5f97]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Sound Effects</h4>
                <p className="text-xs text-gray-500">Enable UI sound effects</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0e5f97]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

