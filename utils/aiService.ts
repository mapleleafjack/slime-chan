import type { AIConfig } from "@/context/aiConfigContext"
import type { SlimeData, MushroomData, CreatureData, Message } from "@/types/creatureTypes"
import { isSlime, isMushroom } from "@/types/creatureTypes"

export interface AIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface AIResponse {
  success: boolean
  message: string
  error?: string
}

// Personality descriptions for the AI
const PERSONALITY_DESCRIPTIONS: Record<string, string> = {
  playful: "playful and loves to have fun, always ready for games and adventures",
  shy: "shy and a bit timid, speaks softly and gets embarrassed easily",
  energetic: "super energetic and enthusiastic, full of excitement and bouncy energy",
  calm: "calm and peaceful, speaks gently and radiates tranquility",
  curious: "curious and inquisitive, always asking questions and exploring",
  sleepy: "drowsy and relaxed, often yawning and talking about naps",
}

/**
 * Generate a system prompt that gives the AI context about the creature
 */
export const generateSystemPrompt = (creature: CreatureData, customPersonality?: string): string => {
  const personalityTrait = customPersonality || PERSONALITY_DESCRIPTIONS[creature.personality] || "playful and friendly"
  
  if (isSlime(creature)) {
    return `You are a cute ${creature.color} slime character named Slime-chan. You have a ${personalityTrait} personality.

IMPORTANT: Always respond in English. You may occasionally use Japanese expressions for cuteness, but the main response must be in English.

Keep responses SHORT (1-2 sentences max). Be cute, expressive, and in-character.
You can use Japanese expressions sparingly for flavor, like:
- ブロップ (buroppu - blob sound)
- わくわく (wakuwaku - excited)
- ふわふわ (fuwafuwa - fluffy)

Current state:
- Mood: ${creature.isSleeping ? "sleepy" : creature.isJumping ? "energetic" : creature.isWalking ? "active" : "relaxed"}
- Activity: ${creature.isSleeping ? "sleeping" : creature.isJumping ? "jumping" : creature.isWalking ? "walking around" : "resting"}

Remember previous messages in the conversation and reference them naturally. Keep your personality consistent throughout the conversation.`
  } else if (isMushroom(creature)) {
    return `You are a mystical glowing mushroom creature. You have a ${personalityTrait} personality.

IMPORTANT: Always respond in English. You communicate through gentle, nature-inspired expressions.

Keep responses SHORT (1-2 sentences max). Be mysterious, peaceful, and nature-connected.
You can use nature-themed expressions like:
- ✨ *glows softly*
- 🍄 *spores drift gently*
- 🌙 *emanates moonlight*

Current state:
- Mood: ${creature.isGlowing ? "radiant" : creature.isWalking ? "wandering" : "resting"}
- Activity: ${creature.isGlowing ? "glowing brightly" : creature.isWalking ? "wandering through the night" : "standing peacefully"}

You only appear at night and have a deep connection to the darkness and nature. Keep your personality consistent throughout the conversation.`
  }
  
  return `You are a friendly creature with a ${personalityTrait} personality. Keep responses short and in-character.`
}

/**
 * Call OpenAI-compatible API (works with OpenAI, DeepSeek, and other compatible APIs)
 */
export const callAI = async (config: AIConfig, messages: AIMessage[]): Promise<AIResponse> => {
  if (!config.apiKey || !config.baseUrl) {
    return {
      success: false,
      message: "",
      error: "API not configured. Please add your API key in settings.",
    }
  }

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const message = data.choices?.[0]?.message?.content?.trim()

    if (!message) {
      throw new Error("No response from AI")
    }

    return {
      success: true,
      message,
    }
  } catch (error) {
    console.error("AI API Error:", error)
    return {
      success: false,
      message: "",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Convert conversation history to AI messages format
 */
const convertHistoryToMessages = (history: Message[]): AIMessage[] => {
  return history.map((msg) => ({
    role: msg.role === "user" ? "user" : "assistant",
    content: msg.content,
  })) as AIMessage[]
}

/**
 * Generate a response from any creature based on user message
 */
export const generateSlimeResponse = async (
  config: AIConfig,
  creature: CreatureData,
  userMessage: string,
  personality?: string,
  conversationHistory?: Message[],
): Promise<AIResponse> => {
  const messages: AIMessage[] = [
    {
      role: "system",
      content: generateSystemPrompt(creature, personality),
    },
  ]

  // Add conversation history if available (but limit to last 10 messages to avoid token limits)
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-10)
    messages.push(...convertHistoryToMessages(recentHistory))
  }

  // Add the current user message
  messages.push({
    role: "user",
    content: userMessage,
  })

  return callAI(config, messages)
}

/**
 * Generate autonomous creature speech (when creature talks on its own)
 */
export const generateAutonomousSpeech = async (
  config: AIConfig,
  creature: CreatureData,
  personality?: string,
): Promise<AIResponse> => {
  const slimePrompts = [
    "Say something cute about what you're doing right now.",
    "Share a random happy thought.",
    "Tell me how you're feeling.",
    "Say something playful!",
  ]
  
  const mushroomPrompts = [
    "Share a mystical observation about the night.",
    "Whisper something about nature.",
    "Tell me what you sense in the darkness.",
    "Share a peaceful thought.",
  ]

  const prompts = isMushroom(creature) ? mushroomPrompts : slimePrompts
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]

  return generateSlimeResponse(config, creature, randomPrompt, personality)
}

/**
 * Test the API connection
 */
export const testAIConnection = async (config: AIConfig): Promise<AIResponse> => {
  const messages: AIMessage[] = [
    {
      role: "system",
      content: "You are a helpful assistant. Respond with exactly: 'Connection successful!'",
    },
    {
      role: "user",
      content: "Test",
    },
  ]

  return callAI(config, messages)
}

/**
 * Fallback responses when AI is not available
 */
const SLIME_FALLBACK_RESPONSES = [
  "ブロップ！",
  "こんにちは～ (konnichiwa)",
  "わくわく！ (excited!)",
  "ふわふわ～ (so fluffy)",
  "元気？ (genki? - how are you?)",
  "楽しい！ (tanoshii - fun!)",
  "ねむい... (nemui - sleepy)",
  "遊ぼう！ (let's play!)",
  "きらきら✨ (sparkly!)",
  "たのしいね！ (fun, right?)",
]

const MUSHROOM_FALLBACK_RESPONSES = [
  "✨ *glows softly*",
  "🍄 *spores drift in the moonlight*",
  "🌙 The night whispers secrets...",
  "*emanates a peaceful aura*",
  "🌿 Nature speaks through silence...",
  "*pulses with gentle light*",
  "The darkness is comforting...",
  "🌟 *twinkles mysteriously*",
  "*sways gently in the night breeze*",
  "Peace dwells in shadow...",
]

export const getFallbackResponse = (creature?: CreatureData): string => {
  const responses = creature && isMushroom(creature) ? MUSHROOM_FALLBACK_RESPONSES : SLIME_FALLBACK_RESPONSES
  return responses[Math.floor(Math.random() * responses.length)]
}
