/**
 * Tests for AI service functions
 * These tests verify AI integration, prompt generation, and response handling
 */

import {
  generateSystemPrompt,
  callAI,
  getFallbackResponse,
  generateSlimeResponse,
} from '@/utils/aiService'
import type { AIConfig } from '@/context/aiConfigContext'
import { createInitialSlime, createInitialMushroom } from '@/context/creatureContext'
import type { Message } from '@/types/creatureTypes'

// Mock fetch globally
global.fetch = jest.fn()

describe('AI Service', () => {
  // Suppress console logs during error tests to keep output clean
  const originalWarn = console.warn
  const originalError = console.error

  beforeAll(() => {
    console.warn = jest.fn()
    console.error = jest.fn()
  })

  afterAll(() => {
    console.warn = originalWarn
    console.error = originalError
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateSystemPrompt', () => {
    it('should generate prompt for slime with name', () => {
      const slime = createInitialSlime('slime-1', 'blue', 100, 'Blobby', 'playful')
      const prompt = generateSystemPrompt(slime)

      expect(prompt).toContain('Blobby')
      expect(prompt).toContain('blue slime')
      expect(prompt).toContain('playful')
      expect(prompt).toContain('stranger')
    })

    it('should generate prompt for unnamed slime', () => {
      const slime = createInitialSlime('slime-1', 'blue', 100, undefined, 'shy')
      const prompt = generateSystemPrompt(slime)

      expect(prompt).toContain("don't have a name yet")
      expect(prompt).toContain('shy')
    })

    it('should generate prompt for mushroom', () => {
      const mushroom = createInitialMushroom('mushroom-1', 200, 'Shroomy', 'calm')
      const prompt = generateSystemPrompt(mushroom)

      expect(prompt).toContain('Shroomy')
      expect(prompt).toContain('mystical mushroom')
      expect(prompt).toContain('calm')
      expect(prompt).toContain('Ancient, wise')
    })

    it('should include relationship context based on affection and trust', () => {
      const slime = createInitialSlime('slime-1', 'blue', 100, 'Blobby')
      slime.relationship.affection = 80
      slime.relationship.trust = 70
      slime.relationship.relationshipLevel = 'best friend'

      const prompt = generateSystemPrompt(slime)

      expect(prompt).toContain('best friend')
      expect(prompt).toContain('Affection: 80')
      expect(prompt).toContain('Trust: 70')
    })

    it('should include mood context', () => {
      const slime = createInitialSlime('slime-1', 'blue', 100, 'Blobby')
      slime.relationship.mood = 'happy'

      const prompt = generateSystemPrompt(slime)

      expect(prompt).toContain('happy')
    })

    it('should include current activity context', () => {
      const slime = createInitialSlime('slime-1', 'blue', 100, 'Blobby')
      slime.isJumping = true

      const prompt = generateSystemPrompt(slime)

      expect(prompt).toContain('bouncing excitedly')
    })

    it('should include other creatures in context', () => {
      const slime1 = createInitialSlime('slime-1', 'blue', 100, 'Blobby')
      const slime2 = createInitialSlime('slime-2', 'red', 200, 'Ruby', 'energetic')
      const mushroom = createInitialMushroom('mushroom-1', 300, 'Shroomy', 'calm')

      const prompt = generateSystemPrompt(slime1, undefined, [slime2, mushroom])

      expect(prompt).toContain('Other creatures nearby')
      expect(prompt).toContain('Ruby')
      expect(prompt).toContain('Shroomy')
    })

    it('should require JSON response format', () => {
      const slime = createInitialSlime('slime-1', 'blue', 100)
      const prompt = generateSystemPrompt(slime)

      expect(prompt).toContain('Response Format')
      expect(prompt).toContain('"message"')
      expect(prompt).toContain('"actions"')
    })
  })

  describe('callAI', () => {
    const mockConfig: AIConfig = {
      apiKey: 'test-key',
      model: 'deepseek-chat',
      baseUrl: 'https://api.deepseek.com/v1',
      temperature: 0.7,
      maxTokens: 500,
    }

    it('should successfully parse JSON response with message and actions', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                message: 'Hello, friend!',
                actions: [{ type: 'set_name', value: 'Blobby' }],
              }),
            },
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const messages = [
        { role: 'system' as const, content: 'You are a slime' },
        { role: 'user' as const, content: 'Hi!' },
      ]

      const result = await callAI(mockConfig, messages)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Hello, friend!')
      expect(result.actions).toHaveLength(1)
      expect(result.actions![0]).toEqual({ type: 'set_name', value: 'Blobby' })
    })

    it('should handle plain text response as fallback', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Hello, this is plain text!',
            },
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const messages = [
        { role: 'system' as const, content: 'You are a slime' },
        { role: 'user' as const, content: 'Hi!' },
      ]

      const result = await callAI(mockConfig, messages)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Hello, this is plain text!')
      expect(result.actions).toEqual([])
    })

    it('should handle API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Invalid API key' } }),
      })

      const messages = [
        { role: 'system' as const, content: 'You are a slime' },
        { role: 'user' as const, content: 'Hi!' },
      ]

      const result = await callAI(mockConfig, messages)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid API key')
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const messages = [
        { role: 'system' as const, content: 'You are a slime' },
        { role: 'user' as const, content: 'Hi!' },
      ]

      const result = await callAI(mockConfig, messages)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('should handle empty response', async () => {
      const mockResponse = {
        choices: [],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const messages = [
        { role: 'system' as const, content: 'You are a slime' },
        { role: 'user' as const, content: 'Hi!' },
      ]

      const result = await callAI(mockConfig, messages)

      expect(result.success).toBe(false)
      expect(result.error).toContain('No response from AI')
    })

    it('should send correct request format', async () => {
      const mockResponse = {
        choices: [{ message: { content: JSON.stringify({ message: 'Hi!' }) } }],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const messages = [
        { role: 'system' as const, content: 'You are a slime' },
        { role: 'user' as const, content: 'Hi!' },
      ]

      await callAI(mockConfig, messages)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-key',
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages,
            temperature: 0.7,
            max_tokens: 500,
          }),
        })
      )
    })
  })

  describe('generateSlimeResponse', () => {
    const mockConfig: AIConfig = {
      apiKey: 'test-key',
      model: 'deepseek-chat',
      baseUrl: 'https://api.deepseek.com/v1',
      temperature: 0.7,
      maxTokens: 500,
    }

    it('should include conversation history in messages', async () => {
      const slime = createInitialSlime('slime-1', 'blue', 100, 'Blobby')
      const conversationHistory: Message[] = [
        { id: 'msg-1', role: 'user', content: 'Hi!', timestamp: Date.now() },
        { id: 'msg-2', role: 'creature', content: 'Hello!', timestamp: Date.now() },
      ]

      const mockResponse = {
        choices: [{ message: { content: JSON.stringify({ message: 'Nice to see you!' }) } }],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await generateSlimeResponse(mockConfig, slime, 'How are you?', undefined, conversationHistory)

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1]
      const body = JSON.parse(callArgs.body)

      expect(body.messages).toHaveLength(4) // system + 2 history + current
      expect(body.messages[1].content).toBe('Hi!')
      expect(body.messages[2].content).toBe('Hello!')
      expect(body.messages[3].content).toBe('How are you?')
    })

    it('should limit conversation history to last 12 messages', async () => {
      const slime = createInitialSlime('slime-1', 'blue', 100, 'Blobby')
      
      // Create 20 messages in history
      const conversationHistory: Message[] = Array.from({ length: 20 }, (_, i) => ({
        id: `msg-${i}`,
        role: (i % 2 === 0 ? 'user' : 'creature') as 'user' | 'creature',
        content: `Message ${i}`,
        timestamp: Date.now(),
      }))

      const mockResponse = {
        choices: [{ message: { content: JSON.stringify({ message: 'Got it!' }) } }],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await generateSlimeResponse(mockConfig, slime, 'Current message', undefined, conversationHistory)

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1]
      const body = JSON.parse(callArgs.body)

      // Should have: 1 system + 12 history + 1 current = 14 total
      expect(body.messages).toHaveLength(14)
      // First history message should be "Message 8" (last 12 of 20)
      expect(body.messages[1].content).toBe('Message 8')
    })

    it('should include other creatures in system prompt', async () => {
      const slime1 = createInitialSlime('slime-1', 'blue', 100, 'Blobby')
      const slime2 = createInitialSlime('slime-2', 'red', 200, 'Ruby')

      const mockResponse = {
        choices: [{ message: { content: JSON.stringify({ message: 'Hi!' }) } }],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await generateSlimeResponse(mockConfig, slime1, 'Hello', undefined, undefined, [slime2])

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1]
      const body = JSON.parse(callArgs.body)

      expect(body.messages[0].content).toContain('Ruby')
    })
  })

  describe('getFallbackResponse', () => {
    it('should return slime fallback for slime creatures', () => {
      const slime = createInitialSlime('slime-1', 'blue', 100)
      const response = getFallbackResponse(slime)

      expect(response).toBeTruthy()
      expect(typeof response).toBe('string')
      expect(response.length).toBeGreaterThan(0)
    })

    it('should return mushroom fallback for mushroom creatures', () => {
      const mushroom = createInitialMushroom('mushroom-1', 200)
      const response = getFallbackResponse(mushroom)

      expect(response).toBeTruthy()
      expect(typeof response).toBe('string')
      expect(response.length).toBeGreaterThan(0)
    })

    it('should return slime fallback when no creature provided', () => {
      const response = getFallbackResponse()

      expect(response).toBeTruthy()
      expect(typeof response).toBe('string')
    })

    it('should return different responses on multiple calls', () => {
      const responses = new Set<string>()
      
      // Call 20 times, should get at least 3 different responses
      for (let i = 0; i < 20; i++) {
        responses.add(getFallbackResponse())
      }

      expect(responses.size).toBeGreaterThanOrEqual(3)
    })
  })
})
