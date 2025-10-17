"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import DebugMenu from "./DebugMenu"
import ConfirmDialog from "./ConfirmDialog"
import { Button } from "pixel-retroui"
import { useAuth } from "@/context/authContext"

interface MainMenuProps {
  onShowAuth?: () => void
}

const MainMenu: React.FC<MainMenuProps> = ({ onShowAuth }) => {
  const [showDebug, setShowDebug] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const debugMenuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)
  const { logout, user, isAuthenticated } = useAuth()

  const handleAuthButtonClick = () => {
    if (isAuthenticated) {
      // Show logout confirmation
      setShowConfirmDialog(true)
    } else {
      // Show login/register screen
      onShowAuth?.()
    }
  }

  const handleConfirmLogout = async () => {
    setShowConfirmDialog(false)
    await logout()
  }

  // Handle clicks outside the debug menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showDebug &&
        debugMenuRef.current &&
        !debugMenuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDebug(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showDebug])

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        zIndex: 2100,
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        maxWidth: "380px",
        pointerEvents: "none",
      }}
    >
      {/* Buttons */}
      <div style={{ display: "flex", gap: "8px", pointerEvents: "auto" }}>
        <div ref={buttonRef}>
          <Button
            onClick={() => setShowDebug(!showDebug)}
            bg={showDebug ? "#dc2626" : "rgba(0, 0, 0, 0.85)"}
            textColor="white"
            borderColor={showDebug ? "#000000" : "rgba(255,255,255,0.3)"}
            title="Debug Menu"
            style={{
              minWidth: "50px",
              height: "50px",
              fontSize: "20px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          >
            {showDebug ? "✕" : "⚙️"}
          </Button>
        </div>
        
        <Button
          onClick={handleAuthButtonClick}
          bg="rgba(0, 0, 0, 0.85)"
          textColor="white"
          borderColor="rgba(255,255,255,0.3)"
          title={isAuthenticated ? `Logout (${user?.username})` : "Login / Register to save progress"}
          style={{
            minWidth: "50px",
            height: "50px",
            fontSize: "20px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {isAuthenticated ? "🚪" : "💾"}
        </Button>
      </div>

      {/* Debug panels */}
      {showDebug && (
        <div ref={debugMenuRef} style={{ pointerEvents: "auto" }}>
          <DebugMenu />
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          title="Logout Confirmation"
          message="Are you sure you want to logout? Your current progress has been saved."
          confirmText="Logout"
          cancelText="Cancel"
          onConfirm={handleConfirmLogout}
          onCancel={() => setShowConfirmDialog(false)}
          confirmColor="#dc2626"
        />
      )}
    </div>
  )
}

export default MainMenu
