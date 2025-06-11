import type { ReactNode } from "react"
import { DefectDetectionProvider } from "../contexts/DefectDetectionContext"
import CameraWrapper from "./components/camera-wrapper"

export default function DetectionLayout({ children }: { children: ReactNode }) {
  return (
    <DefectDetectionProvider>
      <CameraWrapper>{children}</CameraWrapper>
    </DefectDetectionProvider>
  )
}
