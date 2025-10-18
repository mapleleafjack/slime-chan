/**
 * Tests for utility functions
 * These tests verify pure helper functions used throughout the app
 */

import {
  calculateRelationshipScore,
  getRelationshipLevelUpMessage,
  getProgressToNextLevel,
  getAffectionGainMessage,
  getTrustGainMessage,
  evaluateInteractionQuality,
  getMoodModifier,
  getRelationshipAdvice,
} from '@/utils/relationshipUtils'

import { getRandomFirstName } from '@/utils/nameUtils'

import {
  DayPhase,
  calculateOverlay,
  getBehaviorDuration,
  randomInt,
  getRandomPhrase,
  getRandomJapanesePhrase,
  constrainToGameBounds,
} from '@/utils/gameUtils'

describe('Relationship Utils', () => {
  describe('calculateRelationshipScore', () => {
    it('should calculate weighted score correctly', () => {
      // 70% affection + 30% trust
      expect(calculateRelationshipScore(100, 100)).toBe(100)
      expect(calculateRelationshipScore(100, 0)).toBe(70)
      expect(calculateRelationshipScore(0, 100)).toBe(30)
      expect(calculateRelationshipScore(50, 50)).toBe(50)
    })

    it('should round to nearest integer', () => {
      const score = calculateRelationshipScore(33, 33)
      expect(Number.isInteger(score)).toBe(true)
    })
  })

  describe('getRelationshipLevelUpMessage', () => {
    it('should return message for level up', () => {
      const message = getRelationshipLevelUpMessage('stranger', 'acquaintance', 'Blobby')
      expect(message).toContain('Blobby')
      expect(message).toContain('acquaintance')
    })

    it('should return null when no level change', () => {
      const message = getRelationshipLevelUpMessage('friend', 'friend', 'Blobby')
      expect(message).toBeNull()
    })

    it('should use default creature name', () => {
      const message = getRelationshipLevelUpMessage('stranger', 'friend')
      expect(message).toContain('Creature')
    })

    it('should return correct message for each level', () => {
      expect(getRelationshipLevelUpMessage('stranger', 'acquaintance')).toContain('acquaintance')
      expect(getRelationshipLevelUpMessage('acquaintance', 'friend')).toContain('friend')
      expect(getRelationshipLevelUpMessage('friend', 'close friend')).toContain('close friend')
      expect(getRelationshipLevelUpMessage('close friend', 'best friend')).toContain('best friend')
    })
  })

  describe('getProgressToNextLevel', () => {
    it('should calculate progress to acquaintance', () => {
      const progress = getProgressToNextLevel(10, 5)
      expect(progress.nextLevel).toBe('acquaintance')
      expect(progress.target).toBe(15)
      expect(progress.percentage).toBeGreaterThanOrEqual(0)
      expect(progress.percentage).toBeLessThanOrEqual(100)
    })

    it('should calculate progress to friend', () => {
      const progress = getProgressToNextLevel(20, 20)
      expect(progress.nextLevel).toBe('friend')
      expect(progress.target).toBe(35)
    })

    it('should show no next level at max', () => {
      const progress = getProgressToNextLevel(100, 100)
      expect(progress.nextLevel).toBeNull()
      expect(progress.percentage).toBe(100)
    })

    it('should have percentage between 0-100', () => {
      const progress1 = getProgressToNextLevel(0, 0)
      const progress2 = getProgressToNextLevel(50, 50)
      const progress3 = getProgressToNextLevel(75, 75)

      expect(progress1.percentage).toBeGreaterThanOrEqual(0)
      expect(progress1.percentage).toBeLessThanOrEqual(100)
      expect(progress2.percentage).toBeGreaterThanOrEqual(0)
      expect(progress2.percentage).toBeLessThanOrEqual(100)
      expect(progress3.percentage).toBeGreaterThanOrEqual(0)
      expect(progress3.percentage).toBeLessThanOrEqual(100)
    })
  })

  describe('getAffectionGainMessage', () => {
    it('should return messages for positive gains', () => {
      expect(getAffectionGainMessage(6)).toContain('Major')
      expect(getAffectionGainMessage(4)).toContain('Big')
      expect(getAffectionGainMessage(3)).toContain('increased')
      expect(getAffectionGainMessage(2)).toContain('up')
      expect(getAffectionGainMessage(1)).toContain('gain')
    })

    it('should return null for no gain', () => {
      expect(getAffectionGainMessage(0)).toBeNull()
      expect(getAffectionGainMessage(-5)).toBeNull()
    })
  })

  describe('getTrustGainMessage', () => {
    it('should return messages for positive gains', () => {
      expect(getTrustGainMessage(5)).toContain('deeply')
      expect(getTrustGainMessage(4)).toContain('Major')
      expect(getTrustGainMessage(3)).toContain('increased')
      expect(getTrustGainMessage(2)).toContain('up')
      expect(getTrustGainMessage(1)).toContain('gain')
    })

    it('should return null for no gain', () => {
      expect(getTrustGainMessage(0)).toBeNull()
    })
  })

  describe('evaluateInteractionQuality', () => {
    it('should rate interactions correctly', () => {
      expect(evaluateInteractionQuality(6, 5)).toBe('exceptional')
      expect(evaluateInteractionQuality(4, 3)).toBe('great')
      expect(evaluateInteractionQuality(2, 2)).toBe('good')
      expect(evaluateInteractionQuality(1, 0)).toBe('neutral')
      expect(evaluateInteractionQuality(0, 0)).toBe('poor')
    })
  })

  describe('getMoodModifier', () => {
    it('should boost for positive moods', () => {
      const loving = getMoodModifier('loving')
      expect(loving.affectionMultiplier).toBeGreaterThan(1)
      expect(loving.trustMultiplier).toBeGreaterThanOrEqual(1)

      const happy = getMoodModifier('happy')
      expect(happy.affectionMultiplier).toBeGreaterThan(1)
    })

    it('should reduce for negative moods', () => {
      const sad = getMoodModifier('sad')
      expect(sad.affectionMultiplier).toBeLessThan(1)
      expect(sad.trustMultiplier).toBeLessThan(1)

      const angry = getMoodModifier('angry')
      expect(angry.affectionMultiplier).toBeLessThan(1)
      expect(angry.trustMultiplier).toBeLessThan(1)
    })

    it('should return 1.0 for neutral', () => {
      const neutral = getMoodModifier('neutral')
      expect(neutral.affectionMultiplier).toBe(1.0)
      expect(neutral.trustMultiplier).toBe(1.0)
    })
  })

  describe('getRelationshipAdvice', () => {
    it('should give advice for new relationships', () => {
      const advice = getRelationshipAdvice(5, 5, 2)
      expect(advice).toContain('chatting')
    })

    it('should suggest building trust when low', () => {
      const advice = getRelationshipAdvice(50, 20, 10)
      expect(advice.toLowerCase()).toContain('trust')
    })

    it('should suggest showing warmth when affection is low', () => {
      const advice = getRelationshipAdvice(20, 50, 10)
      const lowerAdvice = advice.toLowerCase()
      expect(lowerAdvice.includes('affection') || lowerAdvice.includes('warmth')).toBe(true)
    })

    it('should congratulate on best friend status', () => {
      const advice = getRelationshipAdvice(100, 100, 50)
      expect(advice).toContain('amazing')
    })
  })
})

describe('Name Utils', () => {
  describe('getRandomFirstName', () => {
    it('should return a string', () => {
      const name = getRandomFirstName()
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    })

    it('should return different names over multiple calls', () => {
      const names = new Set<string>()
      for (let i = 0; i < 20; i++) {
        names.add(getRandomFirstName())
      }
      // Should get at least 5 different names in 20 tries
      expect(names.size).toBeGreaterThanOrEqual(5)
    })

    it('should always return valid names', () => {
      for (let i = 0; i < 10; i++) {
        const name = getRandomFirstName()
        expect(name).toBeTruthy()
        expect(name.length).toBeGreaterThan(0)
        expect(name).not.toContain(' ') // No spaces in names
      }
    })
  })
})

describe('Game Utils', () => {
  describe('calculateOverlay', () => {
    it('should return MORNING phase between 5-9 AM', () => {
      const morning = new Date('2025-01-01T07:00:00')
      const result = calculateOverlay(morning)
      expect(result.phase).toBe(DayPhase.MORNING)
      expect(result.opacity).toBeGreaterThanOrEqual(0)
      expect(result.opacity).toBeLessThanOrEqual(0.3)
    })

    it('should return DAY phase between 10 AM - 4 PM', () => {
      const day = new Date('2025-01-01T14:00:00')
      const result = calculateOverlay(day)
      expect(result.phase).toBe(DayPhase.DAY)
      expect(result.opacity).toBe(0)
    })

    it('should return DUSK phase between 5-7 PM', () => {
      const dusk = new Date('2025-01-01T18:00:00')
      const result = calculateOverlay(dusk)
      expect(result.phase).toBe(DayPhase.DUSK)
      expect(result.opacity).toBeGreaterThanOrEqual(0.2)
      expect(result.opacity).toBeLessThanOrEqual(0.5)
    })

    it('should return NIGHT phase between 8 PM - 4 AM', () => {
      const night1 = new Date('2025-01-01T22:00:00')
      const result1 = calculateOverlay(night1)
      expect(result1.phase).toBe(DayPhase.NIGHT)
      expect(result1.opacity).toBeGreaterThanOrEqual(0.5)

      const night2 = new Date('2025-01-01T02:00:00')
      const result2 = calculateOverlay(night2)
      expect(result2.phase).toBe(DayPhase.NIGHT)
      expect(result2.opacity).toBeGreaterThanOrEqual(0.5)
    })
  })

  describe('getBehaviorDuration', () => {
    it('should return duration for each behavior', () => {
      expect(getBehaviorDuration('walkLeft')).toBeGreaterThan(0)
      expect(getBehaviorDuration('walkRight')).toBeGreaterThan(0)
      expect(getBehaviorDuration('jump')).toBe(1500)
      expect(getBehaviorDuration('sleep')).toBeGreaterThan(0)
      expect(getBehaviorDuration('talk')).toBeGreaterThan(0)
      expect(getBehaviorDuration('idle')).toBeGreaterThan(0)
    })

    it('should return consistent duration for jump', () => {
      // Jump should always be 1500ms
      for (let i = 0; i < 5; i++) {
        expect(getBehaviorDuration('jump')).toBe(1500)
      }
    })

    it('should vary duration for random behaviors', () => {
      const durations = new Set<number>()
      for (let i = 0; i < 10; i++) {
        durations.add(getBehaviorDuration('walkLeft'))
      }
      // Should get different durations
      expect(durations.size).toBeGreaterThan(1)
    })
  })

  describe('randomInt', () => {
    it('should return integer within range', () => {
      for (let i = 0; i < 20; i++) {
        const value = randomInt(1, 10)
        expect(Number.isInteger(value)).toBe(true)
        expect(value).toBeGreaterThanOrEqual(1)
        expect(value).toBeLessThanOrEqual(10)
      }
    })

    it('should include min and max values', () => {
      const values = new Set<number>()
      for (let i = 0; i < 100; i++) {
        values.add(randomInt(1, 3))
      }
      expect(values.has(1)).toBe(true)
      expect(values.has(3)).toBe(true)
    })

    it('should work with same min and max', () => {
      expect(randomInt(5, 5)).toBe(5)
    })
  })

  describe('getRandomPhrase', () => {
    it('should return a string', () => {
      const phrase = getRandomPhrase()
      expect(typeof phrase).toBe('string')
      expect(phrase.length).toBeGreaterThan(0)
    })

    it('should return different phrases', () => {
      const phrases = new Set<string>()
      for (let i = 0; i < 20; i++) {
        phrases.add(getRandomPhrase())
      }
      expect(phrases.size).toBeGreaterThan(1)
    })
  })

  describe('getRandomJapanesePhrase', () => {
    it('should return a string', () => {
      const phrase = getRandomJapanesePhrase()
      expect(typeof phrase).toBe('string')
      expect(phrase.length).toBeGreaterThan(0)
    })

    it('should return different phrases', () => {
      const phrases = new Set<string>()
      for (let i = 0; i < 30; i++) {
        phrases.add(getRandomJapanesePhrase())
      }
      expect(phrases.size).toBeGreaterThan(3)
    })
  })

  describe('constrainToGameBounds', () => {
    it('should constrain to game bounds', () => {
      expect(constrainToGameBounds(100)).toBe(100)
      expect(constrainToGameBounds(-50)).toBe(0)
      expect(constrainToGameBounds(500)).toBe(352) // 480 - 128
    })

    it('should respect custom frame width', () => {
      expect(constrainToGameBounds(500, 64)).toBe(416) // 480 - 64
      expect(constrainToGameBounds(500, 200)).toBe(280) // 480 - 200
    })

    it('should handle edge cases', () => {
      expect(constrainToGameBounds(0)).toBe(0)
      expect(constrainToGameBounds(352)).toBe(352) // Max with default width
    })
  })
})
