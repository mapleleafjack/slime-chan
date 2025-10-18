/**
 * Tests for creature context reducer
 * These tests verify the core game state management logic
 */

import { renderHook, act } from '@testing-library/react'
import { useCreature, CreatureProvider, createInitialSlime, createInitialMushroom } from '@/context/creatureContext'
import type { SlimeData, MushroomData, Message } from '@/types/creatureTypes'

describe('Creature Context', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CreatureProvider>{children}</CreatureProvider>
  )

  describe('Initial State', () => {
    it('should start with empty creatures array', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      
      expect(result.current.state.creatures).toEqual([])
      expect(result.current.state.activeCreatureId).toBeNull()
    })
  })

  describe('ADD_CREATURE', () => {
    it('should add a slime to the creatures array', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
      })

      expect(result.current.state.creatures).toHaveLength(1)
      expect(result.current.state.creatures[0]).toMatchObject({
        id: 'slime-1',
        creatureType: 'slime',
        color: 'blue',
        position: 100,
      })
    })

    it('should add a mushroom to the creatures array', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const mushroom = createInitialMushroom('mushroom-1', 200)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: mushroom })
      })

      expect(result.current.state.creatures).toHaveLength(1)
      expect(result.current.state.creatures[0]).toMatchObject({
        id: 'mushroom-1',
        creatureType: 'mushroom',
        position: 200,
      })
    })

    it('should add multiple creatures', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)
      const mushroom = createInitialMushroom('mushroom-1', 200)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ type: 'ADD_CREATURE', payload: mushroom })
      })

      expect(result.current.state.creatures).toHaveLength(2)
    })
  })

  describe('REMOVE_CREATURE', () => {
    it('should remove a creature by id', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ type: 'REMOVE_CREATURE', payload: 'slime-1' })
      })

      expect(result.current.state.creatures).toHaveLength(0)
    })

    it('should clear active creature if removed creature was active', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ type: 'SET_ACTIVE_CREATURE', payload: 'slime-1' })
        result.current.dispatch({ type: 'REMOVE_CREATURE', payload: 'slime-1' })
      })

      expect(result.current.state.activeCreatureId).toBeNull()
    })

    it('should keep active creature if different creature was removed', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime1 = createInitialSlime('slime-1', 'blue', 100)
      const slime2 = createInitialSlime('slime-2', 'red', 200)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime1 })
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime2 })
        result.current.dispatch({ type: 'SET_ACTIVE_CREATURE', payload: 'slime-1' })
        result.current.dispatch({ type: 'REMOVE_CREATURE', payload: 'slime-2' })
      })

      expect(result.current.state.activeCreatureId).toBe('slime-1')
    })
  })

  describe('CLEAR_ALL_CREATURES', () => {
    it('should remove all creatures and clear active creature', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)
      const mushroom = createInitialMushroom('mushroom-1', 200)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ type: 'ADD_CREATURE', payload: mushroom })
        result.current.dispatch({ type: 'SET_ACTIVE_CREATURE', payload: 'slime-1' })
        result.current.dispatch({ type: 'CLEAR_ALL_CREATURES' })
      })

      expect(result.current.state.creatures).toHaveLength(0)
      expect(result.current.state.activeCreatureId).toBeNull()
    })
  })

  describe('SET_ACTIVE_CREATURE', () => {
    it('should set the active creature id', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ type: 'SET_ACTIVE_CREATURE', payload: 'slime-1' })
      })

      expect(result.current.state.activeCreatureId).toBe('slime-1')
    })

    it('should allow setting active creature to null', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })

      act(() => {
        result.current.dispatch({ type: 'SET_ACTIVE_CREATURE', payload: null })
      })

      expect(result.current.state.activeCreatureId).toBeNull()
    })
  })

  describe('SET_CREATURE_NAME', () => {
    it('should set creature name', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ 
          type: 'SET_CREATURE_NAME', 
          payload: { id: 'slime-1', firstName: 'Blobby' } 
        })
      })

      expect(result.current.state.creatures[0].firstName).toBe('Blobby')
    })

    it('should only update the specified creature', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime1 = createInitialSlime('slime-1', 'blue', 100)
      const slime2 = createInitialSlime('slime-2', 'red', 200)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime1 })
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime2 })
        result.current.dispatch({ 
          type: 'SET_CREATURE_NAME', 
          payload: { id: 'slime-1', firstName: 'Blobby' } 
        })
      })

      expect(result.current.state.creatures[0].firstName).toBe('Blobby')
      expect(result.current.state.creatures[1].firstName).toBeUndefined()
    })
  })

  describe('ADD_MESSAGE', () => {
    it('should add a message to conversation history', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)
      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello!',
        timestamp: Date.now(),
      }

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ 
          type: 'ADD_MESSAGE', 
          payload: { id: 'slime-1', message } 
        })
      })

      expect(result.current.state.creatures[0].conversationHistory).toHaveLength(1)
      expect(result.current.state.creatures[0].conversationHistory[0]).toMatchObject({
        role: 'user',
        content: 'Hello!',
      })
    })

    it('should maintain conversation order', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)
      const message1: Message = { id: 'msg-1', role: 'user', content: 'Hi', timestamp: Date.now() }
      const message2: Message = { id: 'msg-2', role: 'creature', content: 'Hello!', timestamp: Date.now() }

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ type: 'ADD_MESSAGE', payload: { id: 'slime-1', message: message1 } })
        result.current.dispatch({ type: 'ADD_MESSAGE', payload: { id: 'slime-1', message: message2 } })
      })

      expect(result.current.state.creatures[0].conversationHistory).toHaveLength(2)
      expect(result.current.state.creatures[0].conversationHistory[0].content).toBe('Hi')
      expect(result.current.state.creatures[0].conversationHistory[1].content).toBe('Hello!')
    })
  })

  describe('CLEAR_CONVERSATION', () => {
    it('should clear conversation history for a creature', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)
      const message: Message = { id: 'msg-1', role: 'user', content: 'Hello!', timestamp: Date.now() }

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ type: 'ADD_MESSAGE', payload: { id: 'slime-1', message } })
        result.current.dispatch({ type: 'CLEAR_CONVERSATION', payload: 'slime-1' })
      })

      expect(result.current.state.creatures[0].conversationHistory).toHaveLength(0)
    })
  })

  describe('Relationship Updates', () => {
    it('should update affection', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ 
          type: 'UPDATE_AFFECTION', 
          payload: { id: 'slime-1', delta: 10 } 
        })
      })

      expect(result.current.state.creatures[0].relationship.affection).toBe(15) // 5 + 10
    })

    it('should cap affection at 100', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ 
          type: 'UPDATE_AFFECTION', 
          payload: { id: 'slime-1', delta: 200 } 
        })
      })

      expect(result.current.state.creatures[0].relationship.affection).toBe(100)
    })

    it('should not allow affection below 0', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ 
          type: 'UPDATE_AFFECTION', 
          payload: { id: 'slime-1', delta: -100 } 
        })
      })

      expect(result.current.state.creatures[0].relationship.affection).toBe(0)
    })

    it('should update trust', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ 
          type: 'UPDATE_TRUST', 
          payload: { id: 'slime-1', delta: 15 } 
        })
      })

      expect(result.current.state.creatures[0].relationship.trust).toBe(20) // 5 + 15
    })

    it('should update mood', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ 
          type: 'SET_MOOD', 
          payload: { id: 'slime-1', mood: 'happy' } 
        })
      })

      expect(result.current.state.creatures[0].relationship.mood).toBe('happy')
    })

    it('should increment total interactions', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ type: 'INCREMENT_INTERACTIONS', payload: 'slime-1' })
        result.current.dispatch({ type: 'INCREMENT_INTERACTIONS', payload: 'slime-1' })
      })

      expect(result.current.state.creatures[0].relationship.totalInteractions).toBe(2)
    })
  })

  describe('Slime-specific Actions', () => {
    it('should change slime color', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ 
          type: 'SET_SLIME_COLOR', 
          payload: { id: 'slime-1', color: 'red' } 
        })
      })

      const creature = result.current.state.creatures[0] as SlimeData
      expect(creature.color).toBe('red')
    })

    it('should not change color for non-slime creatures', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const mushroom = createInitialMushroom('mushroom-1', 200)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: mushroom })
        result.current.dispatch({ 
          type: 'SET_SLIME_COLOR', 
          payload: { id: 'mushroom-1', color: 'red' } 
        })
      })

      const creature = result.current.state.creatures[0] as MushroomData
      expect(creature.color).toBe('default')
    })

    it('should set jumping state', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ 
          type: 'SET_JUMPING', 
          payload: { id: 'slime-1', value: true } 
        })
      })

      const creature = result.current.state.creatures[0] as SlimeData
      expect(creature.isJumping).toBe(true)
    })

    it('should set sleeping state', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const slime = createInitialSlime('slime-1', 'blue', 100)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: slime })
        result.current.dispatch({ 
          type: 'SET_SLEEPING', 
          payload: { id: 'slime-1', value: true } 
        })
      })

      const creature = result.current.state.creatures[0] as SlimeData
      expect(creature.isSleeping).toBe(true)
    })
  })

  describe('Mushroom-specific Actions', () => {
    it('should set glowing state', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const mushroom = createInitialMushroom('mushroom-1', 200)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: mushroom })
        result.current.dispatch({ 
          type: 'SET_GLOWING', 
          payload: { id: 'mushroom-1', value: true } 
        })
      })

      const creature = result.current.state.creatures[0] as MushroomData
      expect(creature.isGlowing).toBe(true)
    })

    it('should set glow intensity', () => {
      const { result } = renderHook(() => useCreature(), { wrapper })
      const mushroom = createInitialMushroom('mushroom-1', 200)

      act(() => {
        result.current.dispatch({ type: 'ADD_CREATURE', payload: mushroom })
        result.current.dispatch({ 
          type: 'SET_GLOW_INTENSITY', 
          payload: { id: 'mushroom-1', value: 0.8 } 
        })
      })

      const creature = result.current.state.creatures[0] as MushroomData
      expect(creature.glowIntensity).toBe(0.8)
    })
  })

  describe('Factory Functions', () => {
    it('should create slime with correct defaults', () => {
      const slime = createInitialSlime('test-1', 'blue', 100)

      expect(slime).toMatchObject({
        id: 'test-1',
        creatureType: 'slime',
        color: 'blue',
        position: 100,
        isWalking: false,
        isJumping: false,
        isSleeping: false,
      })
      expect(slime.personality).toBeDefined()
      expect(slime.relationship.affection).toBe(5)
      expect(slime.relationship.trust).toBe(5)
      expect(slime.capabilities.canJump).toBe(true)
      expect(slime.capabilities.canSleep).toBe(true)
    })

    it('should create mushroom with correct defaults', () => {
      const mushroom = createInitialMushroom('test-1', 200)

      expect(mushroom).toMatchObject({
        id: 'test-1',
        creatureType: 'mushroom',
        position: 200,
        isWalking: true,
        isGlowing: false,
        glowIntensity: 0,
      })
      expect(mushroom.personality).toBeDefined()
      expect(mushroom.capabilities.canJump).toBe(false)
      expect(mushroom.capabilities.canGlow).toBe(true)
    })

    it('should accept optional name parameter', () => {
      const slime = createInitialSlime('test-1', 'blue', 100, 'Blobby')
      expect(slime.firstName).toBe('Blobby')
    })

    it('should accept optional personality parameter', () => {
      const slime = createInitialSlime('test-1', 'blue', 100, undefined, 'playful')
      expect(slime.personality).toBe('playful')
    })
  })
})
