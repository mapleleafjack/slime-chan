// Web-compatible version of the API utils
const mockResponses = [
  "ブロップ！",
  "こんにちは",
  "眠い...",
  "元気？",
  "楽しい！",
  "おはよう",
  "おやすみ",
  "遊ぼう！",
  "お腹すいた",
  "ジャンプ！",
]

export const generateSlimeResponse = async (prompt: string) => {
  console.log("Generating response for:", prompt)

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Return a random Japanese response
  const randomIndex = Math.floor(Math.random() * mockResponses.length)
  return mockResponses[randomIndex]
}
