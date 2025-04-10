"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { useSlime } from "@/context/slimeContext"
import { getRandomJapanesePhrase } from "@/utils/slimeUtils"

export const useSlimeAI = (slimeId: string) => {
  const { state, dispatch } = useSlime()
  const slime = state.slimes.find((s) => s.id === slimeId)
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

        // Show initial bubble
        dispatch({ type: "SHOW_BUBBLE", payload: { id: slimeId, text: "..." } })
        dispatch({ type: "SET_THINKING", payload: { id: slimeId, value: true } })

        // Add a small delay to prevent text flashing
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Check if component is still mounted
        if (!isMountedRef.current) return

        // Generate a random Japanese phrase
        const response = getRandomJapanesePhrase()

        // Update bubble and keep in user mode
        dispatch({ type: "UPDATE_BUBBLE_TEXT", payload: { id: slimeId, text: response } })
        dispatch({ type: "SET_LAST_INTERACTION", payload: { id: slimeId, value: Date.now() } })

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // Auto-hide after 5 seconds if menu is not open
        timeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) return

          const currentState = state.slimes.find((s) => s.id === slimeId)
          if (currentState && !currentState.isThinking && currentState.bubble.menuState === "none") {
            dispatch({ type: "HIDE_BUBBLE", payload: slimeId })
          }
          timeoutRef.current = null
        }, 5000)
      } finally {
        if (isMountedRef.current) {
          dispatch({ type: "SET_THINKING", payload: { id: slimeId, value: false } })
          setIsProcessing(false)
        }
      }
    },
    [dispatch, slimeId, state.slimes, isProcessing],
  )

  // Auto-interaction when in talk mode
  useEffect(() => {
    // Skip AI processing for the active slime to improve performance
    if (slime && state.activeSlimeId === slimeId) return

    if (slime && slime.currentBehavior === "talk" && !slime.isThinking && !isProcessing) {
      handleUserMessage("Say something playful!")
    }
  }, [slime?.currentBehavior, handleUserMessage, slime, isProcessing, state.activeSlimeId, slimeId])

  return { handleUserMessage }
}
