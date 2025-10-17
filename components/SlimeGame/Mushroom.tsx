"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useCreature } from "@/context/creatureContext"
import { isMushroom } from "@/types/creatureTypes"
import { useDayCycle } from "@/context/dayCycleContext"
import { DayPhase } from "@/utils/slimeUtils"
import { ANIMATION_CONFIG } from "./animationConfig"

const MUSHROOM_CONFIG = {
  frameWidth: 48,
  frameHeight: 48,
  totalWalkFrames: 4,
  totalIdleFrames: 9,
  fps: 12,
  speed: 0.5,
  groundLevel: ANIMATION_CONFIG.groundLevel - 10,
  glowDuration: 1000,
}

interface MushroomProps {
  id: string
}

const Mushroom: React.FC<MushroomProps> = ({ id }) => {
  const { state, dispatch } = useCreature()
  const { currentPhase } = useDayCycle()
  const [isHovered, setIsHovered] = useState(false)
  const animationFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number>(0)
  const behaviorTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const glowTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mushroomRef = useRef<HTMLDivElement>(null)

  // Find the mushroom data
  const creature = state.creatures.find((c) => c.id === id)
  if (!creature || !isMushroom(creature)) return null

  const mushroom = creature

  // Mushrooms are only visible during dusk and night
  const isVisible = currentPhase === DayPhase.NIGHT || currentPhase === DayPhase.DUSK

  // Preload images to prevent flickering
  useEffect(() => {
    const walkImage = new Image()
    walkImage.src = "/assets/mushroom/walk.png"

    const idleImage = new Image()
    idleImage.src = "/assets/mushroom/idle.png"
  }, [])

  // Handle animation and movement
  useEffect(() => {
    if (!isVisible) return

    const animate = (timestamp: number) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp
      const elapsed = timestamp - lastTimestampRef.current

      // Update at the desired frame rate
      if (elapsed > 1000 / MUSHROOM_CONFIG.fps) {
        // Update frame
        if (mushroom.isWalking) {
          dispatch({ type: "INCREMENT_WALK_FRAME", payload: id })
        } else {
          dispatch({ type: "INCREMENT_IDLE_FRAME", payload: id })
        }

        // Move if walking
        if (mushroom.isWalking) {
          const newPosition = mushroom.position + mushroom.direction * MUSHROOM_CONFIG.speed

          // Only change direction when hitting the border
          if (newPosition <= 0) {
            dispatch({ type: "SET_DIRECTION", payload: { id, value: 1 } })
            dispatch({ type: "SET_POSITION", payload: { id, value: 0 } })
          } else if (newPosition >= 480 - MUSHROOM_CONFIG.frameWidth) {
            dispatch({ type: "SET_DIRECTION", payload: { id, value: -1 } })
            dispatch({ type: "SET_POSITION", payload: { id, value: 480 - MUSHROOM_CONFIG.frameWidth } })
          } else {
            dispatch({ type: "SET_POSITION", payload: { id, value: newPosition } })
          }
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
  }, [isVisible, mushroom.isWalking, mushroom.direction, mushroom.position, dispatch, id])

  // Randomly change behavior
  useEffect(() => {
    if (!isVisible) return

    const changeBehavior = () => {
      // 80% chance to walk, 20% chance to idle
      const shouldWalk = Math.random() < 0.8
      dispatch({ type: "SET_WALKING", payload: { id, value: shouldWalk } })

      // Schedule next behavior change
      const delay = shouldWalk
        ? Math.random() * 3000 + 3000 // 3-6 seconds
        : Math.random() * 1000 + 1000 // 1-2 seconds

      behaviorTimeoutRef.current = setTimeout(changeBehavior, delay)
    }

    changeBehavior()

    return () => {
      if (behaviorTimeoutRef.current) {
        clearTimeout(behaviorTimeoutRef.current)
      }
    }
  }, [isVisible, dispatch, id])

  // Check if this mushroom is active
  const isActive = state.activeCreatureId === id

  // Handle click to select mushroom
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    // If clicking on already active mushroom, toggle menu
    if (isActive) {
      if (mushroom.bubble.menuState === "main") {
        dispatch({ type: "HIDE_ALL_BUBBLES", payload: undefined })
      } else {
        dispatch({ type: "SET_MENU_STATE", payload: { id, state: "main" } })
      }
      return
    }

    // Hide all bubbles first
    dispatch({ type: "HIDE_ALL_BUBBLES", payload: undefined })

    // Set this mushroom as active
    dispatch({ type: "SET_ACTIVE_CREATURE", payload: id })
    dispatch({ type: "SET_LAST_INTERACTION", payload: { id, value: Date.now() } })

    // Stop the mushroom when selected
    dispatch({ type: "SET_WALKING", payload: { id, value: false } })
    dispatch({ type: "SET_MODE", payload: { id, value: "user" } })

    // Make it glow when selected
    if (glowTimeoutRef.current) {
      clearTimeout(glowTimeoutRef.current)
    }
    dispatch({ type: "SET_GLOWING", payload: { id, value: true } })
    dispatch({ type: "SET_GLOW_INTENSITY", payload: { id, value: 1 } })
    
    // Show greeting
    dispatch({ type: "SHOW_BUBBLE", payload: { id, text: "✨ *glows softly*" } })
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Don't remove the last mushroom
    const mushroomCount = state.creatures.filter((c) => isMushroom(c)).length
    if (mushroomCount > 1) {
      dispatch({ type: "REMOVE_CREATURE", payload: id })
    }
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

  const currentImage = mushroom.isWalking ? "/assets/mushroom/walk.png" : "/assets/mushroom/idle.png"
  const currentFrame = mushroom.isWalking ? mushroom.walkFrame : mushroom.idleFrame
  const totalFrames = mushroom.isWalking ? MUSHROOM_CONFIG.totalWalkFrames : MUSHROOM_CONFIG.totalIdleFrames
  const backgroundOffsetX = -(currentFrame % totalFrames) * MUSHROOM_CONFIG.frameWidth

  // Adjust visual effects based on time of day
  const isDusk = currentPhase === DayPhase.DUSK
  const baseGlowClass = isDusk ? "mushroom-sprite-dusk" : "mushroom-sprite-night"
  const glowClass = mushroom.isGlowing ? "mushroom-sprite-glowing" : baseGlowClass

  // Calculate bubble position
  const getBubblePosition = () => {
    // Position bubble above the mushroom (80px above ground level to account for mushroom height)
    const baseTop = MUSHROOM_CONFIG.groundLevel - 80
    // Center bubble (assuming ~125px average bubble width) over mushroom center
    let baseLeft = mushroom.position + MUSHROOM_CONFIG.frameWidth / 2 - 62.5

    if (baseLeft < 10) baseLeft = 10
    if (baseLeft > 480 - 125) baseLeft = 480 - 125

    return { top: baseTop, left: baseLeft }
  }

  const bubblePosition = getBubblePosition()

  // Render aura effect for active mushroom
  const renderAura = () => {
    if (!isActive && !isHovered) return null

    return (
      <div
        className="mushroom-aura"
        style={{
          position: "absolute",
          top: MUSHROOM_CONFIG.groundLevel - 10,
          left: mushroom.position + MUSHROOM_CONFIG.frameWidth / 2 - 40,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(150,255,150,${isActive ? 0.3 : 0.15}) 0%, rgba(150,255,150,0) 70%)`,
          zIndex: 88,
          pointerEvents: "none",
          animation: "pulse-aura 2s infinite ease-in-out",
          opacity: isActive ? 1 : 0.7,
        }}
      />
    )
  }

  return (
    <div
      ref={mushroomRef}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: "pointer",
        position: "relative",
        zIndex: currentPhase === DayPhase.NIGHT ? 90 : 1000,
      }}
      className={isActive ? "active-mushroom" : ""}
    >
      {renderAura()}
      <div
        style={{
          position: "absolute",
          top: `${MUSHROOM_CONFIG.groundLevel}px`,
          left: `${mushroom.position}px`,
          width: `${MUSHROOM_CONFIG.frameWidth}px`,
          height: `${MUSHROOM_CONFIG.frameHeight}px`,
          background: `url(${currentImage}) ${backgroundOffsetX}px 0 no-repeat`,
          transform: mushroom.direction === -1 ? "scaleX(-1)" : "scaleX(1)",
          transformOrigin: "center center",
          filter: mushroom.isGlowing
            ? "drop-shadow(0 0 10px rgba(255,255,255,0.9)) brightness(1.3)"
            : isDusk
              ? "drop-shadow(0 0 3px rgba(255,200,150,0.3))"
              : "drop-shadow(0 0 3px rgba(255,255,255,0.3))",
          transition: mushroom.isGlowing ? "filter 0.2s ease-in" : "filter 0.5s ease-out, transform 0.2s ease",
          willChange: "background-position, transform, filter",
          imageRendering: "pixelated",
          zIndex: mushroom.isGlowing ? 96 : 89,
        }}
        className={`mushroom-sprite background-character ${glowClass}`}
      />

      {/* Bubble for mushroom */}
      {mushroom.bubble.visible && (
        <div
          style={{
            position: "absolute",
            top: bubblePosition.top,
            left: bubblePosition.left,
            zIndex: 1001,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bubble">
            {mushroom.bubble.menuState === "main" ? (
              <div className="slime-menu">
                {state.creatures.filter((c) => isMushroom(c)).length > 1 && (
                  <button className="slime-menu-btn remove" onClick={handleRemove} title="Remove">
                    ❌
                  </button>
                )}
              </div>
            ) : (
              mushroom.bubble.text
            )}
          </div>
        </div>
      )}

      {/* Active indicator */}
      {isActive && (
        <div
          className="active-indicator"
          style={{
            position: "absolute",
            top: MUSHROOM_CONFIG.groundLevel - 15,
            left: mushroom.position + MUSHROOM_CONFIG.frameWidth / 2 - 10,
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: "2px solid #90EE90",
            boxShadow: "0 0 5px rgba(144,238,144,0.8)",
            zIndex: 1002,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  )
}

export default Mushroom
