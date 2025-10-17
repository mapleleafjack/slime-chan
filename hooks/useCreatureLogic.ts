"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { getBehaviorDuration, getRandomPhrase, getRandomJapanesePhrase, randomInt } from "@/utils/gameUtils"
import { useCreature } from "@/context/creatureContext"
import { isSlime, type Behavior } from "@/types/creatureTypes"
import { getCreatureDefinition } from "@/components/CreatureGame/creatures"
import type { CreatureDefinition } from "@/components/CreatureGame/creatures/types"

// Track behavior state outside of component to prevent re-renders
const slimeBehaviorState = new Map<
  string,
  {
    isRunningBehavior: boolean
    currentBehavior: Behavior | null
    lastBehaviorChange: number
    isChangingDirection: boolean
    currentSpeed: number
    lastSpeedChange: number
  }
>()

export const useCreatureLogic = (slimeId: string) => {
  const { state, dispatch } = useCreature()
  const creature = state.creatures.find((c) => c.id === slimeId)
  const slime = creature && isSlime(creature) ? creature : null
  const [isProcessingEdge, setIsProcessingEdge] = useState(false)

  // Get the creature definition based on creature type
  const definition: CreatureDefinition | null = creature ? getCreatureDefinition(creature.creatureType) : null
  const physics = definition?.physics

  // Initialize behavior state if not exists
  if (!slimeBehaviorState.has(slimeId) && physics) {
    slimeBehaviorState.set(slimeId, {
      isRunningBehavior: false,
      currentBehavior: null,
      lastBehaviorChange: 0,
      isChangingDirection: false,
      currentSpeed: physics.baseSpeed,
      lastSpeedChange: 0,
    })
  }

  const slimeRef = useRef(slime)
  const behaviorTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameIdRef = useRef<number | null>(null)
  const idleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const forceActivityRef = useRef<NodeJS.Timeout | null>(null)
  const edgeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPositionRef = useRef<number | null>(null)
  const idleJumpTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const speedChangeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Update ref when slime changes to avoid dependency issues
  useEffect(() => {
    slimeRef.current = slime
  }, [slime])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (behaviorTimeoutRef.current) {
        clearTimeout(behaviorTimeoutRef.current)
      }
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
      if (idleCheckIntervalRef.current) {
        clearInterval(idleCheckIntervalRef.current)
      }
      if (forceActivityRef.current) {
        clearInterval(forceActivityRef.current)
      }
      if (edgeTimeoutRef.current) {
        clearTimeout(edgeTimeoutRef.current)
      }
      if (idleJumpTimeoutRef.current) {
        clearTimeout(idleJumpTimeoutRef.current)
      }
      if (speedChangeIntervalRef.current) {
        clearInterval(speedChangeIntervalRef.current)
      }
      slimeBehaviorState.delete(slimeId)
    }
  }, [slimeId])

  // Randomly change speed for dynamic movement
  const updateSpeed = useCallback(() => {
    if (!physics) return
    
    const behaviorState = slimeBehaviorState.get(slimeId)
    if (!behaviorState) return

    // Only change speed occasionally
    const now = Date.now()
    if (now - behaviorState.lastSpeedChange < 2000) return

    // Generate a new random speed between min and max
    const newSpeed = physics.minSpeed + Math.random() * (physics.maxSpeed - physics.minSpeed)

    behaviorState.currentSpeed = newSpeed
    behaviorState.lastSpeedChange = now
  }, [slimeId, physics])

  // Set up speed variation interval
  useEffect(() => {
    if (!slime) return

    // Clear any existing interval
    if (speedChangeIntervalRef.current) {
      clearInterval(speedChangeIntervalRef.current)
    }

    // Update speed randomly every few seconds
    speedChangeIntervalRef.current = setInterval(() => {
      updateSpeed()
    }, 3000)

    return () => {
      if (speedChangeIntervalRef.current) {
        clearInterval(speedChangeIntervalRef.current)
      }
    }
  }, [slime, updateSpeed])

  // Increase the animation speed significantly to make movement smoother
  const moveSlime = useCallback(
    (delta: number) => {
      if (!physics || !definition) return
      
      const currentSlime = slimeRef.current
      if (!currentSlime) return

      // Store the last position for stuck detection
      lastPositionRef.current = currentSlime.position

      // Get current speed from behavior state
      const behaviorState = slimeBehaviorState.get(slimeId)
      const currentSpeed = behaviorState ? behaviorState.currentSpeed : physics.baseSpeed

      // Get the frameWidth from the creature's sprite definition
      const frameWidth = definition.sprites[isSlime(currentSlime) ? currentSlime.color : 'default']?.frameWidth || 128

      // Use 480 (game width) instead of window.innerWidth to keep slimes within the game container
      const newPosition = Math.max(
        0,
        Math.min(currentSlime.position + delta * currentSpeed, 480 - frameWidth),
      )

      // Only update position if it's actually changing
      if (newPosition !== currentSlime.position) {
        dispatch({ type: "SET_POSITION", payload: { id: slimeId, value: newPosition } })
      }

      // Check if we've hit an edge and need to change direction
      const hitLeftEdge = newPosition <= 0
      const hitRightEdge = newPosition >= 480 - frameWidth

      if ((hitLeftEdge || hitRightEdge) && !isProcessingEdge) {
        handleEdgeCollision(hitLeftEdge)
      }
    },
    [dispatch, slimeId, isProcessingEdge, physics, definition],
  )

  // Handle edge collision with debounce to prevent infinite loops
  const handleEdgeCollision = useCallback(
    (hitLeftEdge: boolean) => {
      const behaviorState = slimeBehaviorState.get(slimeId)
      if (!behaviorState || behaviorState.isChangingDirection || isProcessingEdge) return

      setIsProcessingEdge(true)
      behaviorState.isChangingDirection = true

      // Clear any existing behavior timeout
      if (behaviorTimeoutRef.current) {
        clearTimeout(behaviorTimeoutRef.current)
        behaviorTimeoutRef.current = null
      }

      // Stop current movement
      dispatch({ type: "SET_WALKING", payload: { id: slimeId, value: false } })

      // Set a short timeout before changing direction to prevent rapid state changes
      edgeTimeoutRef.current = setTimeout(() => {
        const newDirection = hitLeftEdge ? 1 : -1
        const newBehavior = hitLeftEdge ? "walkRight" : "walkLeft"

        // Update behavior state
        if (behaviorState) {
          behaviorState.currentBehavior = newBehavior
          behaviorState.isRunningBehavior = false
          behaviorState.lastBehaviorChange = Date.now()
          behaviorState.isChangingDirection = false
        }

        // Update direction and behavior
        dispatch({ type: "SET_DIRECTION", payload: { id: slimeId, value: newDirection } })
        dispatch({ type: "SET_BEHAVIOR", payload: { id: slimeId, value: newBehavior } })

        // Start walking again after a short delay
        setTimeout(() => {
          dispatch({ type: "SET_WALKING", payload: { id: slimeId, value: true } })
          setIsProcessingEdge(false)
        }, 100)

        edgeTimeoutRef.current = null
      }, 300)
    },
    [dispatch, slimeId, isProcessingEdge],
  )

  // Handle idle jumping
  const handleIdleJump = useCallback(() => {
    const currentSlime = slimeRef.current
    if (!currentSlime || currentSlime.isJumping || currentSlime.isWalking || currentSlime.isSleeping) return

    // Only jump if in idle state
    if (currentSlime.currentBehavior === "idle") {
      // Show a random phrase
      const phrase = Math.random() > 0.5 ? "Whee!" : getRandomJapanesePhrase()
      dispatch({ type: "SHOW_BUBBLE", payload: { id: slimeId, text: phrase } })

      // Start jumping
      dispatch({ type: "SET_JUMPING", payload: { id: slimeId, value: true } })

      // Schedule next idle jump check
      scheduleNextIdleJumpCheck()
    }
  }, [dispatch, slimeId])

  // Schedule the next idle jump check
  const scheduleNextIdleJumpCheck = useCallback(() => {
    if (!physics || !physics.idleJumpProbability) return
    
    if (idleJumpTimeoutRef.current) {
      clearTimeout(idleJumpTimeoutRef.current)
    }

    // Check for idle jump after a random delay
    idleJumpTimeoutRef.current = setTimeout(
      () => {
        // Only attempt to jump if probability check passes
        if (Math.random() < physics.idleJumpProbability!) {
          handleIdleJump()
        } else {
          // If we didn't jump this time, schedule another check
          scheduleNextIdleJumpCheck()
        }
      },
      randomInt(3000, 8000),
    )
  }, [handleIdleJump, physics])

  // Initialize idle jump checking
  useEffect(() => {
    if (!slime) return

    scheduleNextIdleJumpCheck()

    return () => {
      if (idleJumpTimeoutRef.current) {
        clearTimeout(idleJumpTimeoutRef.current)
      }
    }
  }, [slime, scheduleNextIdleJumpCheck])

  // Handle automatic behavior selection
  const pickNextBehavior = useCallback(() => {
    if (!physics || !definition) return
    
    const currentSlime = slimeRef.current
    if (!currentSlime) return

    // Prioritize movement behaviors over idle
    // Increase probability of walking and jumping for more activity
    const behaviors: Behavior[] = [
      "walkLeft",
      "walkLeft", // Double weight for walking
      "walkRight",
      "walkRight",
      "jump",
      "jump", // Double weight for jumping
      "sleep",
      "idle",
    ]

    const edgeThreshold = 100
    
    // Get the frameWidth from the creature's sprite definition
    const frameWidth = definition.sprites[isSlime(currentSlime) ? currentSlime.color : 'default']?.frameWidth || 128

    if (currentSlime.position < edgeThreshold) {
      behaviors.push("walkRight", "walkRight", "walkRight") // Triple weight for walking right when near left edge
    } else if (currentSlime.position > 480 - frameWidth - edgeThreshold) {
      behaviors.push("walkLeft", "walkLeft", "walkLeft") // Triple weight for walking left when near right edge
    }

    const choice = behaviors[randomInt(0, behaviors.length - 1)]

    // Update behavior state
    const behaviorState = slimeBehaviorState.get(slimeId)
    if (behaviorState) {
      behaviorState.currentBehavior = choice
      behaviorState.isRunningBehavior = false
      behaviorState.lastBehaviorChange = Date.now()
    }

    dispatch({ type: "SET_BEHAVIOR", payload: { id: slimeId, value: choice } })

    return choice
  }, [dispatch, slimeId, physics, definition])

  // Handle behavior execution
  const runBehavior = useCallback(
    (behavior: Behavior) => {
      const behaviorState = slimeBehaviorState.get(slimeId)
      if (!behaviorState || behaviorState.isRunningBehavior || behaviorState.isChangingDirection) return

      behaviorState.isRunningBehavior = true

      if (!slimeRef.current) return

      // Reset all states first
      dispatch({ type: "SET_WALKING", payload: { id: slimeId, value: false } })
      dispatch({ type: "SET_JUMPING", payload: { id: slimeId, value: false } })
      dispatch({ type: "SET_SLEEPING", payload: { id: slimeId, value: false } })
      dispatch({ type: "HIDE_BUBBLE", payload: slimeId })

      switch (behavior) {
        case "walkLeft":
        case "walkRight":
          dispatch({ type: "SET_DIRECTION", payload: { id: slimeId, value: behavior === "walkLeft" ? -1 : 1 } })
          dispatch({ type: "SET_WALKING", payload: { id: slimeId, value: true } })

          // Occasionally add a jump while walking for diagonal movement
          if (Math.random() < 0.3) {
            setTimeout(
              () => {
                if (slimeRef.current && slimeRef.current.isWalking && !slimeRef.current.isJumping) {
                  dispatch({ type: "SET_JUMPING", payload: { id: slimeId, value: true } })
                }
              },
              randomInt(300, 1000),
            )
          }
          break
        case "jump":
          dispatch({ type: "SET_JUMPING", payload: { id: slimeId, value: true } })
          dispatch({ type: "SHOW_BUBBLE", payload: { id: slimeId, text: "ジャンプ！" } })

          // Sometimes add walking during jump for diagonal movement
          if (Math.random() < 0.5) {
            const direction = Math.random() > 0.5 ? 1 : -1
            dispatch({ type: "SET_DIRECTION", payload: { id: slimeId, value: direction } })
            dispatch({ type: "SET_WALKING", payload: { id: slimeId, value: true } })
          }
          break
        case "sleep":
          dispatch({ type: "SHOW_BUBBLE", payload: { id: slimeId, text: "zzz..." } })
          dispatch({ type: "SET_SLEEPING", payload: { id: slimeId, value: true } })
          break
        case "talk":
          dispatch({ type: "SHOW_BUBBLE", payload: { id: slimeId, text: getRandomPhrase() } })
          break
        case "idle":
        default:
          // Make idle state shorter for unselected slimes
          const isUnselected = state.activeCreatureId !== slimeId
          if (isUnselected) {
            // Force a new behavior after a short idle period
            if (behaviorTimeoutRef.current) {
              clearTimeout(behaviorTimeoutRef.current)
            }
            behaviorTimeoutRef.current = setTimeout(() => {
              const state = slimeBehaviorState.get(slimeId)
              if (state) {
                state.isRunningBehavior = false
              }
              pickNextBehavior()
              behaviorTimeoutRef.current = null
            }, 1000) // Short idle time for unselected slimes
            return
          }
          break
      }

      // Clear any existing timeout
      if (behaviorTimeoutRef.current) {
        clearTimeout(behaviorTimeoutRef.current)
      }

      const duration = getBehaviorDuration(behavior)
      behaviorTimeoutRef.current = setTimeout(() => {
        if (behavior === "sleep") dispatch({ type: "SET_SLEEPING", payload: { id: slimeId, value: false } })

        // Reset running state
        const state = slimeBehaviorState.get(slimeId)
        if (state) {
          state.isRunningBehavior = false
        }

        pickNextBehavior()
        behaviorTimeoutRef.current = null
      }, duration)
    },
    [dispatch, pickNextBehavior, slimeId, state.activeCreatureId],
  )

  // Modify the animation interval to allow for diagonal jumping
  useEffect(() => {
    if (!slime || !physics) return

    // Clear any existing animation frame
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current)
    }

    // Use requestAnimationFrame for smoother animations
    let lastTimestamp = 0

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp
      const elapsed = timestamp - lastTimestamp

      // Only update at the desired frame rate
      if (elapsed > 1000 / physics.fps) {
        const currentSlime = slimeRef.current
        if (currentSlime) {
          // Allow walking while jumping (diagonal jumping)
          if (currentSlime.isWalking && !isProcessingEdge) {
            dispatch({ type: "INCREMENT_WALK_FRAME", payload: slimeId })
            moveSlime(physics.baseSpeed * currentSlime.direction)
          }

          if (currentSlime.isJumping) {
            dispatch({ type: "INCREMENT_JUMP_FRAME", payload: slimeId })

            // Add horizontal movement during jump if walking is also active
            if (currentSlime.isWalking && !isProcessingEdge) {
              moveSlime(physics.baseSpeed * 0.7 * currentSlime.direction)
            }
          }

          if (!currentSlime.isWalking && !currentSlime.isJumping) {
            dispatch({ type: "INCREMENT_IDLE_FRAME", payload: slimeId })
          }
        }
        lastTimestamp = timestamp
      }

      animationFrameIdRef.current = requestAnimationFrame(animate)
    }

    animationFrameIdRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [dispatch, moveSlime, slimeId, slime, isProcessingEdge, physics])

  // Initialize behavior once
  useEffect(() => {
    if (!slime) return

    // Only initialize if in auto mode and not already running a behavior
    const behaviorState = slimeBehaviorState.get(slimeId)
    if (slime.mode === "auto" && behaviorState && !behaviorState.currentBehavior) {
      pickNextBehavior()
    }
  }, [pickNextBehavior, slime, slimeId])

  // Handle behavior changes - always run for unselected slimes
  useEffect(() => {
    if (!slime) return

    // Force unselected slimes to start behaviors if they're in auto mode
    const isUnselected = state.activeCreatureId !== slimeId
    const behaviorState = slimeBehaviorState.get(slimeId)

    if (
      isUnselected &&
      slime.mode === "auto" &&
      behaviorState &&
      !behaviorState.isChangingDirection &&
      !isProcessingEdge
    ) {
      // If the slime has a behavior and it's not running, run it
      if (slime.currentBehavior && !behaviorState.isRunningBehavior) {
        runBehavior(slime.currentBehavior)
      }
      // If the slime doesn't have a behavior or it's idle, pick a new one
      else if (!slime.currentBehavior || slime.currentBehavior === "idle") {
        pickNextBehavior()
      }
    }
  }, [state.activeCreatureId, slimeId, slime, pickNextBehavior, runBehavior, isProcessingEdge])

  // Force activity for unselected slimes and detect stuck slimes
  useEffect(() => {
    if (!slime) return

    // Clear any existing interval
    if (forceActivityRef.current) {
      clearInterval(forceActivityRef.current)
    }

    // Check every second if unselected slimes need to be activated
    forceActivityRef.current = setInterval(() => {
      const currentSlime = slimeRef.current
      if (!currentSlime) return

      const isUnselected = state.activeCreatureId !== slimeId
      const behaviorState = slimeBehaviorState.get(slimeId)

      if (
        isUnselected &&
        currentSlime.mode === "auto" &&
        behaviorState &&
        !behaviorState.isChangingDirection &&
        !isProcessingEdge
      ) {
        const now = Date.now()
        const inactiveTime = now - behaviorState.lastBehaviorChange

        // Check if slime is stuck (position not changing despite walking)
        const isStuck =
          currentSlime.isWalking &&
          lastPositionRef.current !== null &&
          lastPositionRef.current === currentSlime.position

        // If slime is stuck, force a direction change
        if (isStuck) {
          // Stop current behavior
          if (behaviorTimeoutRef.current) {
            clearTimeout(behaviorTimeoutRef.current)
          }

          // Reset behavior state
          behaviorState.isRunningBehavior = false
          behaviorState.isChangingDirection = true

          // Stop walking
          dispatch({ type: "SET_WALKING", payload: { id: slimeId, value: false } })

          // Wait a moment before changing direction
          setTimeout(() => {
            // Change direction
            const newDirection = currentSlime.direction === 1 ? -1 : 1
            dispatch({ type: "SET_DIRECTION", payload: { id: slimeId, value: newDirection } })

            // Set new behavior based on direction
            const newBehavior = newDirection === 1 ? "walkRight" : "walkLeft"
            dispatch({ type: "SET_BEHAVIOR", payload: { id: slimeId, value: newBehavior } })

            // Update behavior state
            behaviorState.currentBehavior = newBehavior
            behaviorState.lastBehaviorChange = Date.now()
            behaviorState.isChangingDirection = false

            // Start walking again
            dispatch({ type: "SET_WALKING", payload: { id: slimeId, value: true } })
          }, 300)

          return
        }

        // If slime has been inactive or idle for too long (3 seconds), force a new behavior
        if (inactiveTime > 3000 || currentSlime.currentBehavior === "idle") {
          // Reset behavior state
          behaviorState.isRunningBehavior = false
          behaviorState.currentBehavior = null

          // Force a new active behavior (not idle)
          const newBehavior = pickNextBehavior()

          // If we still got idle, try again with a more active behavior
          if (newBehavior === "idle") {
            const forcedBehaviors: Behavior[] = ["walkLeft", "walkRight", "jump"]
            const forcedBehavior = forcedBehaviors[randomInt(0, forcedBehaviors.length - 1)]
            dispatch({ type: "SET_BEHAVIOR", payload: { id: slimeId, value: forcedBehavior } })
            behaviorState.currentBehavior = forcedBehavior
          }

          // Run the behavior immediately
          if (behaviorState.currentBehavior) {
            runBehavior(behaviorState.currentBehavior)
          }
        }
      }
    }, 1000)

    return () => {
      if (forceActivityRef.current) {
        clearInterval(forceActivityRef.current)
      }
    }
  }, [slime, slimeId, state.activeCreatureId, pickNextBehavior, runBehavior, dispatch, isProcessingEdge])

  // Function to handle transition to auto mode
  const transitionToAutoMode = useCallback(() => {
    dispatch({ type: "SET_MODE", payload: { id: slimeId, value: "auto" } })
    dispatch({ type: "SET_WALKING", payload: { id: slimeId, value: false } })
    dispatch({ type: "SET_JUMPING", payload: { id: slimeId, value: false } })
    dispatch({ type: "SET_SLEEPING", payload: { id: slimeId, value: false } })
    dispatch({ type: "HIDE_BUBBLE", payload: slimeId })

    // Reset behavior state
    const behaviorState = slimeBehaviorState.get(slimeId)
    if (behaviorState) {
      behaviorState.currentBehavior = null
      behaviorState.isRunningBehavior = false
      behaviorState.lastBehaviorChange = Date.now()
      behaviorState.isChangingDirection = false
    }

    // Immediately pick and run a new behavior
    const newBehavior = pickNextBehavior()
    if (newBehavior) {
      runBehavior(newBehavior)
    }
  }, [dispatch, pickNextBehavior, runBehavior, slimeId])

  // Check for active slime changes
  useEffect(() => {
    const currentSlime = slimeRef.current
    if (!currentSlime) return

    // If this slime was active and is now deselected, immediately start AI behavior
    if (state.activeCreatureId !== slimeId && currentSlime.mode === "user") {
      transitionToAutoMode()
    }
  }, [state.activeCreatureId, slimeId, transitionToAutoMode])

  // Idle detection
  useEffect(() => {
    if (!slime) return

    // Clear any existing interval
    if (idleCheckIntervalRef.current) {
      clearInterval(idleCheckIntervalRef.current)
    }

    // Also keep the regular idle check for user interaction timeout
    idleCheckIntervalRef.current = setInterval(() => {
      const currentSlime = slimeRef.current
      if (!currentSlime) return

      if (currentSlime.mode === "user" && Date.now() - currentSlime.lastInteraction >= 5000) {
        transitionToAutoMode()
      }
    }, 1000)

    return () => {
      if (idleCheckIntervalRef.current) {
        clearInterval(idleCheckIntervalRef.current)
      }
    }
  }, [dispatch, pickNextBehavior, runBehavior, slimeId, slime, transitionToAutoMode])

  return null
}
