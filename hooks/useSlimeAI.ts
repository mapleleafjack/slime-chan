"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { useSlime } from "@/context/slimeContext"
import { useAIConfig } from "@/context/aiConfigContext"
import { generateSlimeResponse, generateAutonomousSpeech, getFallbackResponse } from "@/utils/aiService"

export const useSlimeAI = (slimeId: string) => {
  const { state, dispatch } = useSlime()
  const slime = state.slimes.find((s) => s.id === slimeId)
  const { config, isConfigured } = useAIConfig()
  const [isProcessing, setIsProcessing] = useState(false)

  const slimeRef = useRef(slime)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Update ref when slime changes to avoid dependency issues
  useEffect(() => {
    slimeRef.current = slime
  }, [slime])

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
      const currentSlime = slimeRef.current
      if (!currentSlime) return // Exit if slime is null or undefined
      if (currentSlime.isThinking || isProcessing) return

      setIsProcessing(true)

      try {
        // Hide all other bubbles first
        dispatch({ type: "HIDE_ALL_BUBBLES", payload: undefined })

        // Reset interaction timer and force user mode
        dispatch({ type: "SET_LAST_INTERACTION", payload: { id: slimeId, value: Date.now() } })
        dispatch({ type: "SET_MODE", payload: { id: slimeId, value: "user" } })

        // Add user message to conversation history
        const userMessage = {
          id: `${slimeId}-${Date.now()}-user`,
          role: "user" as const,
          content: message,
          timestamp: Date.now(),
        }
        dispatch({ type: "ADD_MESSAGE", payload: { id: slimeId, message: userMessage } })

        // Show thinking state
        dispatch({ type: "SET_THINKING", payload: { id: slimeId, value: true } })

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
            currentSlime,
            message,
            currentSlime.personality,
            currentSlime.conversationHistory,
          )

          if (aiResponse.success) {
            console.log(`✓ AI response: "${aiResponse.message}"`)
            responseText = aiResponse.message
          } else {
            // Log error but don't show to user, fall back to random phrase
            console.warn("⚠️ AI response failed:", aiResponse.error)
            console.log("↻ Using fallback response")
            responseText = getFallbackResponse()
          }
        } else {
          // Use fallback when AI is not configured
          console.log("ℹ️ AI not configured, using fallback response")
          responseText = getFallbackResponse()
        }

        // Add slime response to conversation history
        const slimeMessage = {
          id: `${slimeId}-${Date.now()}-slime`,
          role: "slime" as const,
          content: responseText,
          timestamp: Date.now(),
        }
        dispatch({ type: "ADD_MESSAGE", payload: { id: slimeId, message: slimeMessage } })

        // Also update bubble for slimes that don't have the panel open
        dispatch({ type: "UPDATE_BUBBLE_TEXT", payload: { id: slimeId, text: responseText } })
        dispatch({ type: "SET_LAST_INTERACTION", payload: { id: slimeId, value: Date.now() } })

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // Auto-hide bubble after 8 seconds if menu is not open (longer for AI responses)
        timeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) return

          const currentState = state.slimes.find((s) => s.id === slimeId)
          if (currentState && !currentState.isThinking && currentState.bubble.menuState === "none") {
            dispatch({ type: "HIDE_BUBBLE", payload: slimeId })
          }
          timeoutRef.current = null
        }, 8000)
      } finally {
        if (isMountedRef.current) {
          dispatch({ type: "SET_THINKING", payload: { id: slimeId, value: false } })
          setIsProcessing(false)
        }
      }
    },
    [dispatch, slimeId, state.slimes, isProcessing, config, isConfigured],
  )

  // Auto-interaction when in talk mode
  useEffect(() => {
    // Skip AI processing for the active slime to improve performance
    if (slime && state.activeSlimeId === slimeId) return

    if (slime && slime.currentBehavior === "talk" && !slime.isThinking && !isProcessing) {
      // Use autonomous speech for better context-aware responses
      const generateAutonomous = async () => {
        if (!slime || slime.isThinking || isProcessing) return
        
        setIsProcessing(true)
        dispatch({ type: "SHOW_BUBBLE", payload: { id: slimeId, text: "..." } })
        dispatch({ type: "SET_THINKING", payload: { id: slimeId, value: true } })

        let responseText: string

        if (isConfigured) {
          const aiResponse = await generateAutonomousSpeech(config, slime, slime.personality)
          responseText = aiResponse.success ? aiResponse.message : getFallbackResponse()
        } else {
          responseText = getFallbackResponse()
        }

        dispatch({ type: "UPDATE_BUBBLE_TEXT", payload: { id: slimeId, text: responseText } })
        dispatch({ type: "SET_THINKING", payload: { id: slimeId, value: false } })
        setIsProcessing(false)
      }

      generateAutonomous()
    }
  }, [slime?.currentBehavior, slime, isProcessing, state.activeSlimeId, slimeId, config, isConfigured, dispatch])

  return { handleUserMessage }
}
