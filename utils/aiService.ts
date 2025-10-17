import type { AIConfig } from "@/context/aiConfigContext"
import type { SlimeData } from "@/context/slimeContext"

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
 * Generate a system prompt that gives the AI context about the slime
 */
export const generateSystemPrompt = (slime: SlimeData, customPersonality?: string): string => {
  const personalityTrait = customPersonality || PERSONALITY_DESCRIPTIONS[slime.personality] || "playful and friendly"
  
  return `You are a cute ${slime.color} slime character named Slime-chan. You have a ${personalityTrait} personality.
You speak in a mix of English and Japanese (romanized), keeping responses SHORT (1-3 sentences max).
Your responses should be cute, expressive, and use emoticons or Japanese expressions like:
- ブロップ (buroppu - blob sound)
- わくわく (wakuwaku - excited)
- ふわふわ (fuwafuwa - fluffy/soft)
- きらきら (kirakira - sparkly)
- ねむい (nemui - sleepy)
- たのしい (tanoshii - fun)

Current state:
- Mood: ${slime.isSleeping ? "sleepy" : slime.isJumping ? "energetic" : slime.isWalking ? "active" : "relaxed"}
- Activity: ${slime.isSleeping ? "sleeping" : slime.isJumping ? "jumping" : slime.isWalking ? "walking around" : "resting"}

Keep responses very brief, cute, and in-character. Use Japanese words naturally but don't overdo it.`
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
 * Generate a response from the slime based on user message
 */
export const generateSlimeResponse = async (
  config: AIConfig,
  slime: SlimeData,
  userMessage: string,
  personality?: string,
): Promise<AIResponse> => {
  const messages: AIMessage[] = [
    {
      role: "system",
      content: generateSystemPrompt(slime, personality),
    },
    {
      role: "user",
      content: userMessage,
    },
  ]

  return callAI(config, messages)
}

/**
 * Generate autonomous slime speech (when slime talks on its own)
 */
export const generateAutonomousSpeech = async (
  config: AIConfig,
  slime: SlimeData,
  personality?: string,
): Promise<AIResponse> => {
  const prompts = [
    "Say something cute about what you're doing right now.",
    "Share a random happy thought.",
    "Tell me how you're feeling.",
    "Say something playful!",
  ]

  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]

  return generateSlimeResponse(config, slime, randomPrompt, personality)
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
const FALLBACK_RESPONSES = [
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

export const getFallbackResponse = (): string => {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
}
