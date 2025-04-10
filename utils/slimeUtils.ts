import { ANIMATION_CONFIG } from "@/components/SlimeGame/animationConfig"

export enum DayPhase {
  NIGHT = "NIGHT",
  MORNING = "MORNING",
  DAY = "DAY",
  DUSK = "DUSK",
}

export const calculateOverlay = (date: Date): { phase: DayPhase; opacity: number } => {
  const hour = date.getHours()
  if (hour >= 5 && hour < 10) {
    return { phase: DayPhase.MORNING, opacity: 0.2 }
  } else if (hour >= 10 && hour < 17) {
    return { phase: DayPhase.DAY, opacity: 0 }
  } else if (hour >= 17 && hour < 20) {
    return { phase: DayPhase.DUSK, opacity: 0.3 }
  } else {
    return { phase: DayPhase.NIGHT, opacity: 0.6 }
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
