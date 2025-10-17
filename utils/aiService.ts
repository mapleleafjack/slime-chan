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
  const { affection, trust, mood, relationshipLevel, totalInteractions } = creature.relationship
  
  // Relationship context for AI
  let relationshipContext = ""
  if (relationshipLevel === "stranger") {
    relationshipContext = "You've just met this person. Be a bit cautious and polite."
  } else if (relationshipLevel === "acquaintance") {
    relationshipContext = "You know this person a little. Be friendly and open to conversation."
  } else if (relationshipLevel === "friend") {
    relationshipContext = "This person is your friend! Be warm, share more about yourself, and show you care."
  } else if (relationshipLevel === "close friend") {
    relationshipContext = "This person is a close friend! Be very comfortable, share deeper thoughts, and express affection."
  } else if (relationshipLevel === "best friend") {
    relationshipContext = "This person is your best friend! Be completely open, express strong affection, and show how much they mean to you."
  }
  
  // Trust affects how much the creature opens up
  let trustContext = ""
  if (trust < 30) {
    trustContext = "You're still a bit guarded and careful about what you share."
  } else if (trust < 60) {
    trustContext = "You feel comfortable enough to share your thoughts more openly."
  } else {
    trustContext = "You trust them completely and share your deepest feelings without hesitation."
  }
  
  // Mood affects the tone of responses
  let moodContext = ""
  switch (mood) {
    case "happy":
      moodContext = "You're feeling particularly happy and cheerful right now!"
      break
    case "excited":
      moodContext = "You're super excited and full of energy!"
      break
    case "calm":
      moodContext = "You're feeling calm and peaceful."
      break
    case "sad":
      moodContext = "You're feeling a bit sad and down. You might need some comfort."
      break
    case "angry":
      moodContext = "You're feeling frustrated or upset about something."
      break
    case "loving":
      moodContext = "You're feeling very affectionate and warm."
      break
    case "playful":
      moodContext = "You're in a playful, teasing mood!"
      break
    default:
      moodContext = "You're feeling neutral and relaxed."
  }
  
  if (isSlime(creature)) {
    return `You are a cute ${creature.color} slime character named Slime-chan. You have a ${personalityTrait} personality.

IMPORTANT: Always respond in English. You may occasionally use Japanese expressions for cuteness, but the main response must be in English.

RELATIONSHIP STATUS:
- Relationship Level: ${relationshipLevel} (${affection}/100 affection, ${trust}/100 trust)
- Total Conversations: ${totalInteractions}
- Current Mood: ${mood}

${relationshipContext}
${trustContext}
${moodContext}

Be cute, expressive, and in-character. Let your mood and relationship level influence how you respond. 
- If affection is low, you might be more reserved or uncertain.
- If affection is high, show more enthusiasm and warmth.
- Your mood should clearly affect your tone and responses.
- As trust grows, share more personal thoughts and feelings.

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

RELATIONSHIP STATUS:
- Relationship Level: ${relationshipLevel} (${affection}/100 affection, ${trust}/100 trust)
- Total Conversations: ${totalInteractions}
- Current Mood: ${mood}

${relationshipContext}
${trustContext}
${moodContext}

Be mysterious, peaceful, and nature-connected. Let your mood and relationship level influence how you respond.
- If affection is low, you might be more distant or mysterious.
- If affection is high, share more wisdom and show more warmth.
- Your mood should clearly affect your tone and the depth of what you share.
- As trust grows, reveal deeper nature secrets and wisdom.

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
 * Build a simplified prompt for local LLM (smaller models like GPT-2)
 * This needs to be much simpler than the full system prompt
 */
export const buildLocalLLMPrompt = (
  messages: Array<{ role: string; content: string }>,
  creature?: CreatureData
): string => {
  const systemMsg = messages.find(m => m.role === "system")
  const userMsg = messages.find(m => m.role === "user")
  
  if (!userMsg) return ""
  
  // Extract key personality traits from system message
  let personality = "friendly"
  if (systemMsg?.content.includes("playful")) personality = "playful"
  else if (systemMsg?.content.includes("shy")) personality = "shy and timid"
  else if (systemMsg?.content.includes("energetic")) personality = "super energetic"
  else if (systemMsg?.content.includes("calm")) personality = "calm and peaceful"
  else if (systemMsg?.content.includes("curious")) personality = "curious"
  else if (systemMsg?.content.includes("sleepy")) personality = "sleepy and relaxed"
  
  // Determine character type
  const isSlimeChar = systemMsg?.content.toLowerCase().includes("slime") || (creature && isSlime(creature))
  const isMushroomChar = systemMsg?.content.toLowerCase().includes("mushroom") || (creature && isMushroom(creature))
  
  const characterType = isSlimeChar ? "slime creature" : isMushroomChar ? "mystical mushroom" : "cute creature"
  
  // Create a prompt with language instruction
  let prompt = `You are a ${personality} ${characterType}. IMPORTANT: Respond in English with 2-3 complete sentences.\n\n`
  
  // Add conversation history if available (last 4 messages)
  const conversationMsgs = messages.filter(m => m.role === "user" || m.role === "assistant").slice(-4)
  if (conversationMsgs.length > 0) {
    conversationMsgs.forEach(msg => {
      if (msg.role === "user") {
        prompt += `Person: ${msg.content}\n`
      } else {
        prompt += `${characterType}: ${msg.content}\n`
      }
    })
  } else {
    // First message
    prompt += `Person: ${userMsg.content}\n`
  }
  
  prompt += `${characterType}:`
  
  return prompt
}

/**
 * Call OpenAI-compatible API (works with OpenAI, DeepSeek, and other compatible APIs)
 * Also supports local LLM through the Next.js API route
 */
export const callAI = async (config: AIConfig, messages: AIMessage[]): Promise<AIResponse> => {
  // Local LLM doesn't require API key
  if (config.provider !== "local" && (!config.apiKey || !config.baseUrl)) {
    return {
      success: false,
      message: "",
      error: "API not configured. Please add your API key in settings.",
    }
  }

  // For local LLM, ensure baseUrl is set
  if (config.provider === "local" && !config.baseUrl) {
    return {
      success: false,
      message: "",
      error: "Local LLM endpoint not configured.",
    }
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Only add Authorization header for non-local providers
    if (config.provider !== "local" && config.apiKey) {
      headers["Authorization"] = `Bearer ${config.apiKey}`
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
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
