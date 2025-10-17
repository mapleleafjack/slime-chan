import { ANIMATION_CONFIG } from "./animationConfig"
import type { CreatureConfig } from "./creatures/BaseCreature"

/**
 * Centralized configuration for all creature types
 * Makes it easy to adjust positioning, animations, and other creature-specific settings
 */

export const SLIME_CREATURE_CONFIG: CreatureConfig = {
  // Sprite dimensions
  frameWidth: ANIMATION_CONFIG.frameWidth, // 128
  frameHeight: ANIMATION_CONFIG.frameHeight, // 128
  
  // Animation
  totalWalkFrames: ANIMATION_CONFIG.totalWalkFrames, // 8
  totalIdleFrames: ANIMATION_CONFIG.totalIdleFrames, // 8
  fps: ANIMATION_CONFIG.fps, // 24
  speed: ANIMATION_CONFIG.baseSpeed, // 2
  
  // Position
  groundLevel: ANIMATION_CONFIG.groundLevel, // 500
  
  // UI Element Positioning (relative to sprite top)
  bubbleOffset: 60, // Bubble appears 10px above sprite top
  indicatorOffset: 0, // Indicator appears near bottom of slime (at feet/base)
}

export const MUSHROOM_CREATURE_CONFIG: CreatureConfig = {
  // Sprite dimensions
  frameWidth: 48,
  frameHeight: 48,
  
  // Animation
  totalWalkFrames: 4,
  totalIdleFrames: 9,
  fps: 12,
  speed: 0.5,
  
  // Position
  groundLevel: ANIMATION_CONFIG.groundLevel - 10, // 490
  
  // UI Element Positioning (relative to sprite top)
  bubbleOffset: 80, // Bubble appears 60px above sprite top
  indicatorOffset: 30, // Indicator appears near bottom of mushroom
}

/**
 * Helper to get creature config by type
 */
export const getCreatureConfig = (type: "slime" | "mushroom"): CreatureConfig => {
  switch (type) {
    case "slime":
      return SLIME_CREATURE_CONFIG
    case "mushroom":
      return MUSHROOM_CREATURE_CONFIG
    default:
      return SLIME_CREATURE_CONFIG
  }
}
