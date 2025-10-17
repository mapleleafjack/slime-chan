/**
 * Base types for the generic creature system
 * This allows Slimes, Mushrooms, and future creatures to share common behavior
 */

export type Direction = 1 | -1
export type Behavior = "walkLeft" | "walkRight" | "jump" | "sleep" | "talk" | "idle" | "glow"
export type Mode = "user" | "auto"
export type MenuState = "main" | "color" | "chat" | "none"

// Creature type discriminator
export type CreatureType = "slime" | "mushroom"

// Color types
export type SlimeColor = "blue" | "red" | "green"
export type MushroomColor = "default" // Can be extended for mushroom variants

// Personality traits (shared by all creatures)
export type Personality = "playful" | "shy" | "energetic" | "calm" | "curious" | "sleepy"

// Message type for conversation history
export type Message = {
  id: string
  role: "user" | "creature"
  content: string
  timestamp: number
}

/**
 * Visual Novel-style relationship properties
 * These affect how the creature responds and interacts
 */
export type RelationshipLevel = "stranger" | "acquaintance" | "friend" | "close friend" | "best friend"

export type MoodType = "happy" | "excited" | "calm" | "sad" | "angry" | "neutral" | "loving" | "playful"

export type RelationshipProperties = {
  affection: number // 0-100: How much the creature likes you
  trust: number // 0-100: How much the creature trusts you
  mood: MoodType // Current emotional state
  relationshipLevel: RelationshipLevel // Overall relationship status
  totalInteractions: number // Total number of conversations
  lastMoodChange: number // Timestamp of last mood change
}

/**
 * Defines what capabilities a creature has
 * This allows creatures to have different abilities
 */
export type CreatureCapabilities = {
  canJump: boolean
  canGlow: boolean
  canSleep: boolean
  canTalk: boolean
  canChangeColor: boolean
}

/**
 * Base creature data - common properties for all creatures
 */
export type BaseCreatureData = {
  id: string
  firstName?: string // Optional: Set by talking to the creature
  creatureType: CreatureType
  capabilities: CreatureCapabilities
  personality: Personality
  relationship: RelationshipProperties // Visual novel properties
  isWalking: boolean
  direction: Direction
  mode: Mode
  position: number
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
  conversationHistory: Message[]
}

/**
 * Slime-specific data
 */
export type SlimeData = BaseCreatureData & {
  creatureType: "slime"
  color: SlimeColor
  isJumping: boolean
  isSleeping: boolean
  jumpFrame: number
  capabilities: CreatureCapabilities & {
    canJump: true
    canSleep: true
    canTalk: true
    canChangeColor: true
    canGlow: false
  }
}

/**
 * Mushroom-specific data
 */
export type MushroomData = BaseCreatureData & {
  creatureType: "mushroom"
  color: MushroomColor
  isGlowing: boolean
  glowIntensity: number
  capabilities: CreatureCapabilities & {
    canJump: false
    canGlow: true
    canSleep: false
    canTalk: true // Mushrooms can communicate in their own way!
    canChangeColor: false
  }
}

/**
 * Union type for all creatures
 */
export type CreatureData = SlimeData | MushroomData

/**
 * Type guards for checking creature types
 */
export function isSlime(creature: CreatureData): creature is SlimeData {
  return creature.creatureType === "slime"
}

export function isMushroom(creature: CreatureData): creature is MushroomData {
  return creature.creatureType === "mushroom"
}
