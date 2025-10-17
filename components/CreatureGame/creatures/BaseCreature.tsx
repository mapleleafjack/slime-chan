"use client"

import type React from "react"
import { useEffect, useRef, useState, ReactNode } from "react"
import { useCreature } from "@/context/creatureContext"
import { useDayCycle } from "@/context/dayCycleContext"
import { DayPhase } from "@/utils/gameUtils"
import type { CreatureData } from "@/types/creatureTypes"

export interface CreatureConfig {
  frameWidth: number
  frameHeight: number
  totalWalkFrames: number
  totalIdleFrames: number
  fps: number
  speed: number
  groundLevel: number
  bubbleOffset?: number  // Vertical offset for bubble positioning (default: 60)
  indicatorOffset?: number  // Vertical offset for active indicator (default: 20)
}

export interface BaseCreatureProps {
  id: string
  config: CreatureConfig
  // Visibility logic - can be overridden by subclasses
  isVisible?: (currentPhase: DayPhase) => boolean
  // Animation logic
  getCurrentImage: (creature: CreatureData) => string
  getCurrentFrame: (creature: CreatureData) => number
  getTotalFrames: (creature: CreatureData) => number
  // Position calculation - can be overridden for jumping, etc.
  calculateTopPosition?: (creature: CreatureData) => number
  // Greeting message
  getGreetingText: (creature: CreatureData) => string
  // Custom rendering
  renderSprite: (props: {
    creature: CreatureData
    config: CreatureConfig
    currentImage: string
    backgroundOffsetX: number
    topPosition: number
    isActive: boolean
    isHovered: boolean
    currentPhase: DayPhase
  }) => ReactNode
  // Custom menu rendering
  renderMenu: (creature: CreatureData, handlers: MenuHandlers) => ReactNode
  // Custom aura color
  getAuraColor?: (creature: CreatureData) => string
  // Custom click behavior
  onCreatureClick?: (creature: CreatureData) => void
  // Should creature stop on click?
  stopOnClick?: boolean
  // Enable keyboard controls?
  enableKeyboardControls?: boolean
}

export interface MenuHandlers {
  handleRemove: (e: React.MouseEvent) => void
  stopPropagation: (e: React.MouseEvent) => void
}

/**
 * Base creature component that handles common logic for all creatures
 * - Animation loops
 * - Movement
 * - Behavior changes
 * - Click handling
 * - Bubble rendering
 * - Active state management
 */
export const useBaseCreature = (props: BaseCreatureProps) => {
  const {
    id,
    config,
    isVisible: isVisibleProp,
    getCurrentImage,
    getCurrentFrame,
    getTotalFrames,
    calculateTopPosition: calculateTopPositionProp,
    getGreetingText,
    getAuraColor,
    onCreatureClick,
    stopOnClick = true,
    enableKeyboardControls = false,
  } = props

  const { state, dispatch } = useCreature()
  const { currentPhase } = useDayCycle()
  const [isHovered, setIsHovered] = useState(false)
  const [chatActive, setChatActive] = useState(false)
  
  const animationFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number>(0)
  const behaviorTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const creatureRef = useRef<HTMLDivElement>(null)

  // Find the creature data
  const creature = state.creatures.find((c) => c.id === id)
  const isActive = state.activeCreatureId === id

  // Default visibility is always visible
  const isVisible = isVisibleProp ? isVisibleProp(currentPhase) : true

  // Default position calculation
  const calculateTopPosition = calculateTopPositionProp || (() => config.groundLevel)

  // Track chat active state for keyboard controls
  useEffect(() => {
    if (!enableKeyboardControls) return
    
    const handleChatActive = (e: Event) => {
      // @ts-ignore
      setChatActive(e.detail?.active ?? false)
    }
    window.addEventListener("slime-chat-active", handleChatActive)
    return () => window.removeEventListener("slime-chat-active", handleChatActive)
  }, [enableKeyboardControls])

  // Preload images - can be called by subclass
  const preloadImage = (src: string) => {
    const img = new Image()
    img.src = src
  }

  // Handle animation and movement
  useEffect(() => {
    if (!isVisible || !creature) return

    const animate = (timestamp: number) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp
      const elapsed = timestamp - lastTimestampRef.current

      // Update at the desired frame rate
      if (elapsed > 1000 / config.fps) {
        // Update frame
        if (creature.isWalking) {
          dispatch({ type: "INCREMENT_WALK_FRAME", payload: id })
        } else {
          dispatch({ type: "INCREMENT_IDLE_FRAME", payload: id })
        }

        // Move if walking
        if (creature.isWalking) {
          const newPosition = creature.position + creature.direction * config.speed

          // Only change direction when hitting the border
          if (newPosition <= 0) {
            dispatch({ type: "SET_DIRECTION", payload: { id, value: 1 } })
            dispatch({ type: "SET_POSITION", payload: { id, value: 0 } })
          } else if (newPosition >= 480 - config.frameWidth) {
            dispatch({ type: "SET_DIRECTION", payload: { id, value: -1 } })
            dispatch({ type: "SET_POSITION", payload: { id, value: 480 - config.frameWidth } })
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
  }, [isVisible, creature?.isWalking, creature?.direction, creature?.position, dispatch, id, config.fps, config.speed, config.frameWidth])

  // Randomly change behavior
  useEffect(() => {
    if (!isVisible || !creature || creature.mode === "user") return

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
  }, [isVisible, dispatch, id, creature?.mode])

  // Handle click to select creature
  const handleClick = (e: React.MouseEvent) => {
    if (!creature) return
    e.stopPropagation()

    // Custom click behavior
    if (onCreatureClick) {
      onCreatureClick(creature)
    }

    // If clicking on already active creature, toggle menu
    if (isActive) {
      if (creature.bubble.menuState === "main") {
        dispatch({ type: "HIDE_ALL_BUBBLES", payload: undefined })
      } else {
        dispatch({ type: "SET_MENU_STATE", payload: { id, state: "main" } })
      }
      return
    }

    // Hide all bubbles first
    dispatch({ type: "HIDE_ALL_BUBBLES", payload: undefined })

    // Set this creature as active
    dispatch({ type: "SET_ACTIVE_CREATURE", payload: id })
    dispatch({ type: "SET_LAST_INTERACTION", payload: { id, value: Date.now() } })

    // Stop the creature when selected if specified
    if (stopOnClick) {
      dispatch({ type: "SET_WALKING", payload: { id, value: false } })
      dispatch({ type: "SET_MODE", payload: { id, value: "user" } })
    }

    // Show greeting
    dispatch({ type: "SHOW_BUBBLE", payload: { id, text: getGreetingText(creature) } })
  }

  const handleRemove = (e: React.MouseEvent) => {
    if (!creature) return
    e.stopPropagation()
    
    // Don't remove if it's the last creature of this type
    const sameTypeCount = state.creatures.filter((c) => c.creatureType === creature.creatureType).length
    if (sameTypeCount > 1) {
      dispatch({ type: "REMOVE_CREATURE", payload: id })
    }
  }

  // Calculate bubble position
  const getBubblePosition = () => {
    if (!creature) return { top: 0, left: 0 }
    
    const topPosition = calculateTopPosition(creature)
    // Position bubble above the creature with configurable offset
    const bubbleOffset = config.bubbleOffset ?? 60
    const baseTop = topPosition - bubbleOffset
    // Center bubble over creature's center point
    // We use the center of the creature and then CSS transform will center the bubble
    const baseLeft = creature.position + config.frameWidth / 2

    return { top: baseTop, left: baseLeft }
  }

  // Render aura effect for active creature
  const renderAura = () => {
    if (!creature || (!isActive && !isHovered)) return null

    const defaultColor = "255,255,255"
    const auraColor = getAuraColor ? getAuraColor(creature) : defaultColor
    
    // Scale aura size based on creature size
    const auraSize = Math.max(config.frameWidth, config.frameHeight) * 1.2

    return (
      <div
        className="creature-aura"
        style={{
          position: "absolute",
          top: calculateTopPosition(creature) + config.frameHeight / 2 - auraSize / 2,
          left: creature.position + config.frameWidth / 2 - auraSize / 2,
          width: auraSize,
          height: auraSize,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${auraColor},${isActive ? 0.3 : 0.15}) 0%, rgba(${auraColor},0) 70%)`,
          zIndex: 999,
          pointerEvents: "none",
          animation: "pulse-aura 2s infinite ease-in-out",
          opacity: isActive ? 1 : 0.7,
        }}
      />
    )
  }

  // Render active indicator
  const renderActiveIndicator = () => {
    if (!creature || !isActive) return null
    
    const indicatorOffset = config.indicatorOffset ?? 20

    return (
      <div
        className="active-indicator"
        style={{
          position: "absolute",
          top: calculateTopPosition(creature) - indicatorOffset,
          left: creature.position + config.frameWidth / 2 - 10,
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "2px solid white",
          boxShadow: "0 0 5px rgba(0,0,0,0.5)",
          zIndex: 1002,
          pointerEvents: "none",
        }}
      />
    )
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (behaviorTimeoutRef.current) {
        clearTimeout(behaviorTimeoutRef.current)
      }
    }
  }, [])

  return {
    creature,
    isActive,
    isVisible,
    isHovered,
    setIsHovered,
    chatActive,
    creatureRef,
    handleClick,
    handleRemove,
    getBubblePosition,
    renderAura,
    renderActiveIndicator,
    calculateTopPosition,
    preloadImage,
    dispatch,
    state,
    currentPhase,
  }
}

export interface RenderCreatureProps {
  baseCreature: ReturnType<typeof useBaseCreature>
  renderSprite: BaseCreatureProps["renderSprite"]
  renderMenu: BaseCreatureProps["renderMenu"]
  config: CreatureConfig
  getCurrentImage: BaseCreatureProps["getCurrentImage"]
  getCurrentFrame: BaseCreatureProps["getCurrentFrame"]
}

/**
 * Common rendering logic for creatures
 */
export const RenderCreature: React.FC<RenderCreatureProps> = ({
  baseCreature,
  renderSprite,
  renderMenu,
  config,
  getCurrentImage,
  getCurrentFrame,
}) => {
  const {
    creature,
    isActive,
    isVisible,
    isHovered,
    setIsHovered,
    creatureRef,
    handleClick,
    handleRemove,
    getBubblePosition,
    renderAura,
    renderActiveIndicator,
    calculateTopPosition,
    currentPhase,
  } = baseCreature

  if (!isVisible || !creature) return null

  const currentImage = getCurrentImage(creature)
  const currentFrame = getCurrentFrame(creature)
  const backgroundOffsetX = -currentFrame * config.frameWidth
  const bubblePosition = getBubblePosition()

  const menuHandlers: MenuHandlers = {
    handleRemove,
    stopPropagation: (e) => e.stopPropagation(),
  }

  return (
    <div
      ref={creatureRef}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: "pointer",
        position: "relative",
        zIndex: currentPhase === DayPhase.NIGHT ? 90 : 1000,
      }}
      className={isActive ? `active-${creature.creatureType}` : ""}
    >
      {renderAura()}
      {renderSprite({
        creature,
        config,
        currentImage,
        backgroundOffsetX,
        topPosition: calculateTopPosition(creature),
        isActive,
        isHovered,
        currentPhase,
      })}

      {/* Bubble */}
      {creature.bubble.visible && (
        <div
          style={{
            position: "absolute",
            top: bubblePosition.top,
            left: bubblePosition.left,
            transform: "translateX(-50%)", // Center the bubble horizontally
            zIndex: 1001,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bubble">
            {creature.bubble.menuState === "main" ? renderMenu(creature, menuHandlers) : creature.bubble.text}
          </div>
        </div>
      )}

      {renderActiveIndicator()}
    </div>
  )
}
