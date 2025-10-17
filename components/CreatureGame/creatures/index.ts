/**
 * CREATURE REGISTRY
 * Central exports for all creatures and their definitions
 */

import { SLIME_DEFINITION } from "./Slime"
import { MUSHROOM_DEFINITION } from "./Mushroom"
import type { CreatureType } from "@/types/creatureTypes"
import type { CreatureDefinition } from "./types"

export { default as Slime } from "./Slime"
export { default as Mushroom } from "./Mushroom"

/**
 * Registry mapping creature types to their complete definitions
 */
export const CREATURE_REGISTRY: Record<CreatureType, CreatureDefinition> = {
  slime: SLIME_DEFINITION,
  mushroom: MUSHROOM_DEFINITION,
}

/**
 * Helper: Get creature definition by type
 */
export function getCreatureDefinition(type: CreatureType): CreatureDefinition {
  return CREATURE_REGISTRY[type]
}

/**
 * Helper: Get all available creature types
 */
export function getAllCreatureTypes(): CreatureType[] {
  return Object.keys(CREATURE_REGISTRY) as CreatureType[]
}
