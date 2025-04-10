"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { useDayCycle } from "@/context/dayCycleContext"
import { DayPhase } from "@/utils/slimeUtils"

type SlimeSpriteProps = {
  color: "blue" | "red" | "green"
  direction: 1 | -1
  currentImage: string
  backgroundOffsetX: number
  topPosition: number
  x: number
  isActive?: boolean
  isHovered?: boolean
}

const SlimeSprite: React.FC<SlimeSpriteProps> = ({
  color,
  direction,
  currentImage,
  backgroundOffsetX,
  topPosition,
  x,
  isActive = false,
  isHovered = false,
}) => {
  const frameWidth = 128
  const frameHeight = 128
  const { currentPhase } = useDayCycle()
  const spriteRef = useRef<HTMLDivElement>(null)

  // Preload images to prevent flickering
  useEffect(() => {
    // Preload all animation states for the current color
    const imagesToPreload = [`/assets/${color}/idle.png`, `/assets/${color}/walk.png`, `/assets/${color}/jump.png`]

    imagesToPreload.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [color])

  // Enhance visual treatment for all slimes, with slight enhancement for active slime
  const isNight = currentPhase === DayPhase.NIGHT

  // Make unselected slimes more similar to selected ones (just slightly less bright)
  const glowFilter = isNight
    ? isActive
      ? "drop-shadow(0 0 8px rgba(255,255,255,0.8)) drop-shadow(0 0 12px rgba(255,255,255,0.4))"
      : isHovered
        ? "drop-shadow(0 0 7px rgba(255,255,255,0.7)) drop-shadow(0 0 11px rgba(255,255,255,0.35))"
        : "drop-shadow(0 0 6px rgba(255,255,255,0.6)) drop-shadow(0 0 10px rgba(255,255,255,0.3))"
    : isActive
      ? "drop-shadow(0 0 5px rgba(255,255,255,0.7))"
      : isHovered
        ? "drop-shadow(0 0 4.5px rgba(255,255,255,0.6))"
        : "drop-shadow(0 0 4px rgba(255,255,255,0.5))"

  // Also add a subtle brightness filter to make active slimes slightly brighter
  const brightnessFilter = isActive ? "brightness(1.15)" : isHovered ? "brightness(1.1)" : "brightness(1.0)"

  return (
    <div
      ref={spriteRef}
      style={{
        position: "absolute",
        top: `${topPosition}px`,
        left: `${x}px`,
        width: `${frameWidth}px`,
        height: `${frameHeight}px`,
        background: `url(${currentImage}) ${backgroundOffsetX}px 0 no-repeat`,
        transform: direction === -1 ? "scaleX(-1)" : "scaleX(1)",
        transformOrigin: "center center",
        filter: `${glowFilter} ${brightnessFilter}`,
        transition: "filter 0.3s ease, transform 0.2s ease",
        willChange: "background-position, transform, filter",
        imageRendering: "pixelated",
      }}
      className="slime-sprite"
    />
  )
}

export default SlimeSprite
