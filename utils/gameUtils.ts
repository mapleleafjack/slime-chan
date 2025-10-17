import { ANIMATION_CONFIG } from "@/components/CreatureGame/animationConfig"

export enum DayPhase {
  NIGHT = "NIGHT",
  MORNING = "MORNING",
  DAY = "DAY",
  DUSK = "DUSK",
}

// Update the calculateOverlay function to correctly handle time phases
export const calculateOverlay = (date: Date): { phase: DayPhase; opacity: number } => {
  const hour = date.getHours()
  const minutes = date.getMinutes()
  const totalMinutes = hour * 60 + minutes

  // Morning: 5:00 AM to 9:59 AM
  if (totalMinutes >= 5 * 60 && totalMinutes < 10 * 60) {
    // Gradually decrease opacity as morning progresses
    const morningProgress = (totalMinutes - 5 * 60) / (5 * 60) // 0 at 5 AM, 1 at 10 AM
    const opacity = 0.3 * (1 - morningProgress)
    return { phase: DayPhase.MORNING, opacity }
  }
  // Day: 10:00 AM to 4:59 PM
  else if (totalMinutes >= 10 * 60 && totalMinutes < 17 * 60) {
    return { phase: DayPhase.DAY, opacity: 0 }
  }
  // Dusk: 5:00 PM to 7:59 PM
  else if (totalMinutes >= 17 * 60 && totalMinutes < 20 * 60) {
    // Gradually increase opacity as dusk progresses
    const duskProgress = (totalMinutes - 17 * 60) / (3 * 60) // 0 at 5 PM, 1 at 8 PM
    const opacity = 0.2 + 0.3 * duskProgress
    return { phase: DayPhase.DUSK, opacity }
  }
  // Night: 8:00 PM to 4:59 AM
  else {
    // Darker at midnight, slightly lighter toward dawn
    let nightProgress = 0
    if (totalMinutes >= 20 * 60) {
      // 8 PM to midnight
      nightProgress = (totalMinutes - 20 * 60) / (4 * 60) // 0 at 8 PM, 1 at midnight
    } else {
      // Midnight to 5 AM
      nightProgress = 1 - totalMinutes / (5 * 60) // 1 at midnight, 0 at 5 AM
    }
    const opacity = 0.5 + 0.2 * nightProgress
    return { phase: DayPhase.NIGHT, opacity }
  }
}

// Add a weight for diagonal jumping in behavior selection
export const getBehaviorDuration = (behavior: string) => {
  switch (behavior) {
    case "walkLeft":
    case "walkRight":
      // Shorter walking duration for more frequent behavior changes
      return Math.random() * 4000 + 3000
    case "jump":
      return 1500
    case "sleep":
      return Math.random() * 4000 + 3000
    case "talk":
      return Math.random() * 2000 + 2000
    case "idle":
      // Much shorter idle time
      return Math.random() * 2000 + 1000
    default:
      return Math.random() * 3000 + 2000
  }
}

export const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const talkPhrases = ["こんにちは！", "ブロップ！", "眠い...", "もぐもぐ？", "わーい！", "楽しいね！", "ふわふわ～"]

export const getRandomPhrase = () => {
  return talkPhrases[randomInt(0, talkPhrases.length - 1)]
}

// Japanese phrases for slime responses
const japaneseResponses = [
  "こんにちは！",
  "元気？",
  "かわいい！",
  "おはよう！",
  "おやすみ～",
  "たのしい！",
  "すごい！",
  "うれしい！",
  "おいしい！",
  "がんばって！",
  "ありがとう！",
  "だいすき！",
  "ぷにぷに～",
  "もちもち！",
  "ぴょんぴょん！",
  "きらきら✨",
  "にこにこ",
  "わくわく！",
  "ふわふわ～",
  "ぽよぽよ",
]

export const getRandomJapanesePhrase = () => {
  return japaneseResponses[randomInt(0, japaneseResponses.length - 1)]
}

export const constrainToGameBounds = (position: number) => {
  return Math.max(0, Math.min(position, 480 - ANIMATION_CONFIG.frameWidth))
}
