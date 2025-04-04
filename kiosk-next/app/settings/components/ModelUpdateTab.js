"use client"

import { useState } from "react"
import { RefreshCw, Download, CheckCircle, AlertTriangle, Clock, Loader2 } from "lucide-react"

export default function ModelUpdateTab() {
  const [currentModel, setCurrentModel] = useState({
    version: "v2.3.5",
    releaseDate: "2023-08-15",
    lastChecked: "2023-09-20",
  })

  const [updateStatus, setUpdateStatus] = useState("idle") // idle, checking, available, downloading, installing, up-to-date
  const [updateProgress, setUpdateProgress] = useState(0)
  const [availableUpdate, setAvailableUpdate] = useState(null)

  const checkForUpdates = () => {
    setUpdateStatus("checking")

    // Simulate checking for updates
    setTimeout(() => {
      // Randomly decide if an update is available
      const hasUpdate = Math.random() > 0.5

      if (hasUpdate) {
        setAvailableUpdate({
          version: "v2.4.0",
          releaseDate: "2023-09-25",
          size: "45.2 MB",
          changes: [
            "Improved egg detection accuracy",
            "Added support for new egg sizes",
            "Fixed lighting calibration issues",
            "Performance optimizations",
          ],
        })
        setUpdateStatus("available")
      } else {
        setUpdateStatus("up-to-date")
      }
    }, 2000)
  }

  const downloadUpdate = () => {
    setUpdateStatus("downloading")
    setUpdateProgress(0)

    // Simulate download progress
    const interval = setInterval(() => {
      setUpdateProgress((prev) => {
        const newProgress = prev + Math.random() * 10
        if (newProgress >= 100) {
          clearInterval(interval)
          setUpdateStatus("installing")

          // Simulate installation
          setTimeout(() => {
            setCurrentModel({
              version: availableUpdate.version,
              releaseDate: availableUpdate.releaseDate,
              lastChecked: new Date().toLocaleDateString(),
            })
            setAvailableUpdate(null)
            setUpdateStatus("up-to-date")
          }, 3000)

          return 100
        }
        return newProgress
      })
    }, 500)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#0e5f97] mb-4 flex items-center">
        <RefreshCw className="w-5 h-5 mr-2" />
        Model Update
      </h2>

      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Current Model</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Version</p>
                <p className="font-medium text-[#171717]">{currentModel.version}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Release Date</p>
                <p className="font-medium text-[#171717]">{currentModel.releaseDate}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Last Checked</p>
                <p className="font-medium text-[#171717]">{currentModel.lastChecked}</p>
              </div>
              <button
                onClick={checkForUpdates}
                disabled={
                  updateStatus === "checking" || updateStatus === "downloading" || updateStatus === "installing"
                }
                className="px-3 py-1.5 bg-[#0e5f97] text-white rounded-lg text-sm hover:bg-[#0e4772] transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateStatus === "checking" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Check for Updates
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {updateStatus === "up-to-date" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-700 mb-1">Model is up to date</h3>
              <p className="text-sm text-green-600">You are running the latest version of the egg detection model.</p>
            </div>
          </div>
        )}

        {updateStatus === "available" && availableUpdate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-700 mb-1">Update Available</h3>
                <p className="text-sm text-blue-600">
                  A new version ({availableUpdate.version}) is available for download.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">New Version</p>
                  <p className="font-medium text-[#171717]">{availableUpdate.version}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Release Date</p>
                  <p className="font-medium text-[#171717]">{availableUpdate.releaseDate}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">What's New</p>
                <ul className="text-sm text-[#171717] space-y-1 list-disc list-inside">
                  {availableUpdate.changes.map((change, index) => (
                    <li key={index}>{change}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={downloadUpdate}
                  className="px-4 py-2 bg-[#0e5f97] text-white rounded-lg text-sm hover:bg-[#0e4772] transition-colors flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download & Install ({availableUpdate.size})
                </button>
              </div>
            </div>
          </div>
        )}

        {(updateStatus === "downloading" || updateStatus === "installing") && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-4">
              <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-700 mb-1">
                  {updateStatus === "downloading" ? "Downloading Update..." : "Installing Update..."}
                </h3>
                <p className="text-sm text-blue-600">
                  {updateStatus === "downloading"
                    ? "Please wait while we download the latest model."
                    : "Please wait while we install the latest model."}
                </p>
              </div>
            </div>

            {updateStatus === "downloading" && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${updateProgress}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{Math.round(updateProgress)}%</span>
                  <span>{availableUpdate?.size}</span>
                </div>
              </div>
            )}

            {updateStatus === "installing" && (
              <div className="flex items-center justify-center gap-2 text-blue-600 py-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Installing... Please wait</span>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-[#171717] mb-3">Update Settings</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Automatic Updates</h4>
                <p className="text-xs text-gray-500">Download and install updates automatically</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0e5f97]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Update Notifications</h4>
                <p className="text-xs text-gray-500">Receive notifications about new updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0e5f97]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

