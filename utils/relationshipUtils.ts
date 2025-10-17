/**
 * Relationship progression utilities
 * Handles meaningful relationship updates and feedback
 */

import type { RelationshipLevel } from "@/types/creatureTypes"

/**
 * Calculate relationship progression messages when leveling up
 */
export const getRelationshipLevelUpMessage = (
  oldLevel: RelationshipLevel,
  newLevel: RelationshipLevel,
  creatureName: string = "Creature"
): string | null => {
  // No level up
  if (oldLevel === newLevel) return null

  const levelMessages: Record<RelationshipLevel, string> = {
    stranger: "",
    acquaintance: `${creatureName} now sees you as an acquaintance! 👋`,
    friend: `${creatureName} now considers you a friend! 💙`,
    "close friend": `${creatureName} now sees you as a close friend! 💚`,
    "best friend": `${creatureName} now considers you their best friend! 💖✨`,
  }

  return levelMessages[newLevel] || null
}

/**
 * Get relationship level thresholds for UI display
 */
export const getRelationshipThresholds = () => ({
  stranger: { min: 0, max: 14, description: "Just met" },
  acquaintance: { min: 15, max: 34, description: "Getting to know each other" },
  friend: { min: 35, max: 54, description: "Good friends" },
  "close friend": { min: 55, max: 74, description: "Very close" },
  "best friend": { min: 75, max: 100, description: "Inseparable" },
})

/**
 * Calculate relationship score from affection and trust
 */
export const calculateRelationshipScore = (affection: number, trust: number): number => {
  return Math.round(affection * 0.7 + trust * 0.3)
}

/**
 * Get progress to next relationship level
 */
export const getProgressToNextLevel = (
  affection: number,
  trust: number
): { current: number; target: number; percentage: number; nextLevel: RelationshipLevel | null } => {
  const score = calculateRelationshipScore(affection, trust)
  const thresholds = getRelationshipThresholds()

  if (score >= 75) {
    return { current: score, target: 100, percentage: 100, nextLevel: null }
  } else if (score >= 55) {
    return { current: score, target: 75, percentage: ((score - 55) / 20) * 100, nextLevel: "best friend" }
  } else if (score >= 35) {
    return { current: score, target: 55, percentage: ((score - 35) / 20) * 100, nextLevel: "close friend" }
  } else if (score >= 15) {
    return { current: score, target: 35, percentage: ((score - 15) / 20) * 100, nextLevel: "friend" }
  } else {
    return { current: score, target: 15, percentage: (score / 15) * 100, nextLevel: "acquaintance" }
  }
}

/**
 * Get affection gain feedback message
 */
export const getAffectionGainMessage = (delta: number): string | null => {
  if (delta >= 6) return "💖 Major affection boost!"
  if (delta >= 4) return "💕 Big affection gain!"
  if (delta >= 3) return "❤️ Affection increased!"
  if (delta >= 2) return "💗 Affection up!"
  if (delta >= 1) return "💙 Small affection gain"
  return null
}

/**
 * Get trust gain feedback message
 */
export const getTrustGainMessage = (delta: number): string | null => {
  if (delta >= 5) return "🌟 Trust deeply strengthened!"
  if (delta >= 4) return "✨ Major trust boost!"
  if (delta >= 3) return "⭐ Trust increased!"
  if (delta >= 2) return "💫 Trust up!"
  if (delta >= 1) return "🌙 Small trust gain"
  return null
}

/**
 * Interaction quality ratings
 */
export type InteractionQuality = "exceptional" | "great" | "good" | "neutral" | "poor"

export const evaluateInteractionQuality = (
  affectionDelta: number,
  trustDelta: number
): InteractionQuality => {
  const totalGain = affectionDelta + trustDelta

  if (totalGain >= 10) return "exceptional"
  if (totalGain >= 6) return "great"
  if (totalGain >= 3) return "good"
  if (totalGain >= 1) return "neutral"
  return "poor"
}

/**
 * Get mood-based relationship modifiers
 * Happy creatures give more affection, sad creatures need more care
 */
export const getMoodModifier = (mood: string): { affectionMultiplier: number; trustMultiplier: number } => {
  switch (mood) {
    case "loving":
      return { affectionMultiplier: 1.2, trustMultiplier: 1.1 }
    case "happy":
      return { affectionMultiplier: 1.1, trustMultiplier: 1.0 }
    case "excited":
      return { affectionMultiplier: 1.1, trustMultiplier: 1.0 }
    case "playful":
      return { affectionMultiplier: 1.05, trustMultiplier: 1.0 }
    case "sad":
      return { affectionMultiplier: 0.8, trustMultiplier: 0.9 } // Harder to gain when sad
    case "angry":
      return { affectionMultiplier: 0.7, trustMultiplier: 0.8 } // Much harder when angry
    default:
      return { affectionMultiplier: 1.0, trustMultiplier: 1.0 }
  }
}

/**
 * Relationship advice based on current stats
 */
export const getRelationshipAdvice = (
  affection: number,
  trust: number,
  totalInteractions: number
): string => {
  const score = calculateRelationshipScore(affection, trust)

  if (score < 15 && totalInteractions < 5) {
    return "💬 Keep chatting to build your relationship!"
  }

  if (trust < affection - 20) {
    return "🤝 Try asking deeper, personal questions to build trust."
  }

  if (affection < trust - 20) {
    return "💕 Show more warmth and positivity to increase affection!"
  }

  if (score >= 75) {
    return "🌟 You've built an amazing friendship! Keep nurturing it!"
  }

  if (score >= 55) {
    return "💚 Your friendship is very strong! A little more and you'll be best friends!"
  }

  if (score >= 35) {
    return "💙 You're good friends! Keep having meaningful conversations."
  }

  return "👋 Keep interacting to strengthen your bond!"
}
