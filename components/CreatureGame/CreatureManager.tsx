"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { useCreature, createInitialSlime, createInitialMushroom } from "@/context/creatureContext"
import { useAuth } from "@/context/authContext"
import { isSlime, isMushroom } from "@/types/creatureTypes"
import Slime from "./creatures/Slime"
import Mushroom from "./creatures/Mushroom"
import CreatureLogicWrapper from "./CreatureLogicWrapper"
import { randomInt } from "@/utils/gameUtils"

type CreatureManagerProps = {
  hasLoadedGame: boolean
  isLoadingGame: boolean
}

const CreatureManager: React.FC<CreatureManagerProps> = ({ hasLoadedGame, isLoadingGame }) => {
  const { state, dispatch } = useCreature()
  const { isAuthenticated } = useAuth()
  const addButtonClickedRef = useRef(false)
  const addButtonTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasInitializedRef = useRef(false)

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

    const slimeData = createInitialSlime(id, color, position)

    dispatch({
      type: "ADD_CREATURE",
      payload: slimeData,
    })
  }

  // Add a mushroom
  const addMushroom = () => {
    const id = `mushroom-${Date.now()}`
    const position = randomInt(50, Math.min(480 - 200, 380))

    const mushroomData = createInitialMushroom(id, position)

    dispatch({
      type: "ADD_CREATURE",
      payload: mushroomData,
    })
  }

  // Add initial slime if none exist (only for new users or if not loading saved data)
  useEffect(() => {
    // Don't initialize while loading game data
    if (isLoadingGame) {
      console.log("Waiting for game data to load...")
      return
    }

    // Don't initialize if we've already loaded saved data
    if (hasLoadedGame && hasInitializedRef.current) {
      console.log("Game already loaded and initialized")
      return
    }

    // Wait for auth and potential data load to settle
    const timeoutId = setTimeout(() => {
      if (hasInitializedRef.current) return
      
      const slimeCount = state.creatures.filter((c) => isSlime(c)).length
      const mushroomCount = state.creatures.filter((c) => isMushroom(c)).length
      
      // Only add default creatures if we have none at all
      // This means either new user or no saved data
      if (slimeCount === 0) {
        console.log("No slimes found, adding default slime")
        addSlime(true)
      }

      if (mushroomCount === 0) {
        console.log("No mushrooms found, adding default mushroom")
        addMushroom()
      }
      
      hasInitializedRef.current = true
    }, 300) // Reduced timeout since we now have proper loading state

    // Clean up timeout on unmount
    return () => {
      clearTimeout(timeoutId)
      if (addButtonTimeoutRef.current) {
        clearTimeout(addButtonTimeoutRef.current)
      }
    }
  }, [hasLoadedGame, isLoadingGame]) // Re-run when loading state changes

  const handleAddButtonClick = (e: React.MouseEvent) => {
    // Prevent event bubbling
    e.stopPropagation()

    // Add a new slime
    addSlime(false)
  }

  return (
    <>
      {/* Render CreatureLogicWrapper components for each slime */}
      {state.creatures.filter((c) => isSlime(c)).map((slime) => (
        <CreatureLogicWrapper key={`logic-${slime.id}`} id={slime.id} />
      ))}

      {/* Render Slime components for each slime */}
      {state.creatures.filter((c) => isSlime(c)).map((slime) => (
        <Slime key={slime.id} id={slime.id} />
      ))}

      {/* Render Mushroom components for each mushroom */}
      {state.creatures.filter((c) => isMushroom(c)).map((mushroom) => (
        <Mushroom key={mushroom.id} id={mushroom.id} />
      ))}

      <button className="add-slime-button" onClick={handleAddButtonClick} title="Add Slime" type="button">
        +
      </button>
    </>
  )
}

export default CreatureManager
