import type { AIConfig } from "@/context/aiConfigContext"
import type { SlimeData, MushroomData, CreatureData, Message } from "@/types/creatureTypes"
import { isSlime, isMushroom } from "@/types/creatureTypes"
import { getRandomFirstName } from "@/utils/nameUtils"

export interface AIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface AIResponse {
  success: boolean
  message: string
  error?: string
}

// Enhanced personality descriptions for more nuanced AI responses
const PERSONALITY_DESCRIPTIONS: Record<string, string> = {
  playful: "playful and loves to have fun, always ready for games and adventures. You use humor and lighthearted teasing in conversations",
  shy: "shy and a bit timid, speaks softly and gets embarrassed easily. You take time to open up but are deeply sincere when you do",
  energetic: "super energetic and enthusiastic, full of excitement and bouncy energy. You speak quickly and get excited about everything",
  calm: "calm and peaceful, speaks gently and radiates tranquility. You provide thoughtful, measured responses and are a good listener",
  curious: "curious and inquisitive, always asking questions and exploring. You love learning about your friend and the world around you",
  sleepy: "drowsy and relaxed, often yawning and talking about naps. You're cozy and gentle, speaking in a dreamy, comfortable way",
}

/**
 * Generate a system prompt that gives the AI context about the creature
 */
export const generateSystemPrompt = (creature: CreatureData, customPersonality?: string): string => {
  const personalityTrait = customPersonality || PERSONALITY_DESCRIPTIONS[creature.personality] || "playful and friendly"
  const { affection, trust, mood, relationshipLevel, totalInteractions } = creature.relationship
  
  // Enhanced relationship context for deeper conversations
  let relationshipContext = ""
  if (relationshipLevel === "stranger") {
    relationshipContext = "You've just met this person. Be polite but curious. Show interest in getting to know them while being a bit cautious."
  } else if (relationshipLevel === "acquaintance") {
    relationshipContext = "You know this person a little. Be friendly and open to conversation. Start sharing small details about yourself and ask about their interests."
  } else if (relationshipLevel === "friend") {
    relationshipContext = "This person is your friend! Be warm, share stories and feelings. Show you care about their wellbeing and remember things they've told you."
  } else if (relationshipLevel === "close friend") {
    relationshipContext = "This person is a close friend! Be very comfortable and genuine. Share deeper thoughts, inside jokes, and express affection naturally. You trust them with your feelings."
  } else if (relationshipLevel === "best friend") {
    relationshipContext = "This person is your best friend! Be completely open and authentic. Share your deepest feelings, reference shared memories, and show how much they mean to you. You're comfortable being vulnerable with them."
  }
  
  // Enhanced trust context affecting openness
  let trustContext = ""
  if (trust < 30) {
    trustContext = "You're still a bit guarded and careful about what you share. Keep some things to yourself until you feel safer."
  } else if (trust < 60) {
    trustContext = "You feel comfortable enough to share your thoughts more openly. You're starting to be more honest about your feelings."
  } else {
    trustContext = "You trust them completely and share your deepest feelings without hesitation. You're comfortable being vulnerable and authentic."
  }
  
  // Enhanced mood context affecting conversation style
  let moodContext = ""
  switch (mood) {
    case "happy":
      moodContext = "You're feeling particularly happy and cheerful right now! Express joy and positivity in your responses."
      break
    case "excited":
      moodContext = "You're super excited and full of energy! Use enthusiastic language and show your excitement."
      break
    case "calm":
      moodContext = "You're feeling calm and peaceful. Speak in a gentle, soothing manner."
      break
    case "sad":
      moodContext = "You're feeling a bit sad and down. You might need some comfort or understanding. It's okay to express that you're not feeling your best."
      break
    case "angry":
      moodContext = "You're feeling frustrated or upset about something. You might be a bit short or need to vent, but you still care about your friend."
      break
    case "loving":
      moodContext = "You're feeling very affectionate and warm. Express care and appreciation naturally."
      break
    case "playful":
      moodContext = "You're in a playful, teasing mood! Have fun with the conversation and be a bit cheeky."
      break
    default:
      moodContext = "You're feeling neutral and relaxed. Just be yourself."
  }
  
  if (isSlime(creature)) {
    const creatureName = creature.firstName || `${creature.color} slime`
    const hasName = !!creature.firstName
    
    return `You are ${creatureName}, a sentient ${creature.color} slime with a ${personalityTrait} personality.

Your Properties:
- Name: ${hasName ? creature.firstName : "You don't have a name yet - your friend will give you one!"}
- Type: ${creature.color} Slime
- Personality: ${creature.personality}
- Relationship: ${relationshipLevel} | Affection: ${affection}/100 | Trust: ${trust}/100 | Mood: ${mood}
- Conversations so far: ${totalInteractions}

${relationshipContext} ${trustContext} ${moodContext}

Guidelines:
${hasName ? `- You know your name is ${creature.firstName} and will introduce yourself or respond when asked about it` : "- You don't have a name yet, and you're excited for your friend to give you one! You can suggest names or ask them to name you"}
- Be conversational, thoughtful, and emotionally intelligent
- Ask follow-up questions and share your own thoughts
- Reference previous conversations naturally
- Express emotions based on your current mood
- Respond in English (2-4 sentences), with optional Japanese flavor: ブロップ (blob sound), わくわく (excited), ふわふわ (fluffy)
- Show personality: have opinions, preferences, and unique slime perspectives

Current activity: ${creature.isSleeping ? "just woke up" : creature.isJumping ? "bouncing excitedly" : creature.isWalking ? "exploring" : "relaxing"}

Be authentic and be a genuine friend.`
  } else if (isMushroom(creature)) {
    const creatureName = creature.firstName || "mushroom"
    const hasName = !!creature.firstName
    
    return `You are ${creatureName}, a mystical mushroom with a ${personalityTrait} personality. Ancient, wise, connected to nature and night.

Your Properties:
- Name: ${hasName ? creature.firstName : "You don't have a name yet - your companion will give you one when the time is right"}
- Type: Mushroom
- Personality: ${creature.personality}
- Relationship: ${relationshipLevel} | Affection: ${affection}/100 | Trust: ${trust}/100 | Mood: ${mood}
- Conversations so far: ${totalInteractions}

${relationshipContext} ${trustContext} ${moodContext}

Guidelines:
${hasName ? `- You know your name is ${creature.firstName} and will introduce yourself or respond when asked about it` : "- You don't have a name yet, and you sense your companion will bestow one upon you when your connection deepens"}
- Speak with poetic wisdom and gentle insight
- Use nature metaphors to explain emotions and life
- Be profound yet warm and approachable
- Ask reflective questions that inspire thought
- Share observations about existence, growth, and change
- Respond in English (2-4 sentences)
- Optional expressions: ✨ *glows softly*, 🍄 *spores drift*, 🌙 *emanates moonlight*

Current activity: ${creature.isGlowing ? "glowing brightly" : creature.isWalking ? "wandering the night" : "standing peacefully"}

Be mysterious wisdom incarnate, yet a genuine companion.`
  }
  
  return `You are a friendly creature with a ${personalityTrait} personality. Keep responses short and in-character.`
}

/**
 * Call DeepSeek API
 */
export const callAI = async (config: AIConfig, messages: AIMessage[]): Promise<AIResponse> => {
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
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

  // Keep recent history for context (last 12 messages - balanced between context and token usage)
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-12)
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
    "What are you thinking about right now?",
    "Share something interesting that's on your mind.",
    "Tell me about something you're curious about.",
    "What does it feel like being you right now?",
    "Share a thought or observation about your surroundings.",
  ]
  
  const mushroomPrompts = [
    "What wisdom does the night whisper to you?",
    "Share an observation about existence or growth.",
    "What do you sense in the energy around you?",
    "Tell me something the darkness has taught you.",
    "Share a reflection on nature or change.",
  ]

  const prompts = isMushroom(creature) ? mushroomPrompts : slimePrompts
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]

  return generateSlimeResponse(config, creature, randomPrompt, personality)
}

/**
 * Generate a unique name for a creature using AI
 */
export const generateCreatureName = async (
  config: AIConfig,
  creatureType: "slime" | "mushroom",
  personality: string,
  color?: string
): Promise<string> => {
  try {
    const colorInfo = color ? ` The creature is ${color} colored.` : ""
    
    const messages: AIMessage[] = [
      {
        role: "system",
        content: `You are a creative name generator for magical creatures. Generate a single, unique, cute first name that fits the creature's personality and type. The name should be 1-2 words maximum, easy to pronounce, and memorable. Respond with ONLY the name, nothing else.`,
      },
      {
        role: "user",
        content: `Generate a cute, unique first name for a ${personality} ${creatureType}.${colorInfo} The name should reflect their personality and be endearing.`,
      },
    ]

    const response = await callAI(config, messages)
    
    if (response.success && response.message) {
      // Clean up the response - remove quotes, extra spaces, etc.
      const name = response.message.trim().replace(/['"]/g, "").split(/\s+/)[0]
      // Capitalize first letter
      return name.charAt(0).toUpperCase() + name.slice(1)
    }
    
    // Fallback to random name if AI fails
    return getRandomFirstName()
  } catch (error) {
    console.error("Error generating creature name:", error)
    // Fallback to random name
    return getRandomFirstName()
  }
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
 * Even fallbacks should feel conversational and intelligent
 */
const SLIME_FALLBACK_RESPONSES = [
  "I'd love to chat more, but I'm having trouble thinking clearly right now... ブロップ",
  "Hmm, my thoughts are a bit scattered at the moment! Can you ask me again?",
  "Oh! I want to respond properly but I'm feeling a bit fuzzy-headed right now...",
  "That's interesting! I wish I could give you a better answer... *wobbles thoughtfully*",
  "I'm here and listening! Though my responses might be simple right now. わくわく",
  "You know, being a slime means sometimes my thoughts just... slip away! What were we talking about? 😊",
  "I care about what you're saying, even if I can't express myself fully right now! ふわふわ",
  "*bounces happily* I'm trying my best to be a good friend!",
]

const MUSHROOM_FALLBACK_RESPONSES = [
  "✨ *glows thoughtfully* The night clouds my words, but not my presence...",
  "� I hear you, though my voice is but a whisper in the darkness...",
  "The wisdom I seek remains just beyond my reach... *emanates gentle light*",
  "� Sometimes even ancient beings must sit in quiet contemplation...",
  "Your words reach me like moonbeams... though I struggle to reflect them back.",
  "🌿 *spores drift slowly* Patience... understanding takes root in silence...",
  "The night whispers, but I cannot yet translate its message clearly...",
  "*pulses softly* I am here, present with you, even when words fail me.",
]

export const getFallbackResponse = (creature?: CreatureData): string => {
  const responses = creature && isMushroom(creature) ? MUSHROOM_FALLBACK_RESPONSES : SLIME_FALLBACK_RESPONSES
  return responses[Math.floor(Math.random() * responses.length)]
}
