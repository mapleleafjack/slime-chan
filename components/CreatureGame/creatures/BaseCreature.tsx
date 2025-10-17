"use client"

import type React from "react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useCreature } from "@/context/creatureContext"
import { useDayCycle } from "@/context/dayCycleContext"
import { DayPhase } from "@/utils/gameUtils"
import type { CreatureData } from "@/types/creatureTypes"
import type { CreatureDefinition } from "./types"

export type MenuAction = {
  id: string
  icon: string
  title: string
  onClick: (e: React.MouseEvent) => void
  isVisible?: boolean
}

export interface CreatureMenuConfig {
  mainActions: MenuAction[]
}

export interface MenuHandlers {
  handleRemove: (e: React.MouseEvent) => void
}

export interface BaseCreatureProps {
  id: string
  definition: CreatureDefinition
  getCurrentImage: (creature: CreatureData) => string
  getCurrentFrame: (creature: CreatureData) => number
  calculateTopPosition?: (creature: CreatureData) => number
  getMenuConfig: (creature: CreatureData, allCreatures: CreatureData[], handlers: MenuHandlers) => CreatureMenuConfig
  isVisible?: (currentPhase: DayPhase) => boolean
  onCreatureClick?: (creature: CreatureData) => void
  getCustomSpriteProps?: (creature: CreatureData, currentPhase: DayPhase) => { customFilter?: string; customClassName?: string }
  renderChildren?: (creature: CreatureData) => ReactNode
}

const BaseCreature: React.FC<BaseCreatureProps> = (props) => {
  const { id, definition, getCurrentImage, getCurrentFrame, calculateTopPosition, getMenuConfig, isVisible: isVisibleProp, onCreatureClick, getCustomSpriteProps, renderChildren } = props
  
  const { state, dispatch } = useCreature()
  const { currentPhase } = useDayCycle()
  const [isHovered, setIsHovered] = useState(false)

  const animationFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number>(0)
  const behaviorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const creature = state.creatures.find((c) => c.id === id)
  const isActive = state.activeCreatureId === id
  const isVisible = isVisibleProp ? isVisibleProp(currentPhase) : true

  const defaultTopPosition = definition.physics.groundLevel
  const calcTopPosition = calculateTopPosition || (() => defaultTopPosition)

  useEffect(() => {
    Object.values(definition.sprites).forEach((sprite) => {
      Object.values(sprite.animations).forEach((animation) => {
        const img = new Image()
        img.src = animation.path
      })
    })
  }, [definition])

  useEffect(() => {
    if (!isVisible || !creature) return

    const animate = (timestamp: number) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp
      const elapsed = timestamp - lastTimestampRef.current

      if (elapsed > 1000 / definition.physics.fps) {
        // Handle animation frame updates - check jumping first for slimes
        if (creature.creatureType === "slime" && "isJumping" in creature && creature.isJumping) {
          dispatch({ type: "INCREMENT_JUMP_FRAME", payload: id })
        } else if (creature.isWalking) {
          dispatch({ type: "INCREMENT_WALK_FRAME", payload: id })
        } else {
          dispatch({ type: "INCREMENT_IDLE_FRAME", payload: id })
        }

        if (creature.isWalking) {
          const newPosition = creature.position + creature.direction * definition.physics.speed
          const sprite = definition.sprites[creature.color]

          if (newPosition <= 0) {
            dispatch({ type: "SET_DIRECTION", payload: { id, value: 1 } })
            dispatch({ type: "SET_POSITION", payload: { id, value: 0 } })
          } else if (newPosition >= 480 - sprite.frameWidth) {
            dispatch({ type: "SET_DIRECTION", payload: { id, value: -1 } })
            dispatch({ type: "SET_POSITION", payload: { id, value: 480 - sprite.frameWidth } })
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
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isVisible, creature?.isWalking, creature?.creatureType, creature && "isJumping" in creature ? creature.isJumping : false, creature?.direction, creature?.position, dispatch, id, definition])

  useEffect(() => {
    if (!isVisible || !creature || creature.mode === "user") return

    const changeBehavior = () => {
      const shouldWalk = Math.random() < 0.8
      dispatch({ type: "SET_WALKING", payload: { id, value: shouldWalk } })

      const delay = shouldWalk ? Math.random() * 3000 + 3000 : Math.random() * 1000 + 1000
      behaviorTimeoutRef.current = setTimeout(changeBehavior, delay)
    }

    changeBehavior()
    return () => {
      if (behaviorTimeoutRef.current) clearTimeout(behaviorTimeoutRef.current)
    }
  }, [isVisible, dispatch, id, creature?.mode])

  const handleClick = (e: React.MouseEvent) => {
    if (!creature) return
    e.stopPropagation()

    if (onCreatureClick) onCreatureClick(creature)

    if (isActive) {
      if (creature.bubble.menuState === "main") {
        dispatch({ type: "HIDE_ALL_BUBBLES", payload: undefined })
      } else {
        dispatch({ type: "SET_MENU_STATE", payload: { id, state: "main" } })
      }
      return
    }

    dispatch({ type: "HIDE_ALL_BUBBLES", payload: undefined })
    dispatch({ type: "SET_ACTIVE_CREATURE", payload: id })
    dispatch({ type: "SET_LAST_INTERACTION", payload: { id, value: Date.now() } })
    dispatch({ type: "SET_WALKING", payload: { id, value: false } })
    dispatch({ type: "SET_MODE", payload: { id, value: "user" } })
    dispatch({ type: "SHOW_BUBBLE", payload: { id, text: definition.defaultGreeting } })
  }

  const handleRemove = (e: React.MouseEvent) => {
    if (!creature) return
    e.stopPropagation()
    const sameTypeCount = state.creatures.filter((c) => c.creatureType === creature.creatureType).length
    if (sameTypeCount > 1) {
      dispatch({ type: "REMOVE_CREATURE", payload: id })
    }
  }

  if (!isVisible || !creature) return null

  const currentImage = getCurrentImage(creature)
  const currentFrame = getCurrentFrame(creature)
  const sprite = definition.sprites[creature.color]
  const backgroundOffsetX = -currentFrame * sprite.frameWidth
  const topPosition = calcTopPosition(creature)

  const bubbleTop = topPosition - definition.ui.bubbleOffset
  const bubbleLeft = creature.position + sprite.frameWidth / 2

  const customProps = getCustomSpriteProps?.(creature, currentPhase) || {}
  const menuConfig = getMenuConfig(creature, state.creatures, { handleRemove })

  const auraColor = definition.auraColor || "255,255,255"
  const auraSize = Math.max(sprite.frameWidth, sprite.frameHeight) * 1.2

  const isNight = currentPhase === DayPhase.NIGHT
  const isDusk = currentPhase === DayPhase.DUSK
  
  let glowFilter = ""
  if (customProps.customFilter) {
    glowFilter = customProps.customFilter
  } else {
    if (isNight) {
      glowFilter = isActive
        ? "drop-shadow(0 0 8px rgba(255,255,255,0.8)) drop-shadow(0 0 12px rgba(255,255,255,0.4))"
        : isHovered
          ? "drop-shadow(0 0 7px rgba(255,255,255,0.7)) drop-shadow(0 0 11px rgba(255,255,255,0.35))"
          : "drop-shadow(0 0 6px rgba(255,255,255,0.6)) drop-shadow(0 0 10px rgba(255,255,255,0.3))"
    } else if (isDusk) {
      glowFilter = "drop-shadow(0 0 3px rgba(255,200,150,0.3))"
    } else {
      glowFilter = isActive
        ? "drop-shadow(0 0 5px rgba(255,255,255,0.7))"
        : isHovered
          ? "drop-shadow(0 0 4.5px rgba(255,255,255,0.6))"
          : "drop-shadow(0 0 4px rgba(255,255,255,0.5))"
    }
  }

  const brightnessFilter = isActive ? "brightness(1.15)" : isHovered ? "brightness(1.1)" : "brightness(1.0)"
  const filterStyle = `${glowFilter} ${brightnessFilter}`

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: "pointer", position: "relative", zIndex: currentPhase === DayPhase.NIGHT ? 90 : 1000 }}
      className={isActive ? `active-${creature.creatureType}` : ""}
    >
      {(isActive || isHovered) && (
        <div
          className="creature-aura"
          style={{
            position: "absolute",
            top: topPosition + sprite.frameHeight / 2 - auraSize / 2,
            left: creature.position + sprite.frameWidth / 2 - auraSize / 2,
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
      )}

      <div
        style={{
          position: "absolute",
          top: `${topPosition}px`,
          left: `${creature.position}px`,
          width: `${sprite.frameWidth}px`,
          height: `${sprite.frameHeight}px`,
          background: `url(${currentImage}) ${backgroundOffsetX}px 0 no-repeat`,
          transform: creature.direction === -1 ? "scaleX(-1)" : "scaleX(1)",
          transformOrigin: "center center",
          filter: filterStyle,
          transition: "filter 0.3s ease, transform 0.2s ease",
          willChange: "background-position, transform, filter",
          imageRendering: "pixelated",
        }}
        className={`creature-sprite ${creature.creatureType}-sprite ${customProps.customClassName || ""}`.trim()}
      />

      {creature.bubble.visible && (
        <div
          style={{
            position: "absolute",
            top: bubbleTop,
            left: bubbleLeft,
            transform: "translateX(-50%)",
            zIndex: 1001,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bubble">
            {creature.bubble.menuState === "main" ? (
              <div className="slime-menu">
                {menuConfig.mainActions.map((action) => {
                  const visible = action.isVisible !== undefined ? action.isVisible : true
                  if (!visible) return null
                  return (
                    <button
                      key={action.id}
                      className={`slime-menu-btn ${action.id}`}
                      onClick={action.onClick}
                      title={action.title}
                    >
                      {action.icon}
                    </button>
                  )
                })}
              </div>
            ) : isActive ? (
              <span>
                {creature.firstName || definition.displayName}
              </span>
            ) : (
              <span>
                {creature.bubble.text}
              </span>
            )}
          </div>
        </div>
      )}

      {isActive && (
        <div
          className="active-indicator"
          style={{
            position: "absolute",
            top: topPosition - definition.ui.indicatorOffset,
            left: creature.position + sprite.frameWidth / 2 - 10,
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: "2px solid white",
            boxShadow: "0 0 5px rgba(0,0,0,0.5)",
            zIndex: 1002,
            pointerEvents: "none",
          }}
        />
      )}

      {renderChildren?.(creature)}
    </div>
  )
}

export default BaseCreature
