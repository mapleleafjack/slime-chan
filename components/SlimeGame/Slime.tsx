"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import SlimeSprite from "./SlimeSprite"
import { useSlime } from "@/context/slimeContext"
import { useDayCycle } from "@/context/dayCycleContext"
import { ANIMATION_CONFIG } from "./animationConfig"
import { DayPhase } from "@/utils/slimeUtils"
// Import getRandomPhrase at the top of the file
import { getRandomPhrase } from "@/utils/slimeUtils"

interface SlimeProps {
  id: string
}

const Slime: React.FC<SlimeProps> = ({ id }) => {
  const { state, dispatch } = useSlime()
  const { currentPhase } = useDayCycle()
  const [isHovered, setIsHovered] = useState(false)
  const slimeRef = useRef<HTMLDivElement>(null)

  // Find the slime data
  const slime = state.slimes.find((s) => s.id === id)
  if (!slime) return null

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

  const handleClick = (e: React.MouseEvent) => {
    // Stop event propagation to prevent deselection
    e.stopPropagation()

    // If clicking on already active slime, toggle menu/chat
    if (isActive) {
      // Toggle between menu and greeting
      if (slime.bubble.menuState === "main") {
        dispatch({ type: "HIDE_ALL_BUBBLES", payload: undefined })
      } else {
        dispatch({ type: "SET_MENU_STATE", payload: { id, state: "main" } })
      }
      return
    }

    // Hide all bubbles first
    dispatch({ type: "HIDE_ALL_BUBBLES", payload: undefined })

    // Set this slime as active
    dispatch({ type: "SET_ACTIVE_SLIME", payload: id })
    dispatch({ type: "SET_LAST_INTERACTION", payload: { id, value: Date.now() } })

    // Immediately stop the slime when selected
    dispatch({ type: "SET_WALKING", payload: { id, value: false } })
    dispatch({ type: "SET_JUMPING", payload: { id, value: false } })
    dispatch({ type: "SET_SLEEPING", payload: { id, value: false } })
    dispatch({ type: "SET_MODE", payload: { id, value: "user" } })

    // Show greeting
    dispatch({ type: "SHOW_BUBBLE", payload: { id, text: getRandomPhrase() } })
  }

  const handleColorMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: "SET_MENU_STATE", payload: { id, state: "color" } })
  }

  const handleBackToMainMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: "SET_MENU_STATE", payload: { id, state: "main" } })
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Don't remove the last slime
    if (state.slimes.length > 1) {
      dispatch({ type: "REMOVE_SLIME", payload: id })
    }
  }

  const changeColor = (color: "blue" | "red" | "green", e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: "SET_SLIME_COLOR", payload: { id, color } })
    dispatch({ type: "SET_MENU_STATE", payload: { id, state: "main" } })
  }

  const handleKeyDownRef = useRef<(e: KeyboardEvent) => void | null>(null)
  const handleKeyUpRef = useRef<(e: KeyboardEvent) => void | null>(null)
  const handleKeyDownRefCallback = useRef<(e: KeyboardEvent) => void | null>(null)
  const handleKeyUpRefCallback = useRef<(e: KeyboardEvent) => void | null>(null)

  // Track chat active state
  const [chatActive, setChatActive] = useState(false)

  useEffect(() => {
    const handleChatActive = (e: Event) => {
      // @ts-ignore
      setChatActive(e.detail?.active ?? false)
    }
    window.addEventListener("slime-chat-active", handleChatActive)
    return () => window.removeEventListener("slime-chat-active", handleChatActive)
  }, [])

  // Keyboard controls (only work when slime is selected and chat is NOT active)
  useEffect(() => {
    handleKeyDownRef.current = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const activeElement = document.activeElement
      const isTyping = activeElement?.tagName === 'INPUT' || 
                       activeElement?.tagName === 'TEXTAREA' ||
                       activeElement?.getAttribute('contenteditable') === 'true'
      
      // Only handle keyboard controls for the selected slime and when chat is not active
      if (state.activeSlimeId !== id || chatActive || isTyping) return

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
          if (!slime.isJumping) {
            dispatch({ type: "SET_JUMPING", payload: { id, value: true } })
            dispatch({ type: "SHOW_BUBBLE", payload: { id, text: "ジャンプ！" } })
            // Note: We don't stop walking here, allowing diagonal jumps
          }
          break
      }
    }

    handleKeyUpRef.current = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const activeElement = document.activeElement
      const isTyping = activeElement?.tagName === 'INPUT' || 
                       activeElement?.tagName === 'TEXTAREA' ||
                       activeElement?.getAttribute('contenteditable') === 'true'
      
      // Only handle keyboard controls for the selected slime and when chat is not active
      if (state.activeSlimeId !== id || chatActive || isTyping) return

      if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
        e.preventDefault()
        dispatch({ type: "SET_WALKING", payload: { id, value: false } })
      }
    }
  }, [dispatch, id, slime.isJumping, state.activeSlimeId, chatActive])

  useEffect(() => {
    handleKeyDownRefCallback.current = (e: KeyboardEvent) => {
      if (handleKeyDownRef.current) {
        handleKeyDownRef.current(e)
      }
    }

    handleKeyUpRefCallback.current = (e: KeyboardEvent) => {
      if (handleKeyUpRef.current) {
        handleKeyUpRef.current(e)
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDownWrapper = (e: KeyboardEvent) => {
      if (handleKeyDownRefCallback.current) {
        handleKeyDownRefCallback.current(e)
      }
    }

    const handleKeyUpWrapper = (e: KeyboardEvent) => {
      if (handleKeyUpRefCallback.current) {
        handleKeyUpRefCallback.current(e)
      }
    }

    window.addEventListener("keydown", handleKeyDownWrapper)
    window.addEventListener("keyup", handleKeyUpWrapper)

    return () => {
      window.removeEventListener("keydown", handleKeyDownWrapper)
      window.removeEventListener("keyup", handleKeyUpWrapper)
    }
  }, [])

  // Jump completion check
  useEffect(() => {
    const jumpCompleted = slime.jumpFrame >= ANIMATION_CONFIG.totalJumpFrames - 1 && slime.isJumping
    if (jumpCompleted) {
      dispatch({ type: "SET_JUMPING", payload: { id, value: false } })
      if (slime.bubble.text === "ジャンプ！") {
        dispatch({ type: "HIDE_BUBBLE", payload: id })
      }
    }
  }, [slime.jumpFrame, slime.isJumping, slime.bubble.text, dispatch, id])

  // Calculate jump position
  const calculateTopPosition = () => {
    if (!slime.isJumping) return ANIMATION_CONFIG.groundLevel
    const t = slime.jumpFrame / (ANIMATION_CONFIG.totalJumpFrames - 1)
    return ANIMATION_CONFIG.groundLevel - ANIMATION_CONFIG.jumpHeight * 4 * t * (1 - t)
  }

  // Get current animation frame
  const getCurrentImage = () => {
    if (slime.isJumping) return `/assets/${slime.color}/jump.png`
    if (slime.isWalking) return `/assets/${slime.color}/walk.png`
    return `/assets/${slime.color}/idle.png`
  }

  const backgroundOffsetX =
    -(slime.isJumping ? slime.jumpFrame : slime.isWalking ? slime.walkFrame : slime.idleFrame) *
    ANIMATION_CONFIG.frameWidth

  // Calculate bubble position to ensure it stays on screen and is closer to the slime
  const getBubblePosition = () => {
    // Position bubble above the slime (30px above)
    const baseTop = calculateTopPosition() - 30

    // Center the bubble over the slime
    let baseLeft = slime.position + ANIMATION_CONFIG.frameWidth / 2 - 50

    // Adjust if too close to left edge
    if (baseLeft < 10) {
      baseLeft = 10
    }

    // Adjust if too close to right edge
    if (baseLeft > 480 - 110) {
      // Game width - bubble width
      baseLeft = 480 - 110
    }

    return {
      top: baseTop,
      left: baseLeft,
    }
  }

  const bubblePosition = getBubblePosition()
  const isActive = state.activeSlimeId === id

  // Add aura effect for active slime
  const renderAura = () => {
    if (!isActive && !isHovered) return null

    return (
      <div
        className="slime-aura"
        style={{
          position: "absolute",
          top: calculateTopPosition() - 10,
          left: slime.position + ANIMATION_CONFIG.frameWidth / 2 - 70,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,255,255,${isActive ? 0.2 : 0.1}) 0%, rgba(255,255,255,0) 70%)`,
          zIndex: 999,
          pointerEvents: "none",
          animation: "pulse-aura 2s infinite ease-in-out",
          opacity: isActive ? 1 : 0.7,
        }}
      />
    )
  }

  return (
    <div
      ref={slimeRef}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: "pointer",
        position: "relative",
        zIndex: currentPhase === DayPhase.NIGHT ? 90 : 1000,
      }}
      className={isActive ? "active-slime" : ""}
    >
      {renderAura()}
      <SlimeSprite
        color={slime.color}
        direction={slime.direction}
        currentImage={getCurrentImage()}
        backgroundOffsetX={backgroundOffsetX}
        topPosition={calculateTopPosition()}
        x={slime.position}
        isActive={isActive}
        isHovered={isHovered}
      />

      {slime.bubble.visible && (
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
            {slime.bubble.menuState === "main" ? (
              <div className="slime-menu">
                <button className="slime-menu-btn color" onClick={handleColorMenu} title="Change Color">
                  🎨
                </button>
                {state.slimes.length > 1 && (
                  <button className="slime-menu-btn remove" onClick={handleRemove} title="Remove">
                    ❌
                  </button>
                )}
              </div>
            ) : slime.bubble.menuState === "color" ? (
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
            ) : slime.bubble.menuState === "chat" ? (
              slime.bubble.text
            ) : (
              slime.bubble.text
            )}
          </div>
        </div>
      )}

      {isActive && (
        <div
          className="active-indicator"
          style={{
            position: "absolute",
            top: calculateTopPosition() + 60, // Position between slime and bubble
            left: slime.position + ANIMATION_CONFIG.frameWidth / 2 - 10,
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: "2px solid white",
            boxShadow: "0 0 5px rgba(0,0,0,0.5)",
            zIndex: 1002,
            pointerEvents: "none",
          }}
        ></div>
      )}
    </div>
  )
}

export default Slime
