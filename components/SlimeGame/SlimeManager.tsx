"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { useSlime } from "@/context/slimeContext"
import Slime from "./Slime"
import SlimeLogicWrapper from "./SlimeLogicWrapper"
import { randomInt } from "@/utils/slimeUtils"

const SlimeManager = () => {
  const { state, dispatch } = useSlime()
  const addButtonClickedRef = useRef(false)
  const addButtonTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Add a new slime with a random position
  const addSlime = (isInitial = false) => {
    // Set flag to prevent immediate re-triggering
    addButtonClickedRef.current = true

    // Clear any existing timeout
    if (addButtonTimeoutRef.current) {
      clearTimeout(addButtonTimeoutRef.current)
    }

    // Reset the flag after a short delay
    addButtonTimeoutRef.current = setTimeout(() => {
      addButtonClickedRef.current = false
      addButtonTimeoutRef.current = null
    }, 500)

    const id = `slime-${Date.now()}`
    // Limit position to game width (480px) minus slime width
    const position = randomInt(50, Math.min(480 - 200, 380))

    // Always use blue for the initial slime, random for others
    const colors = ["blue", "red", "green"] as const
    const color = isInitial ? "blue" : colors[randomInt(0, colors.length - 1)]

    dispatch({
      type: "ADD_SLIME",
      payload: {
        id,
        color,
        position,
      },
    })
  }

  // Add initial slime if none exist
  useEffect(() => {
    if (state.slimes.length === 0) {
      addSlime(true) // Pass true to indicate this is the initial slime
    }

    // Clean up timeout on unmount
    return () => {
      if (addButtonTimeoutRef.current) {
        clearTimeout(addButtonTimeoutRef.current)
      }
    }
  }, [state.slimes.length])

  const handleAddButtonClick = (e: React.MouseEvent) => {
    // Prevent event bubbling
    e.stopPropagation()

    // Add a new slime
    addSlime(false)
  }

  return (
    <>
      {/* Render SlimeLogicWrapper components for each slime */}
      {state.slimes.map((slime) => (
        <SlimeLogicWrapper key={`logic-${slime.id}`} id={slime.id} />
      ))}

      {/* Render Slime components for each slime */}
      {state.slimes.map((slime) => (
        <Slime key={slime.id} id={slime.id} />
      ))}

      <button className="add-slime-button" onClick={handleAddButtonClick} title="Add Slime" type="button">
        +
      </button>
    </>
  )
}

export default SlimeManager
