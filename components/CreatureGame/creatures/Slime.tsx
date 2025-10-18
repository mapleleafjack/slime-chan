"use client"

import { useEffect, useRef, useState } from "react"
import { useCreature, type CreatureAction } from "@/context/creatureContext"
import { isSlime, type SlimeData, type CreatureData, type SlimeColor } from "@/types/creatureTypes"
import BaseCreature, { type MenuHandlers, type CreatureMenuConfig } from "./BaseCreature"
import type { CreatureDefinition } from "./types"

export const SLIME_DEFINITION: CreatureDefinition = {
  type: "slime",
  displayName: "Slime",
  sprites: {
    blue: {
      frameWidth: 128,
      frameHeight: 128,
      animations: {
        idle: { path: "/assets/blue/idle.png", frameCount: 8 },
        walk: { path: "/assets/blue/walk.png", frameCount: 8 },
        jump: { path: "/assets/blue/jump.png", frameCount: 13 },
      },
    },
    red: {
      frameWidth: 128,
      frameHeight: 128,
      animations: {
        idle: { path: "/assets/red/idle.png", frameCount: 8 },
        walk: { path: "/assets/red/walk.png", frameCount: 8 },
        jump: { path: "/assets/red/jump.png", frameCount: 13 },
      },
    },
    green: {
      frameWidth: 128,
      frameHeight: 128,
      animations: {
        idle: { path: "/assets/green/idle.png", frameCount: 8 },
        walk: { path: "/assets/green/walk.png", frameCount: 8 },
        jump: { path: "/assets/green/jump.png", frameCount: 13 },
      },
    },
  },
  physics: { 
    speed: 2, 
    groundLevel: 500, 
    fps: 24,
    baseSpeed: 2,
    minSpeed: 1.5,
    maxSpeed: 3.5,
    jumpHeight: 50,
    idleJumpProbability: 0.3,
  },
  ui: { bubbleOffset: 60, indicatorOffset: 0 },
  capabilities: {
    canJump: true,
    canSleep: true,
    canTalk: true,
    canChangeColor: true,
    canGlow: false,
  },
  defaultGreeting: "Bloop!",
  auraColor: "255,255,255",
}

const getSlimeImage = (creature: SlimeData) => {
  const sprite = SLIME_DEFINITION.sprites[creature.color]
  if (creature.isJumping) return sprite.animations.jump!.path
  if (creature.isWalking) return sprite.animations.walk!.path
  return sprite.animations.idle!.path
}

const getSlimeFrame = (creature: SlimeData) => {
  if (creature.isJumping) return creature.jumpFrame
  if (creature.isWalking) return creature.walkFrame
  return creature.idleFrame
}

const getSlimeTopPosition = (creature: SlimeData) => {
  if (!creature.isJumping) return SLIME_DEFINITION.physics.groundLevel
  const jumpHeight = 50
  const jumpFrameCount = SLIME_DEFINITION.sprites[creature.color].animations.jump!.frameCount
  const t = creature.jumpFrame / (jumpFrameCount - 1)
  return SLIME_DEFINITION.physics.groundLevel - jumpHeight * 4 * t * (1 - t)
}

const getSlimeMenuConfig = (
  id: string,
  creature: SlimeData,
  allCreatures: CreatureData[],
  handlers: MenuHandlers,
  dispatch: React.Dispatch<CreatureAction>
): CreatureMenuConfig => {
  const sameTypeCount = allCreatures.filter((c) => c.creatureType === "slime").length

  return {
    mainActions: [
      {
        id: "color-blue",
        icon: "🔵",
        title: "Blue",
        onClick: (e) => {
          e.stopPropagation()
          dispatch({ type: "SET_SLIME_COLOR", payload: { id, color: "blue" as SlimeColor } })
        },
        isVisible: creature.capabilities.canChangeColor,
      },
      {
        id: "color-red",
        icon: "🔴",
        title: "Red",
        onClick: (e) => {
          e.stopPropagation()
          dispatch({ type: "SET_SLIME_COLOR", payload: { id, color: "red" as SlimeColor } })
        },
        isVisible: creature.capabilities.canChangeColor,
      },
      {
        id: "color-green",
        icon: "🟢",
        title: "Green",
        onClick: (e) => {
          e.stopPropagation()
          dispatch({ type: "SET_SLIME_COLOR", payload: { id, color: "green" as SlimeColor } })
        },
        isVisible: creature.capabilities.canChangeColor,
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

interface SlimeProps {
  id: string
}

const Slime: React.FC<SlimeProps> = ({ id }) => {
  const { dispatch, state } = useCreature()
  const creature = state.creatures.find((c) => c.id === id)
  const isActive = state.activeCreatureId === id
  const [chatActive, setChatActive] = useState(false)
  
  const handleKeyDownRef = useRef<((e: KeyboardEvent) => void) | null>(null)
  const handleKeyUpRef = useRef<((e: KeyboardEvent) => void) | null>(null)

  // Track chat active state for keyboard controls
  useEffect(() => {
    const handleChatActive = (e: Event) => {
      // @ts-expect-error - Custom event detail type
      setChatActive(e.detail?.active ?? false)
    }
    window.addEventListener("slime-chat-active", handleChatActive)
    return () => window.removeEventListener("slime-chat-active", handleChatActive)
  }, [])

  // Keyboard controls for active slime
  useEffect(() => {
    if (!creature || !isSlime(creature)) return

    handleKeyDownRef.current = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isTyping =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.getAttribute("contenteditable") === "true"

      if (!isActive || chatActive || isTyping) return

      dispatch({ type: "SET_LAST_INTERACTION", payload: { id, value: Date.now() } })
      dispatch({ type: "SET_MODE", payload: { id, value: "user" } })

      switch (e.code) {
        case "ArrowLeft":
          e.preventDefault()
          dispatch({ type: "SET_DIRECTION", payload: { id, value: -1 } })
          dispatch({ type: "SET_WALKING", payload: { id, value: true } })
          break
        case "ArrowRight":
          e.preventDefault()
          dispatch({ type: "SET_DIRECTION", payload: { id, value: 1 } })
          dispatch({ type: "SET_WALKING", payload: { id, value: true } })
          break
        case "Space":
          e.preventDefault()
          if (!creature.isJumping) {
            dispatch({ type: "SET_JUMPING", payload: { id, value: true } })
            dispatch({ type: "SHOW_BUBBLE", payload: { id, text: "ジャンプ！" } })
          }
          break
      }
    }

    handleKeyUpRef.current = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isTyping =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.getAttribute("contenteditable") === "true"

      if (!isActive || chatActive || isTyping) return

      if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
        e.preventDefault()
        dispatch({ type: "SET_WALKING", payload: { id, value: false } })
      }
    }
  }, [creature, dispatch, id, isActive, chatActive])

  useEffect(() => {
    const handleKeyDownWrapper = (e: KeyboardEvent) => {
      handleKeyDownRef.current?.(e)
    }

    const handleKeyUpWrapper = (e: KeyboardEvent) => {
      handleKeyUpRef.current?.(e)
    }

    window.addEventListener("keydown", handleKeyDownWrapper)
    window.addEventListener("keyup", handleKeyUpWrapper)

    return () => {
      window.removeEventListener("keydown", handleKeyDownWrapper)
      window.removeEventListener("keyup", handleKeyUpWrapper)
    }
  }, [])

  useEffect(() => {
    if (!creature || !isSlime(creature)) return
    const jumpAnimation = SLIME_DEFINITION.sprites[creature.color].animations.jump!
    const jumpCompleted = creature.jumpFrame >= jumpAnimation.frameCount - 1 && creature.isJumping
    if (jumpCompleted) {
      dispatch({ type: "SET_JUMPING", payload: { id, value: false } })
      if (creature.bubble.text === "ジャンプ！") {
        dispatch({ type: "HIDE_BUBBLE", payload: id })
      }
    }
  }, [creature, dispatch, id])

  if (!creature || !isSlime(creature)) return null

  return (
    <BaseCreature
      id={id}
      definition={SLIME_DEFINITION}
      getCurrentImage={(c) => isSlime(c) ? getSlimeImage(c) : ""}
      getCurrentFrame={(c) => isSlime(c) ? getSlimeFrame(c) : 0}
      calculateTopPosition={(c) => isSlime(c) ? getSlimeTopPosition(c) : SLIME_DEFINITION.physics.groundLevel}
      getMenuConfig={(c, all, handlers) => isSlime(c) ? getSlimeMenuConfig(id, c, all, handlers, dispatch) : { mainActions: [] }}
      onCreatureClick={(c) => {
        if (!isSlime(c)) return
        dispatch({ type: "SET_JUMPING", payload: { id, value: false } })
        dispatch({ type: "SET_SLEEPING", payload: { id, value: false } })
      }}
    />
  )
}

export default Slime
