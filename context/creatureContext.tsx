"use client"

import type {
  CreatureData,
  SlimeData,
  MushroomData,
  SlimeColor,
  Direction,
  Behavior,
  Mode,
  MenuState,
  Message,
  Personality,
  MoodType,
  RelationshipLevel,
} from "@/types/creatureTypes"
import type React from "react"
import { createContext, useContext, useReducer } from "react"
import { getCreatureDefinition } from "@/components/CreatureGame/creatures"
import { getRandomFirstName } from "@/utils/nameUtils"

// Creature actions - generic actions that work for all creatures
export type CreatureAction =
  | { type: "ADD_CREATURE"; payload: CreatureData }
  | { type: "REMOVE_CREATURE"; payload: string }
  | { type: "CLEAR_ALL_CREATURES" }
  | { type: "SET_ACTIVE_CREATURE"; payload: string | null }
  // Generic creature actions
  | { type: "SET_WALKING"; payload: { id: string; value: boolean } }
  | { type: "SET_DIRECTION"; payload: { id: string; value: Direction } }
  | { type: "SET_MODE"; payload: { id: string; value: Mode } }
  | { type: "SET_POSITION"; payload: { id: string; value: number } }
  | { type: "INCREMENT_WALK_FRAME"; payload: string }
  | { type: "INCREMENT_IDLE_FRAME"; payload: string }
  | { type: "SET_BEHAVIOR"; payload: { id: string; value: Behavior } }
  | { type: "SET_LAST_INTERACTION"; payload: { id: string; value: number } }
  | { type: "SHOW_BUBBLE"; payload: { id: string; text: string } }
  | { type: "HIDE_BUBBLE"; payload: string }
  | { type: "SET_THINKING"; payload: { id: string; value: boolean } }
  | { type: "UPDATE_BUBBLE_TEXT"; payload: { id: string; text: string } }
  | { type: "SET_MENU_STATE"; payload: { id: string; state: MenuState } }
  | { type: "HIDE_ALL_BUBBLES"; payload: void }
  | { type: "ADD_MESSAGE"; payload: { id: string; message: Message } }
  | { type: "CLEAR_CONVERSATION"; payload: string }
  | { type: "SET_PERSONALITY"; payload: { id: string; personality: Personality } }
  | { type: "SET_CREATURE_NAME"; payload: { id: string; firstName: string } }
  // Relationship property actions
  | { type: "UPDATE_AFFECTION"; payload: { id: string; delta: number } } // Change affection by delta
  | { type: "UPDATE_TRUST"; payload: { id: string; delta: number } } // Change trust by delta
  | { type: "SET_MOOD"; payload: { id: string; mood: MoodType } } // Set mood directly
  | { type: "INCREMENT_INTERACTIONS"; payload: string } // Increment total interactions
  // Slime-specific actions
  | { type: "SET_SLIME_COLOR"; payload: { id: string; color: SlimeColor } }
  | { type: "SET_JUMPING"; payload: { id: string; value: boolean } }
  | { type: "SET_SLEEPING"; payload: { id: string; value: boolean } }
  | { type: "INCREMENT_JUMP_FRAME"; payload: string }
  // Mushroom-specific actions
  | { type: "SET_GLOWING"; payload: { id: string; value: boolean } }
  | { type: "SET_GLOW_INTENSITY"; payload: { id: string; value: number } }

export type CreatureState = {
  creatures: CreatureData[]
  activeCreatureId: string | null
}

const initialState: CreatureState = {
  creatures: [],
  activeCreatureId: null,
}

const CreatureContext = createContext<{
  state: CreatureState
  dispatch: React.Dispatch<CreatureAction>
}>({ state: initialState, dispatch: () => null })

type CreatureProviderProps = {
  children: React.ReactNode
}

export const CreatureProvider: React.FC<CreatureProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(creatureReducer, initialState)

  return <CreatureContext.Provider value={{ state, dispatch }}>{children}</CreatureContext.Provider>
}

// Helper function to get a random personality
const getRandomPersonality = (): Personality => {
  const personalities: Personality[] = ["playful", "shy", "energetic", "calm", "curious", "sleepy"]
  return personalities[Math.floor(Math.random() * personalities.length)]
}

// Helper function to determine relationship level based on affection AND trust
// Both matter for deeper relationships!
const getRelationshipLevel = (affection: number, trust: number): RelationshipLevel => {
  // Calculate a weighted score: affection is primary, trust is secondary
  const relationshipScore = affection * 0.7 + trust * 0.3
  
  // But also require minimum trust thresholds for deeper relationships
  if (relationshipScore >= 75 && trust >= 60) return "best friend"
  if (relationshipScore >= 55 && trust >= 45) return "close friend"
  if (relationshipScore >= 35 && trust >= 25) return "friend"
  if (relationshipScore >= 15 && trust >= 10) return "acquaintance"
  return "stranger"
}

// Helper function to create initial relationship properties
const createInitialRelationship = () => ({
  affection: 5, // Start as strangers
  trust: 5, // Start with minimal trust
  mood: "neutral" as MoodType,
  relationshipLevel: "stranger" as RelationshipLevel,
  totalInteractions: 0,
  lastMoodChange: Date.now(),
})

// Factory functions for creating initial creatures
export const createInitialSlime = (
  id: string, 
  color: SlimeColor, 
  position: number, 
  firstName?: string,
  personality?: Personality
): SlimeData => ({
  id,
  firstName, // Optional: will be undefined until user names the creature
  creatureType: "slime",
  color,
  personality: personality || getRandomPersonality(), // Use provided personality or fallback to random
  relationship: createInitialRelationship(),
  isWalking: false,
  isJumping: false,
  isSleeping: false,
  direction: 1,
  mode: "auto",
  position,
  jumpFrame: 0,
  walkFrame: 0,
  idleFrame: 0,
  currentBehavior: "idle",
  lastInteraction: Date.now(),
  bubble: {
    visible: false,
    text: "",
    menuState: "none",
  },
  isThinking: false,
  conversationHistory: [],
  capabilities: {
    canJump: true,
    canSleep: true,
    canTalk: true,
    canChangeColor: true,
    canGlow: false,
  },
})

export const createInitialMushroom = (
  id: string, 
  position: number, 
  firstName?: string,
  personality?: Personality
): MushroomData => ({
  id,
  firstName, // Optional: will be undefined until user names the creature
  creatureType: "mushroom",
  color: "default",
  personality: personality || getRandomPersonality(), // Use provided personality or fallback to random
  relationship: createInitialRelationship(),
  isWalking: true, // Mushrooms start walking
  isGlowing: false,
  glowIntensity: 0,
  direction: Math.random() > 0.5 ? 1 : -1,
  mode: "auto",
  position,
  walkFrame: 0,
  idleFrame: 0,
  currentBehavior: "idle",
  lastInteraction: Date.now(),
  bubble: {
    visible: false,
    text: "",
    menuState: "none",
  },
  isThinking: false,
  conversationHistory: [],
  capabilities: {
    canJump: false,
    canGlow: true,
    canSleep: false,
    canTalk: true, // Mushrooms can communicate!
    canChangeColor: false,
  },
})

const creatureReducer = (state: CreatureState, action: CreatureAction): CreatureState => {
  switch (action.type) {
    case "ADD_CREATURE":
      return {
        ...state,
        creatures: [...state.creatures, action.payload],
        activeCreatureId: state.activeCreatureId,
      }
    case "REMOVE_CREATURE":
      return {
        ...state,
        creatures: state.creatures.filter((creature) => creature.id !== action.payload),
        activeCreatureId: state.activeCreatureId === action.payload ? null : state.activeCreatureId,
      }
    case "CLEAR_ALL_CREATURES":
      return {
        ...state,
        creatures: [],
        activeCreatureId: null,
      }
    case "SET_ACTIVE_CREATURE":
      return {
        ...state,
        activeCreatureId: action.payload,
      }
    case "SET_SLIME_COLOR":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id && creature.creatureType === "slime"
            ? { ...creature, color: action.payload.color }
            : creature,
        ),
      }
    case "SET_PERSONALITY":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id ? { ...creature, personality: action.payload.personality } : creature,
        ),
      }
    case "SET_CREATURE_NAME":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id ? { ...creature, firstName: action.payload.firstName } : creature,
        ),
      }
    case "SET_WALKING":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id ? { ...creature, isWalking: action.payload.value } : creature,
        ),
      }
    case "SET_JUMPING":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id && creature.creatureType === "slime"
            ? {
                ...creature,
                isJumping: action.payload.value,
                jumpFrame: action.payload.value ? 0 : creature.jumpFrame,
              }
            : creature,
        ),
      }
    case "SET_SLEEPING":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id && creature.creatureType === "slime"
            ? { ...creature, isSleeping: action.payload.value }
            : creature,
        ),
      }
    case "SET_GLOWING":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id && creature.creatureType === "mushroom"
            ? { ...creature, isGlowing: action.payload.value }
            : creature,
        ),
      }
    case "SET_GLOW_INTENSITY":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id && creature.creatureType === "mushroom"
            ? { ...creature, glowIntensity: action.payload.value }
            : creature,
        ),
      }
    case "SET_DIRECTION":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id ? { ...creature, direction: action.payload.value } : creature,
        ),
      }
    case "SET_MODE":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id ? { ...creature, mode: action.payload.value } : creature,
        ),
      }
    case "SET_POSITION":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id ? { ...creature, position: action.payload.value } : creature,
        ),
      }
    case "INCREMENT_JUMP_FRAME":
      return {
        ...state,
        creatures: state.creatures.map((creature) => {
          if (creature.id !== action.payload || creature.creatureType !== "slime") return creature
          
          // Get frame count from creature definition
          const definition = getCreatureDefinition(creature.creatureType)
          const sprite = definition.sprites[creature.color]
          const maxFrames = sprite.animations.jump?.frameCount || 1
          
          return { ...creature, jumpFrame: (creature.jumpFrame + 1) % maxFrames }
        }),
      }
    case "INCREMENT_WALK_FRAME":
      return {
        ...state,
        creatures: state.creatures.map((creature) => {
          if (creature.id !== action.payload) return creature
          
          // Get max frames from creature definition
          const definition = getCreatureDefinition(creature.creatureType)
          const sprite = definition.sprites[creature.color]
          const maxFrames = sprite.animations.walk?.frameCount || 1
          
          return {
            ...creature,
            walkFrame: (creature.walkFrame + 1) % maxFrames,
          }
        }),
      }
    case "INCREMENT_IDLE_FRAME":
      return {
        ...state,
        creatures: state.creatures.map((creature) => {
          if (creature.id !== action.payload) return creature
          
          // Get max frames from creature definition
          const definition = getCreatureDefinition(creature.creatureType)
          const sprite = definition.sprites[creature.color]
          const maxFrames = sprite.animations.idle?.frameCount || 1
          
          return {
            ...creature,
            idleFrame: (creature.idleFrame + 1) % maxFrames,
          }
        }),
      }
    case "SET_BEHAVIOR":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id ? { ...creature, currentBehavior: action.payload.value } : creature,
        ),
      }
    case "SET_LAST_INTERACTION":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id ? { ...creature, lastInteraction: action.payload.value } : creature,
        ),
      }
    case "SHOW_BUBBLE":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id
            ? {
                ...creature,
                bubble: {
                  ...creature.bubble,
                  visible: true,
                  text: action.payload.text,
                  menuState: "none",
                },
              }
            : creature,
        ),
      }
    case "HIDE_BUBBLE":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload
            ? {
                ...creature,
                bubble: {
                  ...creature.bubble,
                  visible: false,
                  menuState: "none",
                },
              }
            : creature,
        ),
      }
    case "HIDE_ALL_BUBBLES":
      return {
        ...state,
        creatures: state.creatures.map((creature) => ({
          ...creature,
          bubble: {
            ...creature.bubble,
            visible: false,
            menuState: "none",
          },
        })),
      }
    case "SET_THINKING":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id ? { ...creature, isThinking: action.payload.value } : creature,
        ),
      }
    case "UPDATE_BUBBLE_TEXT":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id
            ? {
                ...creature,
                bubble: {
                  ...creature.bubble,
                  text: action.payload.text,
                },
              }
            : creature,
        ),
      }
    case "SET_MENU_STATE":
      // Hide all other bubbles first
      const updatedCreatures = state.creatures.map((creature) => {
        if (creature.id === action.payload.id) {
          return {
            ...creature,
            bubble: {
              ...creature.bubble,
              visible: true,
              menuState: action.payload.state as MenuState,
              text: action.payload.state !== "none" ? "" : creature.bubble.text,
            },
          }
        } else {
          return {
            ...creature,
            bubble: {
              ...creature.bubble,
              visible: false,
              menuState: "none" as MenuState,
            },
          }
        }
      })

      return {
        ...state,
        creatures: updatedCreatures,
      }
    case "ADD_MESSAGE":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id
            ? {
                ...creature,
                conversationHistory: [...creature.conversationHistory, action.payload.message],
              }
            : creature,
        ),
      }
    case "CLEAR_CONVERSATION":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload ? { ...creature, conversationHistory: [] } : creature,
        ),
      }
    case "UPDATE_AFFECTION":
      return {
        ...state,
        creatures: state.creatures.map((creature) => {
          if (creature.id !== action.payload.id) return creature
          const newAffection = Math.max(0, Math.min(100, creature.relationship.affection + action.payload.delta))
          const newLevel = getRelationshipLevel(newAffection, creature.relationship.trust)
          return {
            ...creature,
            relationship: {
              ...creature.relationship,
              affection: newAffection,
              relationshipLevel: newLevel,
            },
          }
        }),
      }
    case "UPDATE_TRUST":
      return {
        ...state,
        creatures: state.creatures.map((creature) => {
          if (creature.id !== action.payload.id) return creature
          const newTrust = Math.max(0, Math.min(100, creature.relationship.trust + action.payload.delta))
          const newLevel = getRelationshipLevel(creature.relationship.affection, newTrust)
          return {
            ...creature,
            relationship: {
              ...creature.relationship,
              trust: newTrust,
              relationshipLevel: newLevel,
            },
          }
        }),
      }
    case "SET_MOOD":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload.id
            ? {
                ...creature,
                relationship: {
                  ...creature.relationship,
                  mood: action.payload.mood,
                  lastMoodChange: Date.now(),
                },
              }
            : creature,
        ),
      }
    case "INCREMENT_INTERACTIONS":
      return {
        ...state,
        creatures: state.creatures.map((creature) =>
          creature.id === action.payload
            ? {
                ...creature,
                relationship: {
                  ...creature.relationship,
                  totalInteractions: creature.relationship.totalInteractions + 1,
                },
              }
            : creature,
        ),
      }
    default:
      return state
  }
}

export const useCreature = () => {
  const context = useContext(CreatureContext)
  if (!context) {
    throw new Error("useCreature must be used within a CreatureProvider")
  }
  return context
}

// Backward compatibility exports
export type { SlimeData, MushroomData, CreatureData }
export { getRandomPersonality }
