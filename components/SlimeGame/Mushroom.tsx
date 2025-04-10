"use client"

import { useEffect, useRef, useState } from "react"
import { useDayCycle } from "@/context/dayCycleContext"
import { DayPhase, randomInt } from "@/utils/slimeUtils"
import { ANIMATION_CONFIG } from "./animationConfig"

const MUSHROOM_CONFIG = {
  frameWidth: 48,
  frameHeight: 48,
  totalWalkFrames: 4,
  totalIdleFrames: 9,
  fps: 8,
  speed: 0.5,
  // Move the mushroom up by its height (48px)
  groundLevel: ANIMATION_CONFIG.groundLevel - 10, // Position higher in the game space
}

const Mushroom = () => {
  const { currentPhase } = useDayCycle()
  const [position, setPosition] = useState(randomInt(50, 430))
  const [direction, setDirection] = useState<1 | -1>(Math.random() > 0.5 ? 1 : -1)
  const [isWalking, setIsWalking] = useState(true)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const animationFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number>(0)
  const behaviorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Show mushroom during dusk and night
  useEffect(() => {
    const isDuskOrNight = currentPhase === DayPhase.NIGHT || currentPhase === DayPhase.DUSK
    setIsVisible(isDuskOrNight)
  }, [currentPhase])

  // Handle animation and movement
  useEffect(() => {
    if (!isVisible) return

    const animate = (timestamp: number) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp
      const elapsed = timestamp - lastTimestampRef.current

      // Update at the desired frame rate
      if (elapsed > 1000 / MUSHROOM_CONFIG.fps) {
        // Update frame
        setCurrentFrame((prev) => {
          const totalFrames = isWalking ? MUSHROOM_CONFIG.totalWalkFrames : MUSHROOM_CONFIG.totalIdleFrames
          return (prev + 1) % totalFrames
        })

        // Move if walking
        if (isWalking) {
          setPosition((prev) => {
            const newPosition = prev + direction * MUSHROOM_CONFIG.speed

            // Check boundaries
            if (newPosition <= 0) {
              setDirection(1)
              return 0
            } else if (newPosition >= 480 - MUSHROOM_CONFIG.frameWidth) {
              setDirection(-1)
              return 480 - MUSHROOM_CONFIG.frameWidth
            }

            return newPosition
          })
        }

        lastTimestampRef.current = timestamp
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isVisible, isWalking, direction])

  // Randomly change behavior
  useEffect(() => {
    if (!isVisible) return

    const changeBehavior = () => {
      // 70% chance to walk, 30% chance to idle
      const shouldWalk = Math.random() < 0.7
      setIsWalking(shouldWalk)

      // Randomly change direction sometimes
      if (shouldWalk && Math.random() < 0.3) {
        setDirection((prev) => (prev === 1 ? -1 : 1))
      }

      // Schedule next behavior change
      behaviorTimeoutRef.current = setTimeout(changeBehavior, isWalking ? randomInt(3000, 6000) : randomInt(1000, 3000))
    }

    // Initial behavior change
    changeBehavior()

    return () => {
      if (behaviorTimeoutRef.current) {
        clearTimeout(behaviorTimeoutRef.current)
      }
    }
  }, [isVisible])

  if (!isVisible) return null

  const currentImage = isWalking ? "/assets/mushroom/walk.png" : "/assets/mushroom/idle.png"
  const backgroundOffsetX = -currentFrame * MUSHROOM_CONFIG.frameWidth

  // Adjust visual effects based on time of day
  const isDusk = currentPhase === DayPhase.DUSK
  const glowClass = isDusk ? "mushroom-sprite-dusk" : "mushroom-sprite-night"

  return (
    <div
      style={{
        position: "absolute",
        top: `${MUSHROOM_CONFIG.groundLevel}px`,
        left: `${position}px`,
        width: `${MUSHROOM_CONFIG.frameWidth}px`,
        height: `${MUSHROOM_CONFIG.frameHeight}px`,
        background: `url(${currentImage}) ${backgroundOffsetX}px 0 no-repeat`,
        transform: direction === -1 ? "scaleX(-1)" : "scaleX(1)",
        transformOrigin: "center center",
        filter: isDusk ? "drop-shadow(0 0 3px rgba(255,200,150,0.3))" : "drop-shadow(0 0 3px rgba(255,255,255,0.3))",
        transition: "filter 0.3s ease, transform 0.2s ease",
        willChange: "background-position, transform",
        imageRendering: "pixelated",
        zIndex: 89, // Lower z-index to be behind night overlay and slimes
      }}
      className={`mushroom-sprite background-character ${glowClass}`}
    />
  )
}

export default Mushroom
