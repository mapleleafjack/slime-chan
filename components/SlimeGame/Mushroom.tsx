"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useDayCycle } from "@/context/dayCycleContext"
import { DayPhase, randomInt } from "@/utils/slimeUtils"
import { ANIMATION_CONFIG } from "./animationConfig"

const MUSHROOM_CONFIG = {
  frameWidth: 48,
  frameHeight: 48,
  totalWalkFrames: 4,
  totalIdleFrames: 9,
  fps: 12,
  speed: 0.5,
  groundLevel: ANIMATION_CONFIG.groundLevel - 10, // Position higher in the game space
  glowDuration: 1000, // Duration of glow effect in ms
}

const Mushroom = () => {
  const { currentPhase } = useDayCycle()
  const [position, setPosition] = useState(randomInt(50, 430))
  const [direction, setDirection] = useState<1 | -1>(Math.random() > 0.5 ? 1 : -1)
  const [isWalking, setIsWalking] = useState(true)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isGlowing, setIsGlowing] = useState(false)
  const animationFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number>(0)
  const behaviorTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const glowTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mushroomRef = useRef<HTMLDivElement>(null)

  // Preload images to prevent flickering
  useEffect(() => {
    const walkImage = new Image()
    walkImage.src = "/assets/mushroom/walk.png"

    const idleImage = new Image()
    idleImage.src = "/assets/mushroom/idle.png"
  }, [])

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

            // Only change direction when actually hitting the border
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

  // Randomly change behavior but don't change direction until hitting border
  useEffect(() => {
    if (!isVisible) return

    const changeBehavior = () => {
      // 80% chance to walk, 20% chance to idle
      const shouldWalk = Math.random() < 0.8
      setIsWalking(shouldWalk)

      // Don't change direction here - only at borders

      // Schedule next behavior change
      behaviorTimeoutRef.current = setTimeout(
        changeBehavior,
        isWalking ? randomInt(3000, 6000) : randomInt(1000, 2000), // Shorter idle times
      )
    }

    // Initial behavior change
    changeBehavior()

    return () => {
      if (behaviorTimeoutRef.current) {
        clearTimeout(behaviorTimeoutRef.current)
      }
    }
  }, [isVisible])

  // Handle click to make mushroom glow
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling

    // Clear any existing glow timeout
    if (glowTimeoutRef.current) {
      clearTimeout(glowTimeoutRef.current)
    }

    // Activate glow effect
    setIsGlowing(true)

    // Set timeout to turn off glow
    glowTimeoutRef.current = setTimeout(() => {
      setIsGlowing(false)
      glowTimeoutRef.current = null
    }, MUSHROOM_CONFIG.glowDuration)
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (glowTimeoutRef.current) {
        clearTimeout(glowTimeoutRef.current)
      }
    }
  }, [])

  if (!isVisible) return null

  const currentImage = isWalking ? "/assets/mushroom/walk.png" : "/assets/mushroom/idle.png"
  const backgroundOffsetX = -currentFrame * MUSHROOM_CONFIG.frameWidth

  // Adjust visual effects based on time of day
  const isDusk = currentPhase === DayPhase.DUSK
  const baseGlowClass = isDusk ? "mushroom-sprite-dusk" : "mushroom-sprite-night"
  const glowClass = isGlowing ? "mushroom-sprite-glowing" : baseGlowClass

  return (
    <div
      ref={mushroomRef}
      onClick={handleClick}
      style={{
        position: "absolute",
        top: `${MUSHROOM_CONFIG.groundLevel}px`,
        left: `${position}px`,
        width: `${MUSHROOM_CONFIG.frameWidth}px`,
        height: `${MUSHROOM_CONFIG.frameHeight}px`,
        background: `url(${currentImage}) ${backgroundOffsetX}px 0 no-repeat`,
        transform: direction === -1 ? "scaleX(-1)" : "scaleX(1)",
        transformOrigin: "center center",
        filter: isGlowing
          ? "drop-shadow(0 0 10px rgba(255,255,255,0.9)) brightness(1.3)"
          : isDusk
            ? "drop-shadow(0 0 3px rgba(255,200,150,0.3))"
            : "drop-shadow(0 0 3px rgba(255,255,255,0.3))",
        transition: isGlowing ? "filter 0.2s ease-in" : "filter 0.5s ease-out, transform 0.2s ease",
        willChange: "background-position, transform, filter",
        imageRendering: "pixelated",
        zIndex: isGlowing ? 96 : 89, // Temporarily increase z-index when glowing
        cursor: "pointer", // Show pointer cursor on hover
      }}
      className={`mushroom-sprite background-character ${glowClass}`}
    />
  )
}

export default Mushroom
