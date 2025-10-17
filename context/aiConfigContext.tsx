"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

export type AIProvider = "openai" | "deepseek" | "local" | "custom"

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
}

interface AIConfigContextType {
  config: AIConfig
  updateConfig: (updates: Partial<AIConfig>) => void
  isConfigured: boolean
  resetConfig: () => void
}

const DEFAULT_CONFIG: AIConfig = {
  provider: "local",
  apiKey: "",
  baseUrl: "/api/local-llm",
  model: "local-llm",
  temperature: 0.9, // Higher for more creative, personality-driven responses
  maxTokens: 350, // Balanced for detailed yet concise responses
}

const PROVIDER_DEFAULTS: Record<AIProvider, { baseUrl: string; model: string }> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini", // Better model for more intelligent conversations
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  },
  local: {
    baseUrl: "/api/local-llm",
    model: "local-llm",
  },
  custom: {
    baseUrl: "",
    model: "",
  },
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined)

export const AIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AIConfig>(() => {
    // Initialize state from localStorage if available
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("slime-ai-config")
        if (stored) {
          const parsed = JSON.parse(stored)
          return { ...DEFAULT_CONFIG, ...parsed }
        }
      } catch (error) {
        console.error("Failed to load AI config from localStorage:", error)
      }
    }
    return DEFAULT_CONFIG
  })

  const [isInitialized, setIsInitialized] = useState(false)

  // Mark as initialized after first render
  useEffect(() => {
    setIsInitialized(true)
  }, [])

  // Save config to localStorage whenever it changes (but skip initial render)
  useEffect(() => {
    if (!isInitialized) return

    try {
      localStorage.setItem("slime-ai-config", JSON.stringify(config))
    } catch (error) {
      console.error("Failed to save AI config to localStorage:", error)
    }
  }, [config, isInitialized])

  const updateConfig = useCallback((updates: Partial<AIConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates }

      // If provider changed, update baseUrl and model to defaults
      if (updates.provider && updates.provider !== prev.provider) {
        const defaults = PROVIDER_DEFAULTS[updates.provider]
        newConfig.baseUrl = defaults.baseUrl
        newConfig.model = defaults.model
      }

      return newConfig
    })
  }, [])

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    localStorage.removeItem("slime-ai-config")
  }, [])

  const isConfigured = config.provider === "local" || config.apiKey.trim().length > 0

  return (
    <AIConfigContext.Provider value={{ config, updateConfig, isConfigured, resetConfig }}>
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
