import { NextRequest, NextResponse } from "next/server"
import { pipeline, env } from "@xenova/transformers"
import { buildLocalLLMPrompt } from "@/utils/aiService"

// Disable local model loading for serverless environments
env.allowLocalModels = false

// Cache the pipeline to avoid reloading on every request
let textGenerator: any = null

/**
 * Initialize the text generation pipeline with a tiny model
 * Using GPT-2 - better quality than DistilGPT2 (~500MB)
 * NOTE: GPT-2 is NOT instruction-tuned and may not follow prompts reliably
 * For better quality, consider using an actual API (OpenAI, DeepSeek, etc.)
 */
async function getTextGenerator() {
  if (!textGenerator) {
    console.log("Loading local LLM model (GPT-2 ~500MB)...")
    // Using GPT-2: much better quality than distilgpt2
    // Alternative options:
    // - "Xenova/gpt2-medium" (larger, ~1.5GB, better quality but still not instruction-tuned)
    // - "Xenova/distilgpt2" (smallest, ~350MB, but less coherent)
    // 
    // LIMITATION: GPT-2 is NOT trained to follow instructions like modern chat models
    // It will often ignore the "respond in English" instruction
    textGenerator = await pipeline("text-generation", "Xenova/gpt2")
    console.log("Local LLM model loaded!")
  }
  return textGenerator
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, temperature = 0.8, max_tokens = 150 } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request: messages required" }, { status: 400 })
    }

    // Convert OpenAI-style messages to a single prompt using centralized builder
    const prompt = buildLocalLLMPrompt(messages)
    const userMessage = messages.find(m => m.role === "user")?.content || ""

    // Get the generator
    const generator = await getTextGenerator()

    // Generate response with better parameters for longer outputs
    const result = await generator(prompt, {
      max_new_tokens: Math.min(max_tokens, 200), // Increased to 200 for longer responses
      temperature: 0.9, // Higher temperature for more variety
      do_sample: true,
      top_k: 50,
      top_p: 0.95,
      repetition_penalty: 1.3, // Higher penalty to avoid repetition
      no_repeat_ngram_size: 3, // Prevent 3-gram repetition
    })

    // Extract the generated text
    let generatedText = result[0]?.generated_text || ""

    // Clean up the response (remove the prompt echo)
    if (generatedText.startsWith(prompt)) {
      generatedText = generatedText.slice(prompt.length).trim()
    }
    
    // Further clean and validate the response
    generatedText = cleanResponse(generatedText, userMessage)

    // Format response in OpenAI-compatible format
    return NextResponse.json({
      choices: [
        {
          message: {
            role: "assistant",
            content: generatedText,
          },
          finish_reason: "stop",
          index: 0,
        },
      ],
      model: "local-llm",
      usage: {
        prompt_tokens: prompt.length,
        completion_tokens: generatedText.length,
        total_tokens: prompt.length + generatedText.length,
      },
    })
  } catch (error) {
    console.error("Local LLM error:", error)
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "An error occurred during text generation",
          type: "local_llm_error",
        },
      },
      { status: 500 }
    )
  }
}

/**
 * Clean and improve the generated response
 */
function cleanResponse(text: string, userMessage: string): string {
  // Remove common artifacts
  let cleaned = text
    .replace(/^["'\s]+|["'\s]+$/g, "") // Remove surrounding quotes and whitespace
    .replace(/Person:.*/g, "") // Remove any prompt leakage
    .replace(/Character:.*/g, "")
    .replace(/^(slime creature|mystical mushroom|cute creature):\s*/i, "")
    .trim()
  
  // Split by newlines and take the first 2-3 meaningful sentences
  const lines = cleaned.split('\n').filter(line => line.trim().length > 0)
  if (lines.length > 0) {
    // Take up to 3 lines or until we hit a natural break
    cleaned = lines.slice(0, 3).join(' ').trim()
  }
  
  // Check for inappropriate content or nonsense patterns
  const badPatterns = [
    /@\w+\.\w+/i, // Email addresses
    /\*{2,}/g, // Multiple asterisks (censoring)
    /\[.*?SPOILER.*?\]/i, // Spoiler tags
    /\b(stupid|shit|awful|deserves)\b/i, // Inappropriate language
    /<><>/g, // Random symbols
    /AHAHA{3,}/i, // Excessive laughing
    /!{3,}/g, // Excessive exclamation
  ]
  
  const hasInappropriateContent = badPatterns.some(pattern => pattern.test(cleaned))
  
  // Check if response is mostly non-English/gibberish
  // Count English words vs total length
  const englishWords = cleaned.match(/\b[a-zA-Z]{2,}\b/g) || []
  const hasEnoughEnglish = englishWords.length >= 3 && cleaned.length > 0 && 
    (englishWords.join('').length / cleaned.length) > 0.5
  
  // Check for coherence - should have proper sentence structure
  const hasSentenceStructure = /[A-Z].*[.!?]/.test(cleaned) || cleaned.includes('*')
  
  // If response is broken, invalid, inappropriate, or not English enough, use fallback
  if (
    cleaned.length < 10 || // Require at least 10 characters for a real response
    cleaned.length > 500 || // But not too long
    !hasEnoughEnglish || // Not enough English content
    hasInappropriateContent || // Contains inappropriate patterns
    !hasSentenceStructure || // No proper sentences
    cleaned.toLowerCase() === userMessage.toLowerCase() ||
    cleaned.includes("undefined")
  ) {
    // Return a simple fallback
    const fallbacks = [
      "Hi there! I'm so happy to see you! 💙",
      "Hello! *bounces excitedly* How are you doing?",
      "Yay! ✨ What would you like to talk about?",
      "*waves happily* Nice to meet you!",
      "Hehe! 😊 I'm having such a great day!",
      "Oh! Hi there! *gets excited* Tell me more!",
      "Wow, that's interesting! *sparkles*",
      "I'm listening! *tilts head curiously*",
    ]
    return fallbacks[Math.floor(Math.random() * fallbacks.length)]
  }
  
  return cleaned
}
