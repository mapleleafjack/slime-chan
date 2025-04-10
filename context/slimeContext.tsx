"use client"

import { ANIMATION_CONFIG } from "@/components/SlimeGame/animationConfig"
import type React from "react"
import { createContext, useContext, useReducer } from "react"

export type SlimeColor = "blue" | "red" | "green"
export type Direction = 1 | -1
export type Behavior = "walkLeft" | "walkRight" | "jump" | "sleep" | "talk" | "idle"
export type Mode = "user" | "auto"
export type MenuState = "main" | "color" | "none"

// Update the SlimeData type to include showMenu flag
export type SlimeData = {
  id: string
  color: SlimeColor
  isWalking: boolean
  isJumping: boolean
  isSleeping: boolean
  direction: Direction
  mode: Mode
  position: number
  jumpFrame: number
  walkFrame: number
  idleFrame: number
  currentBehavior: Behavior
  lastInteraction: number
  bubble: {
    visible: boolean
    text: string
    menuState: MenuState
  }
  isThinking: boolean
}

// Add new action types
type SlimeAction =
  | { type: "ADD_SLIME"; payload: { id: string; color: SlimeColor; position: number } }
  | { type: "REMOVE_SLIME"; payload: string }
  | { type: "SET_ACTIVE_SLIME"; payload: string | null }
  | { type: "SET_SLIME_COLOR"; payload: { id: string; color: SlimeColor } }
  | { type: "SET_WALKING"; payload: { id: string; value: boolean } }
  | { type: "SET_JUMPING"; payload: { id: string; value: boolean } }
  | { type: "SET_SLEEPING"; payload: { id: string; value: boolean } }
  | { type: "SET_DIRECTION"; payload: { id: string; value: Direction } }
  | { type: "SET_MODE"; payload: { id: string; value: Mode } }
  | { type: "SET_POSITION"; payload: { id: string; value: number } }
  | { type: "INCREMENT_JUMP_FRAME"; payload: string }
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

export type SlimeState = {
  slimes: SlimeData[]
  activeSlimeId: string | null
}

const initialState: SlimeState = {
  slimes: [],
  activeSlimeId: null,
}

const SlimeContext = createContext<{
  state: SlimeState
  dispatch: React.Dispatch<SlimeAction>
}>({ state: initialState, dispatch: () => null })

type SlimeProviderProps = {
  children: React.ReactNode
}

export const SlimeProvider: React.FC<SlimeProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(slimeReducer, initialState)

  return <SlimeContext.Provider value={{ state, dispatch }}>{children}</SlimeContext.Provider>
}

// Update the initial state for a slime
const createInitialSlime = (id: string, color: SlimeColor, position: number): SlimeData => ({
  id,
  color,
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
})

const slimeReducer = (state: SlimeState, action: SlimeAction): SlimeState => {
  switch (action.type) {
    // Update the ADD_SLIME case in the reducer
    case "ADD_SLIME":
      return {
        ...state,
        slimes: [...state.slimes, createInitialSlime(action.payload.id, action.payload.color, action.payload.position)],
        // Remove the automatic selection of new slimes
        activeSlimeId: state.activeSlimeId,
      }
    case "REMOVE_SLIME":
      return {
        ...state,
        slimes: state.slimes.filter((slime) => slime.id !== action.payload),
        activeSlimeId: state.activeSlimeId === action.payload ? null : state.activeSlimeId,
      }
    case "SET_ACTIVE_SLIME":
      return {
        ...state,
        activeSlimeId: action.payload,
      }
    case "SET_SLIME_COLOR":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload.id ? { ...slime, color: action.payload.color } : slime,
        ),
      }
    case "SET_WALKING":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload.id ? { ...slime, isWalking: action.payload.value } : slime,
        ),
      }
    case "SET_JUMPING":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload.id
            ? {
                ...slime,
                isJumping: action.payload.value,
                jumpFrame: action.payload.value ? 0 : slime.jumpFrame,
              }
            : slime,
        ),
      }
    case "SET_SLEEPING":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload.id ? { ...slime, isSleeping: action.payload.value } : slime,
        ),
      }
    case "SET_DIRECTION":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload.id ? { ...slime, direction: action.payload.value } : slime,
        ),
      }
    case "SET_MODE":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload.id ? { ...slime, mode: action.payload.value } : slime,
        ),
      }
    case "SET_POSITION":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload.id ? { ...slime, position: action.payload.value } : slime,
        ),
      }
    case "INCREMENT_JUMP_FRAME":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload
            ? { ...slime, jumpFrame: (slime.jumpFrame + 1) % ANIMATION_CONFIG.totalJumpFrames }
            : slime,
        ),
      }
    case "INCREMENT_WALK_FRAME":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload
            ? { ...slime, walkFrame: (slime.walkFrame + 1) % ANIMATION_CONFIG.totalWalkFrames }
            : slime,
        ),
      }
    case "INCREMENT_IDLE_FRAME":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload
            ? { ...slime, idleFrame: (slime.idleFrame + 1) % ANIMATION_CONFIG.totalIdleFrames }
            : slime,
        ),
      }
    case "SET_BEHAVIOR":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload.id ? { ...slime, currentBehavior: action.payload.value } : slime,
        ),
      }
    case "SET_LAST_INTERACTION":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload.id ? { ...slime, lastInteraction: action.payload.value } : slime,
        ),
      }
    case "SHOW_BUBBLE":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload.id
            ? {
                ...slime,
                bubble: {
                  ...slime.bubble,
                  visible: true,
                  text: action.payload.text,
                  menuState: "none",
                },
              }
            : slime,
        ),
      }
    case "HIDE_BUBBLE":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload
            ? {
                ...slime,
                bubble: {
                  ...slime.bubble,
                  visible: false,
                  menuState: "none",
                },
              }
            : slime,
        ),
      }
    case "HIDE_ALL_BUBBLES":
      return {
        ...state,
        slimes: state.slimes.map((slime) => ({
          ...slime,
          bubble: {
            ...slime.bubble,
            visible: false,
            menuState: "none",
          },
        })),
      }
    case "SET_THINKING":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload.id ? { ...slime, isThinking: action.payload.value } : slime,
        ),
      }
    case "UPDATE_BUBBLE_TEXT":
      return {
        ...state,
        slimes: state.slimes.map((slime) =>
          slime.id === action.payload.id
            ? {
                ...slime,
                bubble: {
                  ...slime.bubble,
                  text: action.payload.text,
                },
              }
            : slime,
        ),
      }
    case "SET_MENU_STATE":
      // Hide all other bubbles first
      const updatedSlimes = state.slimes.map((slime) => {
        if (slime.id === action.payload.id) {
          return {
            ...slime,
            bubble: {
              ...slime.bubble,
              visible: true,
              menuState: action.payload.state,
              // Clear text when showing menu
              text: action.payload.state !== "none" ? "" : slime.bubble.text,
            },
          }
        } else {
          // Hide bubbles for other slimes
          return {
            ...slime,
            bubble: {
              ...slime.bubble,
              visible: false,
              menuState: "none",
            },
          }
        }
      })

      return {
        ...state,
        slimes: updatedSlimes,
      }
    default:
      return state
  }
}

export const useSlime = () => {
  const context = useContext(SlimeContext)
  if (!context) {
    throw new Error("useSlime must be used within a SlimeProvider")
  }
  return context
}
