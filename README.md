# 🟢 Slime-chan

An interactive virtual pet game with AI-powered conversations! Watch your cute slimes bounce around, and chat with them using advanced AI.

## ✨ Features

- 🎮 **Interactive Slimes** - Click to select, use arrow keys and space to control
- 🤖 **AI Conversations** - Chat with slimes using DeepSeek, OpenAI, or custom AI providers
- 🎭 **Unique Personalities** - Each slime has its own personality (playful, shy, energetic, calm, curious, sleepy)
- 🌈 **Customizable** - Change slime colors, add/remove slimes
- 🌅 **Day/Night Cycle** - Dynamic lighting and atmosphere
- 💬 **Real-time Chat** - Type messages and get contextual AI responses

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Open http://localhost:3000
```

## 💬 How to Chat with Slimes

1. **Click on a slime** to select it
2. **A chat box appears** at the bottom automatically
3. **Type your message** and press Enter
4. **Watch the slime respond!**
5. **Click away or press ESC** to deselect

📖 **Detailed Guide**: See [docs/HOW_TO_CHAT.md](docs/HOW_TO_CHAT.md)

> 💡 **Tip**: Keyboard controls (arrows/space) only work when NO slime is selected, so you can type freely!

## 🤖 AI Setup (Optional)

Want your slimes to have intelligent conversations? Configure AI in 3 steps:

1. Get an API key from [DeepSeek](https://platform.deepseek.com/) (recommended, very affordable) or [OpenAI](https://platform.openai.com/)
2. Click the ⚙️ settings button in the app
3. Paste your API key and test the connection

📖 **Setup Guide**: See [docs/QUICK_START.md](docs/QUICK_START.md)

💡 **Without AI configured**, slimes still work perfectly with pre-programmed cute phrases!

## 📁 Documentation

- 📖 [Quick Start Guide](docs/QUICK_START.md) - Get AI up and running in 3 steps
- 💬 [How to Chat](docs/HOW_TO_CHAT.md) - Visual guide for chatting with slimes
- 🔧 [AI Integration Guide](docs/AI_INTEGRATION.md) - Complete technical documentation
- 🏗️ [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md) - Architecture overview

## 🎮 Controls

### General
- **Click slime** - Select & open chat (deselect with click away/ESC)
- **Click slime again** - Show/hide menu (🎨 ❌)
- **Click background** - Deselect slime

### When Slime Selected (Chat Mode)
- **Chat box appears** - Type and press Enter to chat
- **ESC or ✕** - Deselect slime
- **Keyboard types** - Arrow keys and Space type in chat

### When NO Slime Selected (Free Control Mode)
- **Arrow keys** - Move any slime left/right
- **Space** - Make slime jump
- **Keyboard controls** - Directly control slime movement

### Menu Options (click slime twice)
- **🎨 Color** - Change slime color (blue, red, green)
- **❌ Remove** - Remove slime (can't remove last one)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **AI**: OpenAI-compatible APIs (DeepSeek, OpenAI, custom)
- **State**: React Context API

## 📝 Scripts

- `yarn dev` - Run development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run linter

## 🔒 Privacy & Security

- API keys stored **locally in your browser only**
- No server-side storage of credentials
- Direct API calls (no proxy)
- You can clear your data anytime

## 🎨 Features in Detail

### Personality System
Each slime gets a random personality that affects their AI responses:
- **Playful** - Fun-loving and adventurous
- **Shy** - Timid and speaks softly
- **Energetic** - Super enthusiastic
- **Calm** - Peaceful and tranquil
- **Curious** - Loves to explore and ask questions
- **Sleepy** - Drowsy and relaxed

### AI Providers
- **DeepSeek** (recommended) - ~$0.01 per 100 conversations
- **OpenAI** - GPT-3.5 or GPT-4
- **Custom** - Any OpenAI-compatible endpoint

### Dynamic Responses
AI considers:
- Slime's current activity (jumping, sleeping, walking)
- Slime's personality traits
- Conversation context
- Your message content

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- Slime sprites and assets
- Next.js and React teams
- OpenAI and DeepSeek for AI capabilities

---

**Made with ❤️ for cute slimes everywhere!** 🟢🔴🟡
