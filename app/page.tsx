"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/authContext"
import { AuthScreen } from "@/components/AuthScreen"
import CreatureGame from "@/components/CreatureGame/CreatureGame"
import { DayPhaseProvider } from "@/context/dayCycleContext"
import { AIConfigProvider } from "@/context/aiConfigContext"

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [showAuthScreen, setShowAuthScreen] = useState(false)
  const [authDismissed, setAuthDismissed] = useState(false)
  const [gameKey, setGameKey] = useState(0)

  // Reset authDismissed and force game reset when user logs out
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      // User logged out, show auth screen again and reset the game
      setShowAuthScreen(true)
      setAuthDismissed(false)
      setGameKey(prev => prev + 1) // Force game to remount with fresh state
    }
  }, [isAuthenticated, isLoading])

  // Show auth screen if:
  // - User is not authenticated AND hasn't dismissed it
  // - OR user clicked the login button
  const shouldShowAuth = !isLoading && !isAuthenticated && (showAuthScreen && !authDismissed)

  return (
    <>
      <AIConfigProvider key={`ai-${gameKey}`}>
        <DayPhaseProvider key={`day-${gameKey}`}>
          <CreatureGame 
            key={`game-${gameKey}`}
            onShowAuth={() => {
              setShowAuthScreen(true)
              setAuthDismissed(false)
            }} 
          />
        </DayPhaseProvider>
      </AIConfigProvider>

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(10px)",
            zIndex: 10000,
            pointerEvents: "auto",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "64px",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            >
              🌟
            </div>
            <p
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "16px",
                marginTop: "16px",
                fontFamily: "monospace",
                fontWeight: "bold",
              }}
            >
              Loading Slime-chan...
            </p>
          </div>
        </div>
      )}

      {/* Auth Screen Overlay */}
      {shouldShowAuth && (
        <AuthScreen onClose={() => {
          setShowAuthScreen(false)
          setAuthDismissed(true)
        }} />
      )}
    </>
  )
}
