"use client"

import React, { useState, useRef, useEffect } from "react"
import { useSlime } from "@/context/slimeContext"
import { useSlimeAI } from "@/hooks/useSlimeAI"
import { useAIConfig } from "@/context/aiConfigContext"
import { Card, Button } from "pixel-retroui"
import { ANIMATION_CONFIG } from "./animationConfig"

const SlimeDetailPanel: React.FC = () => {
  const { state, dispatch } = useSlime()
  const { isConfigured } = useAIConfig()
  const [message, setMessage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [animationFrame, setAnimationFrame] = useState(0)

  // Get the active slime
  const activeSlime = state.slimes.find((s) => s.id === state.activeSlimeId)
  const { handleUserMessage } = useSlimeAI(state.activeSlimeId || "")

  // Animate the slime sprite
  useEffect(() => {
    if (!activeSlime) return

    const interval = setInterval(() => {
      setAnimationFrame((prev) => {
        // Determine which animation to use
        if (activeSlime.isJumping) {
          return (prev + 1) % ANIMATION_CONFIG.totalJumpFrames
        } else if (activeSlime.isWalking) {
          return (prev + 1) % ANIMATION_CONFIG.totalWalkFrames
        } else {
          return (prev + 1) % ANIMATION_CONFIG.totalIdleFrames
        }
      })
    }, 1000 / ANIMATION_CONFIG.fps)

    return () => clearInterval(interval)
  }, [activeSlime?.isJumping, activeSlime?.isWalking])

  // Get current sprite image
  const getCurrentImage = () => {
    if (!activeSlime) return ""
    if (activeSlime.isJumping) return `/assets/${activeSlime.color}/jump.png`
    if (activeSlime.isWalking) return `/assets/${activeSlime.color}/walk.png`
    return `/assets/${activeSlime.color}/idle.png`
  }

  // Calculate background offset for sprite animation
  const getBackgroundOffset = () => {
    return -animationFrame * ANIMATION_CONFIG.frameWidth
  }

  // Add styles for thinking animation
  useEffect(() => {
    const styleId = "thinking-dots-style"
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style")
      style.id = styleId
      style.textContent = `
        .thinking-dots span {
          animation: thinking-blink 1.4s infinite;
          opacity: 0.3;
        }
        .thinking-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .thinking-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes thinking-blink {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeSlime?.conversationHistory])

  // Don't render if no slime is selected
  if (!activeSlime) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !state.activeSlimeId) return

    const messageToSend = message.trim()
    setMessage("")

    await handleUserMessage(messageToSend)
  }

  const handleClose = () => {
    dispatch({ type: "SET_ACTIVE_SLIME", payload: null })
    dispatch({ type: "HIDE_ALL_BUBBLES", payload: undefined })
    setMessage("")
  }

  // Personality descriptions
  const personalityDescriptions: Record<string, string> = {
    playful: "Loves to play and have fun! Always energetic and cheerful.",
    shy: "A bit timid but very sweet. Needs gentle encouragement.",
    energetic: "Full of energy! Always ready for action and adventure.",
    calm: "Peaceful and relaxed. Enjoys quiet moments.",
    curious: "Always wondering and exploring. Asks lots of questions!",
    sleepy: "A bit drowsy but adorable. Loves to rest.",
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        maxWidth: "380px",
        pointerEvents: "none",
      }}
    >
      {/* Slime Avatar Card - Floating top right */}
      <Card
        bg="rgba(0, 0, 0, 0.85)"
        borderColor="rgba(255,255,255,0.3)"
        style={{
          padding: "16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          pointerEvents: "auto",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Slime Sprite */}
          <div
            style={{
              position: "relative",
              width: "80px",
              height: "80px",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-20px", // Crop the top empty space
                left: "0",
                width: `${ANIMATION_CONFIG.frameWidth}px`,
                height: `${ANIMATION_CONFIG.frameHeight}px`,
                background: `url(${getCurrentImage()}) ${getBackgroundOffset()}px 0 no-repeat`,
                transform: `scale(${80 / ANIMATION_CONFIG.frameWidth})`,
                transformOrigin: "top left",
                imageRendering: "pixelated",
                filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))",
              }}
            />
          </div>

          {/* Slime Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "16px",
                fontWeight: "bold",
                color: "#ffffff",
                textTransform: "capitalize",
                fontFamily: "monospace",
              }}
            >
              {activeSlime.color} Slime
            </h3>
            <div
              style={{
                fontSize: "13px",
                color: "#6366f1",
                fontWeight: "bold",
                textTransform: "capitalize",
                marginBottom: "4px",
                fontFamily: "monospace",
              }}
            >
              {activeSlime.personality}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.6)",
                fontFamily: "monospace",
              }}
            >
              {personalityDescriptions[activeSlime.personality]}
            </div>
          </div>

          {/* Close button */}
          <Button
            onClick={handleClose}
            bg="#dc2626"
            textColor="white"
            borderColor="#000000"
            title="Close"
            style={{
              minWidth: "40px",
              height: "40px",
              fontSize: "16px",
              padding: "8px",
              flexShrink: 0,
            }}
          >
            ✕
          </Button>
        </div>

        {/* Status bar */}
        <div
          style={{
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "2px solid rgba(255,255,255,0.2)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "rgba(255,255,255,0.7)",
            fontFamily: "monospace",
          }}
        >
          <span>
            {activeSlime.isJumping
              ? "🦘 Jumping"
              : activeSlime.isWalking
                ? "🚶 Walking"
                : activeSlime.isSleeping
                  ? "😴 Sleeping"
                  : "⭐ Idle"}
          </span>
          <span>{activeSlime.mode === "user" ? "🎮 Manual" : "🤖 Auto"}</span>
        </div>
      </Card>

      {/* Chat History Card - Floating below avatar */}
      {isConfigured && activeSlime.conversationHistory.length > 0 && (
        <Card
          bg="rgba(0, 0, 0, 0.85)"
          borderColor="rgba(255,255,255,0.3)"
          style={{
            padding: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            pointerEvents: "auto",
            backdropFilter: "blur(10px)",
            maxHeight: "400px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: "bold",
                color: "#ffffff",
                fontFamily: "monospace",
              }}
            >
              💬 Conversation
            </h4>
            <Button
              onClick={() => {
                if (confirm("Clear conversation history?")) {
                  dispatch({ type: "CLEAR_CONVERSATION", payload: activeSlime.id })
                }
              }}
              bg="rgba(255,255,255,0.1)"
              textColor="rgba(255,255,255,0.8)"
              borderColor="rgba(255,255,255,0.3)"
              style={{
                fontSize: "10px",
                padding: "4px 8px",
                minWidth: "unset",
              }}
            >
              Clear
            </Button>
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              paddingRight: "8px",
            }}
          >
            {activeSlime.conversationHistory.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "8px 12px",
                    backgroundColor: msg.role === "user" ? "#6366f1" : "rgba(255, 255, 255, 0.15)",
                    color: "#ffffff",
                    border: "3px solid rgba(0,0,0,0.5)",
                    wordBreak: "break-word",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    lineHeight: "1.4",
                  }}
                >
                  {msg.content}
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "rgba(255, 255, 255, 0.4)",
                    marginTop: "4px",
                    fontFamily: "monospace",
                  }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {activeSlime.isThinking && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontFamily: "monospace",
                  fontSize: "12px",
                }}
              >
                <div className="thinking-dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </Card>
      )}

      {/* Chat Input Panel */}
      {isConfigured && (
        <Card
          bg="rgba(0, 0, 0, 0.85)"
          borderColor="rgba(255,255,255,0.3)"
          style={{
            padding: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            pointerEvents: "auto",
            backdropFilter: "blur(10px)",
          }}
        >
          <h4
            style={{
              margin: "0 0 12px 0",
              fontSize: "14px",
              fontWeight: "bold",
              color: "#ffffff",
              fontFamily: "monospace",
            }}
          >
            💬 Chat
          </h4>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  activeSlime.personality === "shy"
                    ? "Be gentle..."
                    : activeSlime.personality === "energetic"
                      ? "Let's go!"
                      : activeSlime.personality === "curious"
                        ? "Ask me anything!"
                        : "Type a message..."
                }
                disabled={activeSlime.isThinking}
                maxLength={200}
                style={{
                  flex: 1,
                  fontSize: "13px",
                  padding: "10px 12px",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  border: "4px solid #000000",
                  outline: "none",
                  fontFamily: "monospace",
                  imageRendering: "pixelated",
                }}
              />
              <Button
                type="submit"
                disabled={!message.trim() || activeSlime.isThinking}
                bg={message.trim() && !activeSlime.isThinking ? "#6366f1" : "#555"}
                textColor="white"
                borderColor="#000000"
                style={{
                  minWidth: "70px",
                  opacity: message.trim() && !activeSlime.isThinking ? 1 : 0.6,
                  cursor: message.trim() && !activeSlime.isThinking ? "pointer" : "not-allowed",
                }}
              >
                {activeSlime.isThinking ? "..." : "Send"}
              </Button>
            </div>

            <div
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.6)",
                textAlign: "center",
                fontFamily: "monospace",
              }}
            >
              {activeSlime.isThinking ? "Slime is thinking..." : "Arrow keys to move • Space to jump"}
            </div>
          </form>
        </Card>
      )}

      {/* No AI Config Message */}
      {!isConfigured && (
        <Card
          bg="rgba(0, 0, 0, 0.85)"
          borderColor="rgba(255,165,0,0.5)"
          style={{
            padding: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            pointerEvents: "auto",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "12px",
              fontFamily: "monospace",
            }}
          >
            ⚠️ Configure AI in the menu to chat
          </div>
        </Card>
      )}
    </div>
  )
}

export default SlimeDetailPanel

