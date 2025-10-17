"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { useCreature } from "@/context/creatureContext"
import { isSlime } from "@/types/creatureTypes"
import { useAIConfig } from "@/context/aiConfigContext"
import { generateSlimeResponse, generateAutonomousSpeech, getFallbackResponse } from "@/utils/aiService"

export const useCreatureAI = (creatureId: string) => {
  const { state, dispatch } = useCreature()
  const creature = state.creatures.find((c) => c.id === creatureId)
  const { config, isConfigured } = useAIConfig()
  const [isProcessing, setIsProcessing] = useState(false)

  const creatureRef = useRef(creature)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Update ref when creature changes to avoid dependency issues
  useEffect(() => {
    creatureRef.current = creature
  }, [creature])

  // Set mounted flag and clear any existing timeout when component unmounts
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleUserMessage = useCallback(
    async (message: string) => {
      const currentCreature = creatureRef.current
      if (!currentCreature) return // Exit if creature is null or undefined
      if (currentCreature.isThinking || isProcessing) return

      setIsProcessing(true)

      try {
        // Hide all other bubbles first
        dispatch({ type: "HIDE_ALL_BUBBLES", payload: undefined })

        // Reset interaction timer and force user mode
        dispatch({ type: "SET_LAST_INTERACTION", payload: { id: creatureId, value: Date.now() } })
        dispatch({ type: "SET_MODE", payload: { id: creatureId, value: "user" } })

        // Increment interaction count
        dispatch({ type: "INCREMENT_INTERACTIONS", payload: creatureId })

        // Add user message to conversation history
        const userMessage = {
          id: `${creatureId}-${Date.now()}-user`,
          role: "user" as const,
          content: message,
          timestamp: Date.now(),
        }
        dispatch({ type: "ADD_MESSAGE", payload: { id: creatureId, message: userMessage } })

        // Update relationship properties based on interaction
        // Simple sentiment analysis based on message content
        const lowerMsg = message.toLowerCase()
        const isPositive = /love|like|great|awesome|wonderful|amazing|good|nice|beautiful|cute|happy|fun|thank/i.test(message)
        const isNegative = /hate|bad|ugly|boring|dumb|stupid|angry|sad|annoying/i.test(message)
        const isQuestion = message.includes("?")
        const isLong = message.length > 50 // Longer messages show more engagement

        // Update affection
        if (isPositive) {
          dispatch({ type: "UPDATE_AFFECTION", payload: { id: creatureId, delta: 3 } })
          dispatch({ type: "UPDATE_TRUST", payload: { id: creatureId, delta: 2 } })
          
          // Set mood based on positive interaction
          const happyMoods: Array<"happy" | "excited" | "loving"> = ["happy", "excited", "loving"]
          const randomMood = happyMoods[Math.floor(Math.random() * happyMoods.length)]
          dispatch({ type: "SET_MOOD", payload: { id: creatureId, mood: randomMood } })
        } else if (isNegative) {
          dispatch({ type: "UPDATE_AFFECTION", payload: { id: creatureId, delta: -2 } })
          dispatch({ type: "UPDATE_TRUST", payload: { id: creatureId, delta: -1 } })
          dispatch({ type: "SET_MOOD", payload: { id: creatureId, mood: "sad" } })
        } else {
          // Neutral interaction still builds affection slowly
          dispatch({ type: "UPDATE_AFFECTION", payload: { id: creatureId, delta: 1 } })
        }

        // Questions build trust
        if (isQuestion) {
          dispatch({ type: "UPDATE_TRUST", payload: { id: creatureId, delta: 1 } })
        }

        // Long messages show engagement
        if (isLong) {
          dispatch({ type: "UPDATE_AFFECTION", payload: { id: creatureId, delta: 1 } })
        }

        // Show thinking state
        dispatch({ type: "SET_THINKING", payload: { id: creatureId, value: true } })

        // Add a small delay to prevent text flashing
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Check if component is still mounted
        if (!isMountedRef.current) return

        let responseText: string

        // Try to use AI if configured, otherwise fall back to random phrases
        if (isConfigured) {
          console.log(`🤖 Using AI to respond to: "${message}"`)
          const aiResponse = await generateSlimeResponse(
            config,
            currentCreature,
            message,
            currentCreature.personality,
            currentCreature.conversationHistory,
          )

          if (aiResponse.success) {
            console.log(`✓ AI response: "${aiResponse.message}"`)
            responseText = aiResponse.message
          } else {
            // Log error but don't show to user, fall back to random phrase
            console.warn("⚠️ AI response failed:", aiResponse.error)
            console.log("↻ Using fallback response")
            responseText = getFallbackResponse(currentCreature)
          }
        } else {
          // Use fallback when AI is not configured
          console.log("ℹ️ AI not configured, using fallback response")
          responseText = getFallbackResponse(currentCreature)
        }

        // Add creature response to conversation history
        const creatureMessage = {
          id: `${creatureId}-${Date.now()}-creature`,
          role: "creature" as const,
          content: responseText,
          timestamp: Date.now(),
        }
        dispatch({ type: "ADD_MESSAGE", payload: { id: creatureId, message: creatureMessage } })

        // Also update bubble for slimes that don't have the panel open
        dispatch({ type: "UPDATE_BUBBLE_TEXT", payload: { id: creatureId, text: responseText } })
        dispatch({ type: "SET_LAST_INTERACTION", payload: { id: creatureId, value: Date.now() } })

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // Auto-hide bubble after 8 seconds if menu is not open (longer for AI responses)
        timeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) return

          const currentState = state.creatures.find((s) => s.id === creatureId)
          if (currentState && !currentState.isThinking && currentState.bubble.menuState === "none") {
            dispatch({ type: "HIDE_BUBBLE", payload: creatureId })
          }
          timeoutRef.current = null
        }, 8000)
      } finally {
        if (isMountedRef.current) {
          dispatch({ type: "SET_THINKING", payload: { id: creatureId, value: false } })
          setIsProcessing(false)
        }
      }
    },
    [dispatch, creatureId, state.creatures, isProcessing, config, isConfigured],
  )

  // Auto-interaction when in talk mode
  useEffect(() => {
    // Skip AI processing for the active creature to improve performance
    if (creature && state.activeCreatureId === creatureId) return

    if (creature && creature.currentBehavior === "talk" && !creature.isThinking && !isProcessing) {
      // Use autonomous speech for better context-aware responses
      const generateAutonomous = async () => {
        if (!creature || creature.isThinking || isProcessing) return
        
        setIsProcessing(true)
        dispatch({ type: "SHOW_BUBBLE", payload: { id: creatureId, text: "..." } })
        dispatch({ type: "SET_THINKING", payload: { id: creatureId, value: true } })

        let responseText: string

        if (isConfigured) {
          const aiResponse = await generateAutonomousSpeech(config, creature, creature.personality)
          responseText = aiResponse.success ? aiResponse.message : getFallbackResponse(creature)
        } else {
          responseText = getFallbackResponse(creature)
        }

        dispatch({ type: "UPDATE_BUBBLE_TEXT", payload: { id: creatureId, text: responseText } })
        dispatch({ type: "SET_THINKING", payload: { id: creatureId, value: false } })
        setIsProcessing(false)
      }

      generateAutonomous()
    }
  }, [creature?.currentBehavior, creature, isProcessing, state.activeCreatureId, creatureId, config, isConfigured, dispatch])

  return { handleUserMessage }
}
