"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import DebugMenu from "./DebugMenu"

const MainMenu: React.FC = () => {
  const [showDebug, setShowDebug] = useState(false)
  const debugMenuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

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
    <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 100 }}>
      <button
        ref={buttonRef}
        className="menu-button-simplified"
        onClick={() => setShowDebug(!showDebug)}
        title="Debug Menu"
      >
        {showDebug ? "✕" : "⚙️"}
      </button>

      {showDebug && (
        <div ref={debugMenuRef}>
          <DebugMenu />
        </div>
      )}
    </div>
  )
}

export default MainMenu
