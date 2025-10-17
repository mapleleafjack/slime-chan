# Creature Inheritance System

## Overview

The creature system has been refactored to use a base class pattern with centralized configuration, making it easy to add new creature types without duplicating code. All creatures now inherit common functionality from the `BaseCreature` component.

## Centralized Configuration

**New**: All creature configurations are now centralized in `components/CreatureGame/creatureConfig.ts`

This file contains:
- **SLIME_CREATURE_CONFIG** - All slime settings (sprite size, animation, positioning)
- **MUSHROOM_CREATURE_CONFIG** - All mushroom settings
- **getCreatureConfig()** - Helper function to retrieve config by type

### Configuration Structure

```typescript
{
  // Sprite dimensions
  frameWidth: number
  frameHeight: number
  
  // Animation
  totalWalkFrames: number
  totalIdleFrames: number
  fps: number
  speed: number
  
  // Position
  groundLevel: number
  
  // UI Element Positioning (relative to sprite top)
  bubbleOffset: number     // Distance of bubble above sprite top
  indicatorOffset: number  // Distance of indicator below sprite top
}
```

### Easy Adjustments

To adjust creature positioning, simply edit `creatureConfig.ts`:

```typescript
export const SLIME_CREATURE_CONFIG: CreatureConfig = {
  // ... other settings ...
  bubbleOffset: 10,      // ← Adjust this to move bubble up/down
  indicatorOffset: 130,  // ← Adjust this to move indicator up/down
}
```

**No need to touch individual creature files!** 🎉

## Architecture

### BaseCreature Component

Located at: `components/CreatureGame/creatures/BaseCreature.tsx`

The `BaseCreature` provides:
- **Animation loop management** - Handles frame-by-frame animation at configurable FPS
- **Movement system** - Automatic walking with boundary detection and direction changes
- **Behavior changes** - Random switching between idle and walking states
- **Click handling** - Selection, deselection, and menu toggling
- **Bubble rendering** - Speech bubbles and menus positioned above creatures
- **Active state management** - Visual indicators for the selected creature
- **Aura effects** - Glowing effects on hover and selection
- **Keyboard controls** (optional) - Arrow keys and space bar support

### How to Use BaseCreature

The `useBaseCreature` hook accepts a configuration object with the following properties:

```typescript
{
  id: string                    // Unique creature ID
  config: CreatureConfig        // Animation and movement config
  isVisible?: (phase) => boolean // Optional visibility logic
  getCurrentImage: (creature) => string  // Get sprite sheet URL
  getCurrentFrame: (creature) => number  // Get current frame index
  getTotalFrames: (creature) => number   // Get total frames for animation
  calculateTopPosition?: (creature) => number  // Optional position calculation (e.g., for jumping)
  getGreetingText: (creature) => string  // Greeting message on click
  getAuraColor?: (creature) => string    // Custom aura color (RGB format)
  onCreatureClick?: (creature) => void   // Custom click behavior
  stopOnClick?: boolean          // Should creature stop when clicked? (default: true)
  enableKeyboardControls?: boolean  // Enable arrow keys? (default: false)
  renderSprite: (props) => ReactNode   // Render the actual sprite
  renderMenu: (creature, handlers) => ReactNode  // Render the menu
}
```

## Adding a New Creature Type

To add a new creature type (e.g., a Bird):

### 1. Update Type System

Add the creature type to `types/creatureTypes.ts`:

```typescript
export type CreatureType = "slime" | "mushroom" | "bird"

export type BirdData = BaseCreatureData & {
  creatureType: "bird"
  color: BirdColor
  isFlying: boolean
  altitude: number
  capabilities: CreatureCapabilities & {
    canJump: false
    canGlow: false
    canSleep: false
    canTalk: true
    canChangeColor: true
    canFly: true  // New capability!
  }
}

export type CreatureData = SlimeData | MushroomData | BirdData

export function isBird(creature: CreatureData): creature is BirdData {
  return creature.creatureType === "bird"
}
```

### 2. Create the Component

Create `components/CreatureGame/creatures/Bird.tsx`:

```tsx
import { useBaseCreature, RenderCreature } from "./BaseCreature"

const BIRD_CONFIG: CreatureConfig = {
  frameWidth: 64,
  frameHeight: 64,
  totalWalkFrames: 6,
  totalIdleFrames: 4,
  fps: 18,
  speed: 3,
  groundLevel: 300,  // Higher for birds!
}

const Bird: React.FC<{ id: string }> = ({ id }) => {
  const { dispatch } = useCreature()

  const baseCreature = useBaseCreature({
    id,
    config: BIRD_CONFIG,
    getCurrentImage: (creature) => {
      if (!isBird(creature)) return ""
      if (creature.isFlying) return `/assets/bird/fly.png`
      return `/assets/bird/idle.png`
    },
    getCurrentFrame: (creature) => {
      if (!isBird(creature)) return 0
      return creature.isFlying ? creature.walkFrame : creature.idleFrame
    },
    getTotalFrames: (creature) => {
      if (!isBird(creature)) return BIRD_CONFIG.totalIdleFrames
      return creature.isFlying ? BIRD_CONFIG.totalWalkFrames : BIRD_CONFIG.totalIdleFrames
    },
    getGreetingText: () => "🐦 *chirp chirp*",
    getAuraColor: () => "200,200,255",  // Light blue
    renderSprite: ({ creature, config, currentImage, backgroundOffsetX }) => {
      if (!isBird(creature)) return null
      return (
        <div
          style={{
            position: "absolute",
            top: config.groundLevel,
            left: creature.position,
            width: config.frameWidth,
            height: config.frameHeight,
            background: `url(${currentImage}) ${backgroundOffsetX}px 0 no-repeat`,
            imageRendering: "pixelated",
          }}
        />
      )
    },
    renderMenu: (creature, handlers) => {
      if (!isBird(creature)) return null
      return <BirdMenu bird={creature} id={id} handlers={handlers} />
    },
  })

  return (
    <RenderCreature
      baseCreature={baseCreature}
      renderSprite={renderSprite}
      renderMenu={renderMenu}
      config={BIRD_CONFIG}
      getCurrentImage={getCurrentImage}
      getCurrentFrame={getCurrentFrame}
    />
  )
}
```

### 3. Add Factory Function

Update `context/creatureContext.tsx`:

```typescript
export const createInitialBird = (id: string, position: number): BirdData => ({
  id,
  creatureType: "bird",
  color: "blue",
  personality: getRandomPersonality(),
  isWalking: false,
  isFlying: true,
  altitude: 0,
  direction: 1,
  mode: "auto",
  position,
  walkFrame: 0,
  idleFrame: 0,
  currentBehavior: "idle",
  lastInteraction: Date.now(),
  bubble: { visible: false, text: "", menuState: "none" },
  isThinking: false,
  conversationHistory: [],
  capabilities: {
    canJump: false,
    canGlow: false,
    canSleep: false,
    canTalk: true,
    canChangeColor: true,
    canFly: true,
  },
})
```

## Benefits of This System

✅ **Code Reuse** - Common logic is written once in `BaseCreature`
✅ **Consistency** - All creatures behave similarly for common actions
✅ **Easy to Extend** - New creatures require minimal code
✅ **Maintainable** - Bug fixes in `BaseCreature` apply to all creatures
✅ **Flexible** - Each creature can override or extend base behavior
✅ **Type-Safe** - Full TypeScript support with type guards

## Current Creature Implementations

### Slime (`Slime.tsx`)
- **Special Features**: Jumping, sleeping, color changing
- **Keyboard Controls**: Enabled (arrow keys + space)
- **Unique Logic**: Jump animation with parabolic arc
- **Menu Options**: Color picker, remove button

### Mushroom (`Mushroom.tsx`)
- **Special Features**: Glowing effect, night visibility
- **Visibility**: Only visible during dusk and night
- **Unique Logic**: Glow intensity changes, time-of-day visual effects
- **Menu Options**: Remove button only

## Code Reduction

Before refactoring:
- `Slime.tsx`: ~350 lines
- `Mushroom.tsx`: ~310 lines
- **Total**: ~660 lines with significant duplication

After refactoring:
- `BaseCreature.tsx`: ~370 lines (reusable)
- `Slime.tsx`: ~250 lines (slime-specific only)
- `Mushroom.tsx`: ~200 lines (mushroom-specific only)
- **Total**: ~820 lines BUT with no duplication

**Next creature will only need ~150-200 lines!** 🎉

## Testing Checklist

When adding a new creature, test:
- [ ] Creature renders correctly
- [ ] Walking animation plays smoothly
- [ ] Idle animation plays smoothly
- [ ] Creature stops at boundaries and reverses direction
- [ ] Clicking selects the creature
- [ ] Active indicator appears when selected
- [ ] Menu appears when clicking active creature
- [ ] Bubble positions correctly above creature
- [ ] Remove button works (when multiple creatures exist)
- [ ] Any creature-specific features work (jump, glow, etc.)
