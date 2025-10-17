/**
 * Hook for managing game state persistence
 * Handles auto-save and loading game state from the server
 */

import { useEffect, useCallback, useRef, useState } from "react"
import { useAuth } from "@/context/authContext"
import { useCreature } from "@/context/creatureContext"
import { useDayCycle } from "@/context/dayCycleContext"
import type { GameState } from "@/types/authTypes"

const AUTO_SAVE_INTERVAL = 30000 // Save every 30 seconds
const DEBOUNCE_DELAY = 500 // Debounce saves by 500ms (reduced for more responsive saves)

export const useGamePersistence = () => {
  const { isAuthenticated, user } = useAuth()
  const { state: creatureState, dispatch: creatureDispatch } = useCreature()
  const { debugTime, setDebugTime } = useDayCycle()
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(false)
  const lastUserIdRef = useRef<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load game state when user logs in
  const loadGameState = useCallback(async () => {
    if (!isAuthenticated || !user || isLoadingRef.current) return
    
    // Check if this is a different user or first load for this user
    const shouldLoad = !hasLoaded || lastUserIdRef.current !== user.id
    if (!shouldLoad) return

    isLoadingRef.current = true
    setIsLoading(true)
    console.log("Loading game state for user:", user.username)
    
    try {
      const response = await fetch("/api/game/load", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.gameState) {
          const gameState: GameState = data.gameState

          console.log("Loaded game state:", {
            creatureCount: gameState.creatures?.length || 0,
            activeCreature: gameState.activeCreatureId,
          })

          // Clear existing creatures first
          creatureDispatch({ type: "CLEAR_ALL_CREATURES" })

          // Restore creatures
          if (gameState.creatures && gameState.creatures.length > 0) {
            gameState.creatures.forEach((creature) => {
              creatureDispatch({ type: "ADD_CREATURE", payload: creature })
            })
          }

          // Restore active creature
          if (gameState.activeCreatureId) {
            creatureDispatch({ 
              type: "SET_ACTIVE_CREATURE", 
              payload: gameState.activeCreatureId 
            })
          }

          // Restore debug time
          if (gameState.debugTime) {
            setDebugTime(new Date(gameState.debugTime))
          }

          setHasLoaded(true)
          lastUserIdRef.current = user.id
          console.log("Game loaded successfully")
        } else {
          console.log("No saved game found, starting fresh")
          setHasLoaded(true)
          lastUserIdRef.current = user.id
        }
      }
    } catch (error) {
      console.error("Failed to load game:", error)
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [isAuthenticated, user, creatureDispatch, setDebugTime, hasLoaded])

  // Save game state
  const saveGameState = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      const gameState: Partial<GameState> = {
        creatures: creatureState.creatures,
        activeCreatureId: creatureState.activeCreatureId,
        debugTime,
      }

      const response = await fetch("/api/game/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(gameState),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log("Game saved successfully")
        }
      }
    } catch (error) {
      console.error("Failed to save game:", error)
    }
  }, [isAuthenticated, creatureState.creatures, creatureState.activeCreatureId, debugTime])

  // Debounced save
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveGameState()
    }, DEBOUNCE_DELAY)
  }, [saveGameState])

  // Load game state on mount or when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      loadGameState()
    } else {
      // Reset on logout
      setHasLoaded(false)
      lastUserIdRef.current = null
    }
  }, [isAuthenticated, user, loadGameState])

  // Auto-save interval
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear interval if user logs out
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
        autoSaveIntervalRef.current = null
      }
      return
    }

    // Set up auto-save interval
    autoSaveIntervalRef.current = setInterval(() => {
      saveGameState()
    }, AUTO_SAVE_INTERVAL)

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [isAuthenticated, saveGameState])

  // Save on important state changes (debounced)
  useEffect(() => {
    if (isAuthenticated && creatureState.creatures.length > 0 && hasLoaded) {
      // Serialize creatures to detect deep changes
      const stateSnapshot = JSON.stringify({
        creatures: creatureState.creatures,
        activeCreatureId: creatureState.activeCreatureId,
      })
      
      console.log("State changed, triggering debounced save")
      debouncedSave()
    }
  }, [
    isAuthenticated,
    hasLoaded,
    // Serialize to detect deep changes in creatures
    JSON.stringify(creatureState.creatures),
    creatureState.activeCreatureId,
    debouncedSave,
  ])

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAuthenticated) {
        // Use synchronous approach for beforeunload
        navigator.sendBeacon(
          "/api/game/save",
          JSON.stringify({
            creatures: creatureState.creatures,
            activeCreatureId: creatureState.activeCreatureId,
            debugTime,
          })
        )
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isAuthenticated, creatureState.creatures, creatureState.activeCreatureId, debugTime])

  return {
    saveGameState,
    loadGameState,
    hasLoaded,
    isLoading,
    saveNow: saveGameState, // Alias for immediate saves
  }
}
