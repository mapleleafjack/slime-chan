"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import DebugMenu from "./DebugMenu"
import { Button } from "pixel-retroui"

const MainMenu: React.FC = () => {
  const [showDebug, setShowDebug] = useState(false)
  const debugMenuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)

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
      {/* Button */}
      <div ref={buttonRef} style={{ pointerEvents: "auto" }}>
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

      {/* Debug panels */}
      {showDebug && (
        <div ref={debugMenuRef} style={{ pointerEvents: "auto" }}>
          <DebugMenu />
        </div>
      )}
    </div>
  )
}

export default MainMenu
