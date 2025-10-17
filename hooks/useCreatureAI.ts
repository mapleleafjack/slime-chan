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

        // Enhanced relationship analysis based on interaction
        const lowerMsg = message.toLowerCase()
        
        // More comprehensive sentiment analysis with different categories
        const isVeryPositive = /\b(love|adore|amazing|fantastic|best|perfect|incredible)\b/i.test(message)
        const isPositive = /\b(like|great|awesome|wonderful|good|nice|beautiful|cute|pretty|happy|joy|fun|thank|appreciate|care|sweet|kind|excellent)\b/i.test(message)
        const isNegative = /\b(hate|dislike|bad|ugly|boring|dumb|stupid|angry|sad|annoying|awful|terrible|worst)\b/i.test(message)
        
        // Question types that build different relationship aspects
        const isQuestion = message.includes("?")
        const isDeepQuestion = /\b(why|how do you|what do you think|feel about|opinion|believe|wonder|curious about|understand|mean to you|remember when)\b/i.test(message)
        const isPersonalQuestion = /\b(you|your) (feel|think|like|want|dream|hope|fear|remember|favorite|prefer)\b/i.test(lowerMsg)
        
        // Engagement indicators
        const isLong = message.length > 50
        const isVeryLong = message.length > 150
        const hasEmotionalSharing = /\b(i feel|i'm|i am|i think|honestly|actually|my)\b/i.test(lowerMsg)
        const isComforting = /\b(okay|fine|here for you|sorry|understand|care about you|it'll be|don't worry)\b/i.test(lowerMsg)
        const isPlayful = /\b(haha|lol|hehe|😂|😄|play|fun|game|joke)\b/i.test(lowerMsg)
        const isEncouraging = /\b(you can|believe in you|proud|great job|well done|amazing work|keep going)\b/i.test(lowerMsg)
        
        // Get current relationship for context-aware updates
        const currentRelationship = currentCreature.relationship

        // VERY POSITIVE interactions - major affection boost
        if (isVeryPositive) {
          dispatch({ type: "UPDATE_AFFECTION", payload: { id: creatureId, delta: 5 } })
          dispatch({ type: "UPDATE_TRUST", payload: { id: creatureId, delta: 3 } })
          
          // Set loving mood for very positive feedback
          const veryHappyMoods: Array<"loving" | "excited"> = ["loving", "loving", "excited"] // Weight toward loving
          const randomMood = veryHappyMoods[Math.floor(Math.random() * veryHappyMoods.length)]
          dispatch({ type: "SET_MOOD", payload: { id: creatureId, mood: randomMood } })
        } 
        // POSITIVE interactions - good affection boost
        else if (isPositive) {
          dispatch({ type: "UPDATE_AFFECTION", payload: { id: creatureId, delta: 3 } })
          dispatch({ type: "UPDATE_TRUST", payload: { id: creatureId, delta: 2 } })
          
          const happyMoods: Array<"happy" | "excited" | "playful"> = ["happy", "excited", "playful"]
          const randomMood = happyMoods[Math.floor(Math.random() * happyMoods.length)]
          dispatch({ type: "SET_MOOD", payload: { id: creatureId, mood: randomMood } })
        } 
        // NEGATIVE interactions - decrease relationship
        else if (isNegative) {
          dispatch({ type: "UPDATE_AFFECTION", payload: { id: creatureId, delta: -3 } })
          dispatch({ type: "UPDATE_TRUST", payload: { id: creatureId, delta: -2 } })
          dispatch({ type: "SET_MOOD", payload: { id: creatureId, mood: "sad" } })
        } 
        // NEUTRAL but engaged - small affection gain
        else {
          dispatch({ type: "UPDATE_AFFECTION", payload: { id: creatureId, delta: 1 } })
        }

        // DEEP/PERSONAL QUESTIONS - major trust builder
        if (isDeepQuestion || isPersonalQuestion) {
          dispatch({ type: "UPDATE_TRUST", payload: { id: creatureId, delta: 4 } })
          dispatch({ type: "UPDATE_AFFECTION", payload: { id: creatureId, delta: 2 } })
          
          // Deep questions make the creature feel valued
          if (currentRelationship.mood !== "loving" && currentRelationship.mood !== "excited") {
            dispatch({ type: "SET_MOOD", payload: { id: creatureId, mood: "happy" } })
          }
        } 
        // SIMPLE QUESTIONS - moderate trust builder
        else if (isQuestion) {
          dispatch({ type: "UPDATE_TRUST", payload: { id: creatureId, delta: 2 } })
        }

        // EMOTIONAL SHARING - builds deep connection
        if (hasEmotionalSharing) {
          dispatch({ type: "UPDATE_TRUST", payload: { id: creatureId, delta: 3 } })
          dispatch({ type: "UPDATE_AFFECTION", payload: { id: creatureId, delta: 2 } })
        }

        // MESSAGE LENGTH - shows investment
        if (isVeryLong) {
          dispatch({ type: "UPDATE_AFFECTION", payload: { id: creatureId, delta: 3 } })
          dispatch({ type: "UPDATE_TRUST", payload: { id: creatureId, delta: 2 } })
        } else if (isLong) {
          dispatch({ type: "UPDATE_AFFECTION", payload: { id: creatureId, delta: 1 } })
          dispatch({ type: "UPDATE_TRUST", payload: { id: creatureId, delta: 1 } })
        }

        // COMFORTING when creature is sad - huge relationship boost!
        if (isComforting && currentRelationship.mood === "sad") {
          dispatch({ type: "UPDATE_AFFECTION", payload: { id: creatureId, delta: 6 } })
          dispatch({ type: "UPDATE_TRUST", payload: { id: creatureId, delta: 5 } })
          dispatch({ type: "SET_MOOD", payload: { id: creatureId, mood: "loving" } })
        }

        // PLAYFUL interactions - fun and bonding
        if (isPlayful) {
          dispatch({ type: "SET_MOOD", payload: { id: creatureId, mood: "playful" } })
          dispatch({ type: "UPDATE_AFFECTION", payload: { id: creatureId, delta: 2 } })
          dispatch({ type: "UPDATE_TRUST", payload: { id: creatureId, delta: 1 } })
        }

        // ENCOURAGING messages - shows you care
        if (isEncouraging) {
          dispatch({ type: "UPDATE_AFFECTION", payload: { id: creatureId, delta: 4 } })
          dispatch({ type: "UPDATE_TRUST", payload: { id: creatureId, delta: 2 } })
          dispatch({ type: "SET_MOOD", payload: { id: creatureId, mood: "happy" } })
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
