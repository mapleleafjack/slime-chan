"use client"

import { useEffect, useRef } from "react"
import { useCreature, type CreatureAction } from "@/context/creatureContext"
import { isMushroom, type MushroomData, type CreatureData } from "@/types/creatureTypes"
import { DayPhase } from "@/utils/gameUtils"
import BaseCreature, { type MenuHandlers, type CreatureMenuConfig } from "./BaseCreature"
import type { CreatureDefinition } from "./types"

export const MUSHROOM_DEFINITION: CreatureDefinition = {
  type: "mushroom",
  displayName: "Mushroom",
  sprites: {
    default: {
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { path: "/assets/mushroom/idle.png", frameCount: 9 },
        walk: { path: "/assets/mushroom/walk.png", frameCount: 4 },
      },
    },
  },
  physics: { 
    speed: 0.5, 
    groundLevel: 490, 
    fps: 12,
    baseSpeed: 0.5,
    minSpeed: 0.3,
    maxSpeed: 0.8,
  },
  ui: { bubbleOffset: 80, indicatorOffset: 30 },
  capabilities: {
    canJump: false,
    canGlow: true,
    canSleep: false,
    canTalk: true,
    canChangeColor: false,
  },
  defaultGreeting: "✨ *glows softly*",
  auraColor: "150,255,150",
}

const getMushroomImage = (creature: MushroomData) => {
  const sprite = MUSHROOM_DEFINITION.sprites.default
  return creature.isWalking ? sprite.animations.walk!.path : sprite.animations.idle!.path
}

const getMushroomFrame = (creature: MushroomData) => {
  return creature.isWalking ? creature.walkFrame : creature.idleFrame
}

const getMushroomMenuConfig = (
  id: string,
  creature: MushroomData,
  allCreatures: CreatureData[],
  handlers: MenuHandlers,
  dispatch: React.Dispatch<CreatureAction>
): CreatureMenuConfig => {
  const sameTypeCount = allCreatures.filter((c) => c.creatureType === "mushroom").length

  return {
    mainActions: [
      {
        id: "glow",
        icon: "✨",
        title: "Toggle Glow",
        onClick: (e) => {
          e.stopPropagation()
          const newGlowState = !creature.isGlowing
          dispatch({ type: "SET_GLOWING", payload: { id, value: newGlowState } })
          dispatch({ type: "SET_GLOW_INTENSITY", payload: { id, value: newGlowState ? 1 : 0 } })
          dispatch({ 
            type: "SHOW_BUBBLE", 
            payload: { id, text: newGlowState ? "✨ *glowing*" : "*glow fades*" } 
          })
          setTimeout(() => dispatch({ type: "HIDE_BUBBLE", payload: id }), 2000)
        },
        isVisible: creature.capabilities.canGlow,
      },
      {
        id: "remove",
        icon: "❌",
        title: "Remove",
        onClick: (e) => handlers.handleRemove(e),
        isVisible: sameTypeCount > 1,
      },
    ],
  }
}

interface MushroomProps {
  id: string
}

const Mushroom: React.FC<MushroomProps> = ({ id }) => {
  const { dispatch, state } = useCreature()
  const glowTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const creature = state.creatures.find((c) => c.id === id)

  useEffect(() => {
    return () => {
      if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current)
    }
  }, [])

  if (!creature || !isMushroom(creature)) return null

  return (
    <BaseCreature
      id={id}
      definition={MUSHROOM_DEFINITION}
      getCurrentImage={(c) => isMushroom(c) ? getMushroomImage(c) : ""}
      getCurrentFrame={(c) => isMushroom(c) ? getMushroomFrame(c) : 0}
      getMenuConfig={(c, all, handlers) => isMushroom(c) ? getMushroomMenuConfig(id, c, all, handlers, dispatch) : { mainActions: [] }}
      isVisible={(currentPhase) => currentPhase === DayPhase.NIGHT || currentPhase === DayPhase.DUSK}
      onCreatureClick={(c) => {
        if (!isMushroom(c)) return
        if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current)
        dispatch({ type: "SET_GLOWING", payload: { id, value: true } })
        dispatch({ type: "SET_GLOW_INTENSITY", payload: { id, value: 1 } })
      }}
      getCustomSpriteProps={(c, currentPhase) => {
        if (!isMushroom(c)) return {}
        const isDusk = currentPhase === DayPhase.DUSK
        const customFilter = c.isGlowing
          ? "drop-shadow(0 0 10px rgba(255,255,255,0.9)) brightness(1.3)"
          : isDusk
            ? "drop-shadow(0 0 3px rgba(255,200,150,0.3))"
            : "drop-shadow(0 0 3px rgba(255,255,255,0.3))"
        const customClassName = c.isGlowing ? "mushroom-sprite-glowing" : ""
        return { customFilter, customClassName }
      }}
    />
  )
}

export default Mushroom
