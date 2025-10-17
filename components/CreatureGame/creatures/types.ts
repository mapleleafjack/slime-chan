/**
 * Creature Definition Types
 * Shared across all creatures
 */

import type { CreatureType, CreatureCapabilities } from "@/types/creatureTypes"

export type AnimationState = "idle" | "walk" | "jump" | "sleep" | "glow"

export interface SpriteAnimation {
  path: string
  frameCount: number
  fps?: number
}

export interface SpriteDefinition {
  frameWidth: number
  frameHeight: number
  animations: Partial<Record<AnimationState, SpriteAnimation>>
}

export interface CreaturePhysics {
  speed: number
  groundLevel: number
  fps: number
  baseSpeed: number
  minSpeed: number
  maxSpeed: number
  jumpHeight?: number // Optional: only for creatures that can jump
  idleJumpProbability?: number // Optional: only for creatures that can jump
}

export interface CreatureUIOffsets {
  bubbleOffset: number
  indicatorOffset: number
}

export interface CreatureDefinition {
  type: CreatureType
  displayName: string
  sprites: Record<string, SpriteDefinition>
  physics: CreaturePhysics
  ui: CreatureUIOffsets
  capabilities: CreatureCapabilities
  defaultGreeting: string
  auraColor?: string
}
