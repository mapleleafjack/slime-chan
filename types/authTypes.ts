/**
 * Authentication and user types for the Slime-chan game
 */

import type { CreatureData } from "./creatureTypes"
import type { DayPhase } from "@/utils/gameUtils"

// User profile
export type User = {
  id: string
  username: string
  createdAt: number
  lastLogin: number
}

// Session data stored in Vercel KV
export type Session = {
  userId: string
  username: string
  createdAt: number
  expiresAt: number
}

// Game state to persist
export type GameState = {
  userId: string
  creatures: CreatureData[]
  activeCreatureId: string | null
  debugTime: Date | null
  lastSaved: number
  version: string // For future migration compatibility
}

// API request/response types
export type LoginRequest = {
  username: string
  password: string
}

export type RegisterRequest = {
  username: string
  password: string
}

export type AuthResponse = {
  success: boolean
  message?: string
  user?: User
}

export type GameStateResponse = {
  success: boolean
  message?: string
  gameState?: GameState
}
