/**
 * Hook for managing game state persistence
 * Handles auto-save and loading game state from the server
 */

import { useEffect, useCallback, useRef, useState, useMemo } from "react"
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
  const lastMeaningfulStateRef = useRef<string>("")
  const previousCreaturesSignatureRef = useRef<string>("")
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

          console.log("📥 Loaded game state:", {
            creatureCount: gameState.creatures?.length || 0,
            creatureDetails: gameState.creatures?.map(c => ({ 
              id: c.id, 
              name: c.firstName, 
              type: c.creatureType,
              conversationLength: c.conversationHistory?.length || 0 
            })),
            activeCreature: gameState.activeCreatureId,
          })

          // Clear existing creatures first
          creatureDispatch({ type: "CLEAR_ALL_CREATURES" })

          // Restore creatures
          if (gameState.creatures && gameState.creatures.length > 0) {
            gameState.creatures.forEach((creature) => {
              // No migration needed - creatures without names should stay unnamed
              console.log(`  Adding creature: ${creature.firstName || creature.creatureType} (${creature.id})`)
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
          console.log("✅ Game loaded successfully")
        } else {
          console.log("ℹ️ No saved game found, starting fresh")
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

      console.log("💾 Saving game state:", {
        creatureCount: gameState.creatures?.length,
        creatureNames: gameState.creatures?.map(c => ({ id: c.id, name: c.firstName, type: c.creatureType })),
        activeCreature: gameState.activeCreatureId,
      })

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
          console.log("✅ Game saved successfully")
        }
      } else {
        console.error("❌ Save failed:", response.status, response.statusText)
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

  // Create a stable string representation of meaningful fields for comparison
  // Only recalculates when the signature actually changes (not on every animation frame)
  const creaturesSignature = JSON.stringify(
    creatureState.creatures.map(c => ({
      id: c.id,
      firstName: c.firstName,
      personality: c.personality,
      color: c.color,
      creatureType: c.creatureType,
      affection: c.relationship.affection,
      trust: c.relationship.trust,
      mood: c.relationship.mood,
      relationshipLevel: c.relationship.relationshipLevel,
      historyLength: c.conversationHistory?.length || 0,
      mode: c.mode,
    }))
  )

  // Check if creatures signature changed
  const creaturesChanged = creaturesSignature !== previousCreaturesSignatureRef.current
  if (creaturesChanged) {
    previousCreaturesSignatureRef.current = creaturesSignature
  }

  // Create a memoized version of meaningful state that only changes when important fields change
  // Explicitly exclude animation-related fields (position, frames, isWalking, isJumping, etc.)
  const meaningfulState = useMemo(() => {
    return JSON.stringify({
      creatures: creatureState.creatures.map(creature => ({
        id: creature.id,
        creatureType: creature.creatureType,
        color: creature.color,
        firstName: creature.firstName,
        personality: creature.personality,
        capabilities: creature.capabilities,
        relationship: creature.relationship,
        conversationHistoryLength: creature.conversationHistory?.length || 0,
        // Only track mode changes, not current behavior or animation state
        mode: creature.mode,
        // Explicitly NOT including: position, direction, isWalking, isJumping, 
        // walkFrame, idleFrame, jumpFrame, isSleeping, currentBehavior - these are animation state
      })),
      activeCreatureId: creatureState.activeCreatureId,
    })
  }, [creaturesChanged, creaturesSignature, creatureState.activeCreatureId, creatureState.creatures])

  // Save on important state changes (debounced)
  useEffect(() => {
    if (!isAuthenticated || creatureState.creatures.length === 0 || !hasLoaded) {
      return
    }

    // Only trigger save if meaningful state actually changed
    if (meaningfulState !== lastMeaningfulStateRef.current) {
      const prev = lastMeaningfulStateRef.current ? JSON.parse(lastMeaningfulStateRef.current) : null
      const curr = JSON.parse(meaningfulState)
      
      console.log("🔄 Meaningful state changed, triggering debounced save")
      console.log("  Changes detected in:", {
        creatures: prev?.creatures?.[0]?.firstName !== curr?.creatures?.[0]?.firstName ? "name changed" : "other",
        previousName: prev?.creatures?.[0]?.firstName,
        currentName: curr?.creatures?.[0]?.firstName,
      })
      
      lastMeaningfulStateRef.current = meaningfulState
      debouncedSave()
    }
  }, [isAuthenticated, hasLoaded, meaningfulState, debouncedSave, creatureState.creatures])

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
