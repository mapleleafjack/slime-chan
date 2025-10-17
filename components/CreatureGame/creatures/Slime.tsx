"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import CreatureSprite from "../CreatureSprite"
import { useCreature } from "@/context/creatureContext"
import { isSlime, type SlimeData, type CreatureData } from "@/types/creatureTypes"
import { ANIMATION_CONFIG } from "../animationConfig"
import { getRandomPhrase } from "@/utils/gameUtils"
import { useBaseCreature, RenderCreature, type MenuHandlers } from "./BaseCreature"
import { SLIME_CREATURE_CONFIG } from "../creatureConfig"

interface SlimeProps {
  id: string
}

const Slime: React.FC<SlimeProps> = ({ id }) => {
  const { dispatch } = useCreature()

  // Preload all slime images on component mount
  useEffect(() => {
    const colors = ["blue", "red", "green"]
    const animations = ["idle", "walk", "jump"]

    colors.forEach((color) => {
      animations.forEach((animation) => {
        const img = new Image()
        img.src = `/assets/${color}/${animation}.png`
      })
    })
  }, [])

  // Jump animation logic
  const baseCreature = useBaseCreature({
    id,
    config: SLIME_CREATURE_CONFIG,
    enableKeyboardControls: true,
    stopOnClick: true,
    getCurrentImage: (creature: CreatureData) => {
      if (!isSlime(creature)) return ""
      if (creature.isJumping) return `/assets/${creature.color}/jump.png`
      if (creature.isWalking) return `/assets/${creature.color}/walk.png`
      return `/assets/${creature.color}/idle.png`
    },
    getCurrentFrame: (creature: CreatureData) => {
      if (!isSlime(creature)) return 0
      if (creature.isJumping) return creature.jumpFrame
      if (creature.isWalking) return creature.walkFrame
      return creature.idleFrame
    },
    getTotalFrames: (creature: CreatureData) => {
      if (!isSlime(creature)) return SLIME_CREATURE_CONFIG.totalIdleFrames
      if (creature.isJumping) return ANIMATION_CONFIG.totalJumpFrames
      if (creature.isWalking) return SLIME_CREATURE_CONFIG.totalWalkFrames
      return SLIME_CREATURE_CONFIG.totalIdleFrames
    },
    calculateTopPosition: (creature: CreatureData) => {
      if (!isSlime(creature) || !creature.isJumping) return SLIME_CREATURE_CONFIG.groundLevel
      const t = creature.jumpFrame / (ANIMATION_CONFIG.totalJumpFrames - 1)
      return SLIME_CREATURE_CONFIG.groundLevel - ANIMATION_CONFIG.jumpHeight * 4 * t * (1 - t)
    },
    getGreetingText: () => getRandomPhrase(),
    onCreatureClick: (creature: CreatureData) => {
      if (!isSlime(creature)) return
      // Stop slime completely when clicked
      dispatch({ type: "SET_JUMPING", payload: { id, value: false } })
      dispatch({ type: "SET_SLEEPING", payload: { id, value: false } })
    },
    renderSprite: ({ creature, config, currentImage, backgroundOffsetX, topPosition, isActive, isHovered }) => {
      if (!isSlime(creature)) return null
      return (
        <CreatureSprite
          color={creature.color}
          direction={creature.direction}
          currentImage={currentImage}
          backgroundOffsetX={backgroundOffsetX}
          topPosition={topPosition}
          x={creature.position}
          isActive={isActive}
          isHovered={isHovered}
        />
      )
    },
    renderMenu: (creature: CreatureData, handlers: MenuHandlers) => {
      if (!isSlime(creature)) return null
      return <SlimeMenu slime={creature} id={id} handlers={handlers} />
    },
  })

  const { creature, chatActive } = baseCreature

  // Slime-specific keyboard controls
  const handleKeyDownRef = useRef<(e: KeyboardEvent) => void | null>(null)
  const handleKeyUpRef = useRef<(e: KeyboardEvent) => void | null>(null)

  useEffect(() => {
    if (!creature || !isSlime(creature)) return

    handleKeyDownRef.current = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isTyping =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.getAttribute("contenteditable") === "true"

      if (baseCreature.state.activeCreatureId !== id || chatActive || isTyping) return

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

      if (baseCreature.state.activeCreatureId !== id || chatActive || isTyping) return

      if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
        e.preventDefault()
        dispatch({ type: "SET_WALKING", payload: { id, value: false } })
      }
    }
  }, [creature, dispatch, id, baseCreature.state.activeCreatureId, chatActive])

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

  // Jump animation frame increment
  useEffect(() => {
    if (!creature || !isSlime(creature) || !creature.isJumping) return

    const interval = setInterval(() => {
      dispatch({ type: "INCREMENT_JUMP_FRAME", payload: id })
    }, 1000 / SLIME_CREATURE_CONFIG.fps)

    return () => clearInterval(interval)
  }, [creature, dispatch, id])

  // Jump completion check
  useEffect(() => {
    if (!creature || !isSlime(creature)) return

    const jumpCompleted = creature.jumpFrame >= ANIMATION_CONFIG.totalJumpFrames - 1 && creature.isJumping
    if (jumpCompleted) {
      dispatch({ type: "SET_JUMPING", payload: { id, value: false } })
      if (creature.bubble.text === "ジャンプ！") {
        dispatch({ type: "HIDE_BUBBLE", payload: id })
      }
    }
  }, [creature, dispatch, id])

  if (!creature || !isSlime(creature)) return null

  const getCurrentImage = (c: CreatureData) => {
    if (!isSlime(c)) return ""
    if (c.isJumping) return `/assets/${c.color}/jump.png`
    if (c.isWalking) return `/assets/${c.color}/walk.png`
    return `/assets/${c.color}/idle.png`
  }

  const getCurrentFrame = (c: CreatureData) => {
    if (!isSlime(c)) return 0
    if (c.isJumping) return c.jumpFrame
    if (c.isWalking) return c.walkFrame
    return c.idleFrame
  }

  const renderSprite = ({ creature: c, config, currentImage, backgroundOffsetX, topPosition, isActive, isHovered }: any) => {
    if (!isSlime(c)) return null
    return (
      <CreatureSprite
        color={c.color}
        direction={c.direction}
        currentImage={currentImage}
        backgroundOffsetX={backgroundOffsetX}
        topPosition={topPosition}
        x={c.position}
        isActive={isActive}
        isHovered={isHovered}
      />
    )
  }

  const renderMenu = (c: CreatureData, handlers: MenuHandlers) => {
    if (!isSlime(c)) return null
    return <SlimeMenu slime={c} id={id} handlers={handlers} />
  }

  return (
    <RenderCreature
      baseCreature={baseCreature}
      renderSprite={renderSprite}
      renderMenu={renderMenu}
      config={SLIME_CREATURE_CONFIG}
      getCurrentImage={getCurrentImage}
      getCurrentFrame={getCurrentFrame}
    />
  )
}

// Slime Menu Component
const SlimeMenu: React.FC<{
  slime: SlimeData
  id: string
  handlers: MenuHandlers
}> = ({ slime, id, handlers }) => {
  const { state, dispatch } = useCreature()

  const handleColorMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: "SET_MENU_STATE", payload: { id, state: "color" } })
  }

  const handleBackToMainMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: "SET_MENU_STATE", payload: { id, state: "main" } })
  }

  const changeColor = (color: "blue" | "red" | "green", e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: "SET_SLIME_COLOR", payload: { id, color } })
    dispatch({ type: "SET_MENU_STATE", payload: { id, state: "main" } })
  }

  if (slime.bubble.menuState === "color") {
    return (
      <div className="color-menu horizontal">
        <div className="color-option blue" onClick={(e) => changeColor("blue", e)}>
          青
        </div>
        <div className="color-option red" onClick={(e) => changeColor("red", e)}>
          赤
        </div>
        <div className="color-option green" onClick={(e) => changeColor("green", e)}>
          緑
        </div>
        <button className="back-button" onClick={handleBackToMainMenu}>
          ↩️
        </button>
      </div>
    )
  }

  return (
    <div className="slime-menu">
      <button className="slime-menu-btn color" onClick={handleColorMenu} title="Change Color">
        🎨
      </button>
      {state.creatures.filter((c) => isSlime(c)).length > 1 && (
        <button className="slime-menu-btn remove" onClick={handlers.handleRemove} title="Remove">
          ❌
        </button>
      )}
    </div>
  )
}

export default Slime

