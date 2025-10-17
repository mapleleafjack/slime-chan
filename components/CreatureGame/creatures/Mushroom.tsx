"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { useCreature } from "@/context/creatureContext"
import { isMushroom, type MushroomData, type CreatureData } from "@/types/creatureTypes"
import { DayPhase } from "@/utils/gameUtils"
import { useBaseCreature, RenderCreature, type MenuHandlers } from "./BaseCreature"
import { MUSHROOM_CREATURE_CONFIG } from "../creatureConfig"

const MUSHROOM_GLOW_DURATION = 1000

interface MushroomProps {
  id: string
}

const Mushroom: React.FC<MushroomProps> = ({ id }) => {
  const { dispatch } = useCreature()
  const glowTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Preload images to prevent flickering
  useEffect(() => {
    const walkImage = new Image()
    walkImage.src = "/assets/mushroom/walk.png"

    const idleImage = new Image()
    idleImage.src = "/assets/mushroom/idle.png"
  }, [])

  // Mushrooms are only visible during dusk and night
  const isVisibleFunc = (currentPhase: DayPhase) =>
    currentPhase === DayPhase.NIGHT || currentPhase === DayPhase.DUSK

  const baseCreature = useBaseCreature({
    id,
    config: MUSHROOM_CREATURE_CONFIG,
    isVisible: isVisibleFunc,
    enableKeyboardControls: false,
    stopOnClick: true,
    getCurrentImage: (creature: CreatureData) => {
      if (!isMushroom(creature)) return ""
      return creature.isWalking ? "/assets/mushroom/walk.png" : "/assets/mushroom/idle.png"
    },
    getCurrentFrame: (creature: CreatureData) => {
      if (!isMushroom(creature)) return 0
      return creature.isWalking ? creature.walkFrame : creature.idleFrame
    },
    getTotalFrames: (creature: CreatureData) => {
      if (!isMushroom(creature)) return MUSHROOM_CREATURE_CONFIG.totalIdleFrames
      return creature.isWalking ? MUSHROOM_CREATURE_CONFIG.totalWalkFrames : MUSHROOM_CREATURE_CONFIG.totalIdleFrames
    },
    getGreetingText: () => "✨ *glows softly*",
    getAuraColor: () => "150,255,150", // Green aura for mushrooms
    onCreatureClick: (creature: CreatureData) => {
      if (!isMushroom(creature)) return
      
      // Make it glow when selected
      if (glowTimeoutRef.current) {
        clearTimeout(glowTimeoutRef.current)
      }
      dispatch({ type: "SET_GLOWING", payload: { id, value: true } })
      dispatch({ type: "SET_GLOW_INTENSITY", payload: { id, value: 1 } })
    },
    renderSprite: ({ creature: c, config, currentImage, backgroundOffsetX, isActive, isHovered, currentPhase }) => {
      if (!isMushroom(c)) return null

      const isDusk = currentPhase === DayPhase.DUSK
      const baseGlowClass = isDusk ? "mushroom-sprite-dusk" : "mushroom-sprite-night"
      const glowClass = c.isGlowing ? "mushroom-sprite-glowing" : baseGlowClass

      return (
        <div
          style={{
            position: "absolute",
            top: `${config.groundLevel}px`,
            left: `${c.position}px`,
            width: `${config.frameWidth}px`,
            height: `${config.frameHeight}px`,
            background: `url(${currentImage}) ${backgroundOffsetX}px 0 no-repeat`,
            transform: c.direction === -1 ? "scaleX(-1)" : "scaleX(1)",
            transformOrigin: "center center",
            filter: c.isGlowing
              ? "drop-shadow(0 0 10px rgba(255,255,255,0.9)) brightness(1.3)"
              : isDusk
                ? "drop-shadow(0 0 3px rgba(255,200,150,0.3))"
                : "drop-shadow(0 0 3px rgba(255,255,255,0.3))",
            transition: c.isGlowing ? "filter 0.2s ease-in" : "filter 0.5s ease-out, transform 0.2s ease",
            willChange: "background-position, transform, filter",
            imageRendering: "pixelated",
            zIndex: c.isGlowing ? 96 : 89,
          }}
          className={`mushroom-sprite background-character ${glowClass}`}
        />
      )
    },
    renderMenu: (creature: CreatureData, handlers: MenuHandlers) => {
      if (!isMushroom(creature)) return null
      return <MushroomMenu mushroom={creature} id={id} handlers={handlers} />
    },
  })

  const { creature } = baseCreature

  // Clean up glow timeout on unmount
  useEffect(() => {
    return () => {
      if (glowTimeoutRef.current) {
        clearTimeout(glowTimeoutRef.current)
      }
    }
  }, [])

  if (!creature || !isMushroom(creature)) return null

  const getCurrentImage = (c: CreatureData) => {
    if (!isMushroom(c)) return ""
    return c.isWalking ? "/assets/mushroom/walk.png" : "/assets/mushroom/idle.png"
  }

  const getCurrentFrame = (c: CreatureData) => {
    if (!isMushroom(c)) return 0
    return c.isWalking ? c.walkFrame : c.idleFrame
  }

  const renderSprite = ({ creature: c, config, currentImage, backgroundOffsetX, isActive, isHovered, currentPhase }: any) => {
    if (!isMushroom(c)) return null

    const isDusk = currentPhase === DayPhase.DUSK
    const baseGlowClass = isDusk ? "mushroom-sprite-dusk" : "mushroom-sprite-night"
    const glowClass = c.isGlowing ? "mushroom-sprite-glowing" : baseGlowClass

    return (
      <div
        style={{
          position: "absolute",
          top: `${config.groundLevel}px`,
          left: `${c.position}px`,
          width: `${config.frameWidth}px`,
          height: `${config.frameHeight}px`,
          background: `url(${currentImage}) ${backgroundOffsetX}px 0 no-repeat`,
          transform: c.direction === -1 ? "scaleX(-1)" : "scaleX(1)",
          transformOrigin: "center center",
          filter: c.isGlowing
            ? "drop-shadow(0 0 10px rgba(255,255,255,0.9)) brightness(1.3)"
            : isDusk
              ? "drop-shadow(0 0 3px rgba(255,200,150,0.3))"
              : "drop-shadow(0 0 3px rgba(255,255,255,0.3))",
          transition: c.isGlowing ? "filter 0.2s ease-in" : "filter 0.5s ease-out, transform 0.2s ease",
          willChange: "background-position, transform, filter",
          imageRendering: "pixelated",
          zIndex: c.isGlowing ? 96 : 89,
        }}
        className={`mushroom-sprite background-character ${glowClass}`}
      />
    )
  }

  const renderMenu = (c: CreatureData, handlers: MenuHandlers) => {
    if (!isMushroom(c)) return null
    return <MushroomMenu mushroom={c} id={id} handlers={handlers} />
  }

  return (
    <RenderCreature
      baseCreature={baseCreature}
      renderSprite={renderSprite}
      renderMenu={renderMenu}
      config={MUSHROOM_CREATURE_CONFIG}
      getCurrentImage={getCurrentImage}
      getCurrentFrame={getCurrentFrame}
    />
  )
}

// Mushroom Menu Component
const MushroomMenu: React.FC<{
  mushroom: MushroomData
  id: string
  handlers: MenuHandlers
}> = ({ mushroom, id, handlers }) => {
  const { state } = useCreature()

  return (
    <div className="slime-menu">
      {state.creatures.filter((c) => isMushroom(c)).length > 1 && (
        <button className="slime-menu-btn remove" onClick={handlers.handleRemove} title="Remove">
          ❌
        </button>
      )}
    </div>
  )
}

export default Mushroom
