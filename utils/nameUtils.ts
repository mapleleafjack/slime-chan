/**
 * Utility functions for generating creature names
 */

export const getRandomFirstName = (): string => {
  const names = [
    // Cute names
    "Mochi", "Pudding", "Marshmallow", "Cookie", "Bubbles",
    "Honey", "Peanut", "Jellybean", "Sprinkles", "Cupcake",
    // Nature names
    "Basil", "Sage", "Clover", "Willow", "Poppy",
    "Ivy", "Fern", "Moss", "Daisy", "Luna",
    // Whimsical names
    "Bloop", "Squish", "Bounce", "Wobble", "Flutter",
    "Twinkle", "Sparkle", "Glimmer", "Shimmer", "Whisper",
    // Japanese-inspired
    "Momo", "Kiki", "Sora", "Yuki", "Hana",
    "Nori", "Tofu", "Miso", "Kuri", "Matcha",
  ]
  return names[Math.floor(Math.random() * names.length)]
}
