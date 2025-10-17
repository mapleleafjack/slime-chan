"use client"

import React, { useState, useEffect, useRef } from "react"
import { useCreature } from "@/context/creatureContext"
import { isSlime } from "@/types/creatureTypes"
import { useCreatureAI } from "@/hooks/useCreatureAI"
import { Button, Card } from "pixel-retroui"

const ChatInput: React.FC = () => {
  const { state, dispatch } = useCreature()
  const [message, setMessage] = useState("")
  const [chatActive, setChatActive] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const activeCreature = state.creatures.find((c) => c.id === state.activeCreatureId)
  // Only slimes can talk - check capabilities
  const canTalk = activeCreature?.capabilities.canTalk ?? false
  const activeSlime = activeCreature && isSlime(activeCreature) ? activeCreature : null
  const { handleUserMessage } = useCreatureAI(state.activeCreatureId || "")

  // Broadcast chat active state whenever it changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("slime-chat-active", { detail: { active: chatActive } }))
  }, [chatActive])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent("slime-chat-active", { detail: { active: false } }))
    }
  }, [])

  // Handle ESC key to deselect slime
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeSlime) {
        handleClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeSlime])

  // Only show when a creature that can talk is selected
  if (!activeCreature || !canTalk) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !state.activeCreatureId) return

    const messageToSend = message.trim()
    setMessage("")

    await handleUserMessage(messageToSend)
    // Keep chat active (focused) after sending so user can continue typing
  }

  const handleClose = () => {
    if (!state.activeCreatureId) return
    dispatch({ type: "SET_ACTIVE_CREATURE", payload: null })
    dispatch({ type: "HIDE_ALL_BUBBLES", payload: undefined })
    setMessage("")
    setChatActive(false)
  }

  const getPlaceholder = () => {
    const personalities: Record<string, string> = {
      playful: "Play with me!",
      shy: "Say hello gently...",
      energetic: "Let's go! What's up?",
      calm: "How are you feeling?",
      curious: "Ask me anything!",
      sleepy: "Wake me up softly...",
    }
    return personalities[activeCreature?.personality ?? ""] || "Talk to your slime..."
  }

  const getCreatureIcon = (): string => {
    if (!activeSlime) return "🍄"
    return activeSlime.color === "blue" ? "🔵" : activeSlime.color === "red" ? "🔴" : "🟢"
  }

  const getCreatureColor = (): string => {
    if (!activeSlime) return "#90EE90"
    return activeSlime.color === "blue" ? "#5499C7" : activeSlime.color === "red" ? "#E74C3C" : "#52C41A"
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1100,
        width: "90%",
        maxWidth: "600px",
      }}
    >
      <Card
        bg="rgba(0, 0, 0, 0.9)"
        borderColor="rgba(255,255,255,0.3)"
        style={{
          padding: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        }}
      >
        <form onSubmit={handleSubmit} ref={formRef}>
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            {/* Slime indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "48px",
                height: "48px",
                backgroundColor: getCreatureColor(),
                fontSize: "24px",
                fontWeight: "bold",
                color: "white",
                border: "4px solid rgba(0,0,0,0.4)",
                imageRendering: "pixelated",
              }}
            >
              {getCreatureIcon()}
            </div>

            {/* Input field */}
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={getPlaceholder()}
                disabled={activeCreature?.isThinking}
                maxLength={200}
                onFocus={() => setChatActive(true)}
                onBlur={() => setChatActive(false)}
                style={{
                  width: "100%",
                  fontSize: "14px",
                  padding: "8px 12px",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  border: "4px solid #000000",
                  outline: "none",
                  fontFamily: "monospace",
                  imageRendering: "pixelated",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Send button */}
            <Button
              type="submit"
              disabled={!message.trim() || activeCreature?.isThinking}
              bg={message.trim() && !activeCreature?.isThinking ? "#6366f1" : "#555"}
              textColor="white"
              borderColor="#000000"
              style={{
                minWidth: "80px",
                opacity: message.trim() && !activeCreature?.isThinking ? 1 : 0.6,
                cursor: message.trim() && !activeCreature?.isThinking ? "pointer" : "not-allowed",
              }}
            >
              {activeCreature?.isThinking ? "..." : "Send"}
            </Button>

            {/* Close button */}
            <Button
              type="button"
              onClick={handleClose}
              bg="#dc2626"
              textColor="white"
              borderColor="#000000"
              title="Close chat"
              style={{
                minWidth: "48px",
                fontSize: "18px",
              }}
            >
              ✕
            </Button>
          </div>

          {/* Helper text */}
          <div
            style={{
              marginTop: "12px",
              textAlign: "center",
              fontSize: "12px",
              color: "rgba(255,255,255,0.8)",
              fontFamily: "monospace",
              letterSpacing: "0.5px",
            }}
          >
            {chatActive
              ? `Typing to ${getCreatureIcon()} ${activeSlime ? 'slime' : 'mushroom'} (${activeCreature?.personality}) • Controls disabled • Enter to send`
              : `Click input to type • Arrow keys/Space control slime • ESC or ✕ to close`}
          </div>
        </form>
      </Card>
    </div>
  )
}

export default ChatInput
