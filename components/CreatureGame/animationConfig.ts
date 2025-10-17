export const ANIMATION_CONFIG = {
  frameWidth: 128,
  frameHeight: 128,
  totalWalkFrames: 8,
  totalJumpFrames: 13,
  totalIdleFrames: 8,
  fps: 24, // Increased from 12 to 24 for smoother animation
  baseSpeed: 2, // Reduced base speed for slower overall movement
  minSpeed: 1.5, // Minimum speed for variations
  maxSpeed: 3.5, // Maximum speed for variations
  jumpHeight: 50,
  groundLevel: 500, // Adjusted to be higher up on the screen
  // Probability of idle jump (0-1)
  idleJumpProbability: 0.3,
}
