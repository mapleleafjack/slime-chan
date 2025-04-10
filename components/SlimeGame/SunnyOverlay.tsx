import type React from "react"
import "./SunnyOverlay.css"

const SunnyOverlay: React.FC = () => {
  const numberOfRays = 4

  const rays = Array.from({ length: numberOfRays }, (_, index) => (
    <div key={`sun-ray-${index}`} className="sun-ray" style={{ left: `${10 + index * 20}%` }} />
  ))

  return (
    <div className="sunny-overlay">
      {rays}
      <div className="floor-glow" />
    </div>
  )
}

export default SunnyOverlay
