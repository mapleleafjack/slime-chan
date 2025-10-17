"use client"

import React, { useState, useRef, useEffect } from "react"
import { useSlime } from "@/context/slimeContext"
import { useSlimeAI } from "@/hooks/useSlimeAI"

const ChatInput: React.FC = () => {
  const { state, dispatch } = useSlime()
  const [message, setMessage] = useState("")
  const [chatActive, setChatActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const activeSlime = state.slimes.find((s) => s.id === state.activeSlimeId)
  const { handleUserMessage } = useSlimeAI(state.activeSlimeId || "")

  // Only focus input when chatActive is true
  useEffect(() => {
    if (chatActive && inputRef.current) {
      inputRef.current.focus()
    }
    // Broadcast chat active state
    window.dispatchEvent(new CustomEvent("slime-chat-active", { detail: { active: chatActive } }))
  }, [chatActive])

  // Handle ESC key to deselect slime or deactivate chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeSlime) {
        if (chatActive) {
          setChatActive(false)
          inputRef.current?.blur()
        } else {
          handleClose()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeSlime, chatActive])

  // Only show when a slime is selected
  if (!activeSlime) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !state.activeSlimeId) return

    const messageToSend = message.trim()
    setMessage("")

    await handleUserMessage(messageToSend)
    setChatActive(false)
    inputRef.current?.blur()
  }

  const handleClose = () => {
    if (!state.activeSlimeId) return
    dispatch({ type: "SET_ACTIVE_SLIME", payload: null })
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
    return personalities[activeSlime.personality] || "Talk to your slime..."
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
        maxWidth: "500px",
      }}
    >
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "flex",
            gap: "8px",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            padding: "12px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            border: "2px solid rgba(255,255,255,0.2)",
          }}
        >
          {/* Slime indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor:
                activeSlime.color === "blue" ? "#5499C7" : activeSlime.color === "red" ? "#E74C3C" : "#52C41A",
              fontSize: "20px",
              fontWeight: "bold",
              color: "white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            {activeSlime.color === "blue" ? "🔵" : activeSlime.color === "red" ? "🔴" : "🟢"}
          </div>

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={activeSlime.isThinking}
            style={{
              flex: 1,
              padding: "10px 12px",
              fontSize: "14px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "rgba(255,255,255,0.95)",
              color: "#333",
              outline: "none",
              fontFamily: "inherit",
            }}
            maxLength={200}
            onFocus={() => setChatActive(true)}
            onBlur={() => setChatActive(false)}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!message.trim() || activeSlime.isThinking}
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "8px",
              backgroundColor: message.trim() && !activeSlime.isThinking ? "#6366f1" : "#555",
              color: "white",
              cursor: message.trim() && !activeSlime.isThinking ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              opacity: message.trim() && !activeSlime.isThinking ? 1 : 0.6,
            }}
          >
            {activeSlime.isThinking ? "..." : "Send"}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: "10px",
              fontSize: "18px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#555",
              color: "white",
              cursor: "pointer",
              transition: "all 0.2s",
              minWidth: "40px",
            }}
            title="Close chat"
          >
            ✕
          </button>
        </div>

        {/* Helper text */}
        <div
          style={{
            marginTop: "8px",
            textAlign: "center",
            fontSize: "11px",
            color: "rgba(255,255,255,0.7)",
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          {chatActive
            ? `Chatting with ${activeSlime.color} slime (${activeSlime.personality}) • Enter to send • ESC or ✕ to deselect`
            : `Chat visible. Click to activate chat. Arrow keys/space control slime.`}
        </div>
      </form>
    </div>
  )
}

export default ChatInput
