"use client"

import React, { createContext, useContext } from "react"

export interface AIConfig {
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
}

interface AIConfigContextType {
  config: AIConfig
  isConfigured: boolean
}

// DeepSeek configuration - API key loaded from environment variable
const DEEPSEEK_CONFIG: AIConfig = {
  apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || "",
  baseUrl: "https://api.deepseek.com/v1",
  model: "deepseek-chat",
  temperature: 0.9, // Higher for more creative, personality-driven responses
  maxTokens: 350, // Balanced for detailed yet concise responses
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined)

export const AIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if API key is configured
  const isConfigured = !!DEEPSEEK_CONFIG.apiKey && DEEPSEEK_CONFIG.apiKey !== ""

  return (
    <AIConfigContext.Provider value={{ config: DEEPSEEK_CONFIG, isConfigured }}>
      {children}
    </AIConfigContext.Provider>
  )
}

export const useAIConfig = () => {
  const context = useContext(AIConfigContext)
  if (!context) {
    throw new Error("useAIConfig must be used within an AIConfigProvider")
  }
  return context
}
