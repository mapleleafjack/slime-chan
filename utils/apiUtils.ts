/**
 * This file is kept for backward compatibility.
 * For new AI functionality, use @/utils/aiService instead.
 * 
 * The new aiService provides:
 * - OpenAI-compatible API integration (DeepSeek, OpenAI, etc.)
 * - Context-aware responses based on slime state
 * - Personality-driven conversations
 * - Proper error handling and fallbacks
 */

import { getFallbackResponse } from "./aiService"

/**
 * @deprecated Use aiService.generateSlimeResponse instead
 */
export const generateSlimeResponse = async (prompt: string) => {
  console.log("Generating response for:", prompt)
  console.warn("This function is deprecated. Use aiService.generateSlimeResponse instead.")

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Return a fallback response
  return getFallbackResponse()
}
