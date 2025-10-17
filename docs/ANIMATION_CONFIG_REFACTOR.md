# Animation Config Refactoring

## Summary
Successfully refactored the animation system to **eliminate the centralized `ANIMATION_CONFIG`** and move all configuration values into **creature-specific definitions**.

## Analysis Result
After analyzing the original `ANIMATION_CONFIG`, we determined that **ALL values were creature-specific** and should not be shared globally:

### Original ANIMATION_CONFIG Values → New Location
- ❌ `frameWidth`, `frameHeight` → Already in `SpriteDefinition` ✓
- ❌ `totalWalkFrames`, `totalJumpFrames`, `totalIdleFrames` → Already in `SpriteAnimation.frameCount` ✓
- ❌ `fps` → Already in `CreaturePhysics` ✓
- ❌ `baseSpeed`, `minSpeed`, `maxSpeed` → **Added to `CreaturePhysics`** ✓
- ❌ `jumpHeight` → **Added to `CreaturePhysics` (optional)** ✓
- ❌ `groundLevel` → Already in `CreaturePhysics` ✓
- ❌ `idleJumpProbability` → **Added to `CreaturePhysics` (optional)** ✓

**Conclusion: NO generic animation config needed!** 🎉

## Changes Made

### 1. Extended `CreaturePhysics` Interface
**File:** `components/CreatureGame/creatures/types.ts`

```typescript
export interface CreaturePhysics {
  speed: number
  groundLevel: number
  fps: number
  baseSpeed: number          // NEW
  minSpeed: number           // NEW
  maxSpeed: number           // NEW
  jumpHeight?: number        // NEW (optional)
  idleJumpProbability?: number // NEW (optional)
}
```

### 2. Updated Creature Definitions

#### Slime Definition
**File:** `components/CreatureGame/creatures/Slime.tsx`

```typescript
physics: { 
  speed: 2, 
  groundLevel: 500, 
  fps: 24,
  baseSpeed: 2,
  minSpeed: 1.5,
  maxSpeed: 3.5,
  jumpHeight: 50,
  idleJumpProbability: 0.3,
}
```

#### Mushroom Definition
**File:** `components/CreatureGame/creatures/Mushroom.tsx`

```typescript
physics: { 
  speed: 0.5, 
  groundLevel: 490, 
  fps: 12,
  baseSpeed: 0.5,
  minSpeed: 0.3,
  maxSpeed: 0.8,
  // No jumpHeight or idleJumpProbability - mushrooms can't jump!
}
```

### 3. Refactored `useCreatureLogic` Hook
**File:** `hooks/useCreatureLogic.ts`

- ✅ Removed `ANIMATION_CONFIG` import
- ✅ Added `getCreatureDefinition` import
- ✅ Gets creature definition dynamically: `getCreatureDefinition(creature.creatureType)`
- ✅ Uses `physics` from creature definition instead of global config
- ✅ Calculates `frameWidth` from creature's sprite definition
- ✅ All animation logic now uses creature-specific values

### 4. Updated `gameUtils.ts`
**File:** `utils/gameUtils.ts`

- ✅ Removed `ANIMATION_CONFIG` import
- ✅ Updated `constrainToGameBounds` to accept `frameWidth` parameter:
  ```typescript
  export const constrainToGameBounds = (position: number, frameWidth: number = 128) => {
    return Math.max(0, Math.min(position, 480 - frameWidth))
  }
  ```

### 5. Deleted Obsolete File
**File:** ~~`components/CreatureGame/animationConfig.ts`~~ ❌ **DELETED**

## Benefits

### 🎯 Better Architecture
- **Encapsulation**: Each creature owns its own configuration
- **Type Safety**: Physics config is part of the creature definition type
- **No Globals**: Eliminated shared mutable state
- **Maintainability**: Easy to find and modify creature-specific values

### 🔧 Flexibility
- Different creatures can have vastly different physics
- Easy to add new creatures with unique properties
- No coupling between creatures through shared config

### 📦 Extensibility
- New creatures can define their own physics without affecting others
- Optional properties (like `jumpHeight`) only needed for creatures that use them
- Future creature types can add custom physics properties

## Creature-Specific vs Generic Config

### ✅ Creature-Specific (Per-Creature)
All animation and physics values are now creature-specific:
- Frame dimensions and counts
- Animation speeds (fps)
- Movement speeds (base, min, max)
- Jump physics
- Behavior probabilities

### ⚪ Generic (None Required!)
After analysis, we determined that **no truly generic animation configuration** is needed. All values are properly owned by individual creatures.

## Migration Guide for Future Creatures

When adding a new creature:

1. Define the `physics` object with all required values:
   ```typescript
   physics: {
     speed: number,           // Current movement speed
     groundLevel: number,     // Y position when on ground
     fps: number,             // Animation frame rate
     baseSpeed: number,       // Default movement speed
     minSpeed: number,        // Minimum random speed
     maxSpeed: number,        // Maximum random speed
     jumpHeight?: number,     // Optional: max jump height
     idleJumpProbability?: number, // Optional: chance of idle jump
   }
   ```

2. Define sprite dimensions in the sprite definition:
   ```typescript
   sprites: {
     default: {
       frameWidth: number,
       frameHeight: number,
       animations: { ... }
     }
   }
   ```

3. No need to touch any global config file - everything is self-contained!

## Testing Checklist
- ✅ No TypeScript errors
- ✅ All creature animations work correctly
- ✅ Slimes jump and move with correct physics
- ✅ Mushrooms move with their own slower physics
- ✅ Edge detection works properly
- ✅ Speed variation works per creature

## Result
**Clean, maintainable, creature-specific configuration system with zero generic/shared animation config!** 🎉
