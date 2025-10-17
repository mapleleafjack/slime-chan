# AI Integration Guide

## Overview

Slime-chan now features advanced AI integration that allows your creatures (slimes, mushrooms, etc.) to have intelligent, context-aware conversations! The system is compatible with multiple AI providers including DeepSeek, OpenAI, and any OpenAI-compatible API.

## Features

### 🤖 Multi-Provider Support
- **DeepSeek**: Cost-effective, high-quality responses
- **OpenAI**: GPT-3.5-turbo and GPT-4 support
- **Custom**: Any OpenAI-compatible API endpoint

### 🎭 Personality System
Each creature has a unique personality that influences their responses:
- **Playful**: Fun-loving and ready for adventures
- **Shy**: Timid and speaks softly
- **Energetic**: Full of excitement and bouncy energy
- **Calm**: Peaceful and tranquil
- **Curious**: Inquisitive and loves exploring
- **Sleepy**: Drowsy and relaxed

### 🧠 Context-Aware Responses
The AI considers:
- Current creature activity (walking, jumping, glowing, idle)
- Creature personality and type (slime, mushroom, etc.)
- Creature-specific attributes (slime color, mushroom glow, etc.)
- Conversation history

### 🔄 Automatic Fallback
If AI is not configured or fails, creatures automatically use pre-programmed personality-appropriate phrases (cute Japanese phrases for slimes, mystical nature phrases for mushrooms).

## Setup Guide

### 1. Access Settings
Click the ⚙️ button in the top-left corner to open the debug menu.

### 2. Configure API

#### For DeepSeek (Recommended for cost-effectiveness):
1. Get your API key from [DeepSeek Platform](https://platform.deepseek.com/)
2. Select "DeepSeek" as the provider
3. Paste your API key (starts with `sk-`)
4. Default model: `deepseek-chat`

#### For OpenAI:
1. Get your API key from [OpenAI Platform](https://platform.openai.com/)
2. Select "OpenAI" as the provider
3. Paste your API key
4. Choose model (e.g., `gpt-3.5-turbo` or `gpt-4`)

#### For Custom Providers:
1. Select "Custom" as the provider
2. Enter your base URL (e.g., `https://api.example.com/v1`)
3. Enter your API key
4. Specify the model name

### 3. Test Connection
Click "Test Connection" to verify your configuration works.

### 4. Advanced Settings
Adjust these for different response styles:
- **Temperature** (0-2): Higher = more creative/random
- **Max Tokens** (50-500): Maximum response length

## Usage

### Interactive Mode
1. Click on a creature to select it
2. Type a message in the input box (if the creature has talk capability)
3. The creature will respond using AI (if configured) or fallback phrases

### Autonomous Mode
- Creatures with talk behavior will occasionally speak on their own
- These autonomous thoughts are context-aware based on their current activity and type

## Architecture

### Components

```
context/
  aiConfigContext.tsx      - Manages API configuration and localStorage
  creatureContext.tsx      - Generic creature system with personality support

types/
  creatureTypes.ts         - Type definitions for creatures (Slime, Mushroom, etc.)

utils/
  aiService.ts            - Core AI API integration
  apiUtils.ts             - Backward compatibility (deprecated)

hooks/
  useSlimeAI.ts           - Enhanced with AI response generation

components/
  SlimeGame/
    DebugMenu.tsx         - AI configuration UI
```

### Key Functions

#### `generateSlimeResponse(config, slime, userMessage, personality)`
Generates a response to user input considering:
- Slime's current state
- Personality traits
- User's message

#### `generateAutonomousSpeech(config, slime, personality)`
Creates spontaneous slime thoughts based on context.

#### `testAIConnection(config)`
Validates API configuration.

## Security

- **API keys are stored locally** in your browser's localStorage
- **Keys never leave your device** except to call the configured AI API
- **No server-side storage** of credentials
- Use the "Reset" button to clear stored credentials

## Customization

### Adding New Personalities
Edit `types/creatureTypes.ts`:

```typescript
export type Personality = "playful" | "shy" | "energetic" | "calm" | "curious" | "sleepy" | "yourNewType"
```

Then add description in `utils/aiService.ts`:

```typescript
const PERSONALITY_DESCRIPTIONS: Record<string, string> = {
  yourNewType: "description of the personality traits",
  // ...
}
```

### Modifying System Prompts
Edit `generateSystemPrompt()` in `utils/aiService.ts` to change how the AI perceives the slime's character.

### Adding New Providers
The system works with any OpenAI-compatible API. Simply use "Custom" provider and enter your endpoint details.

## Troubleshooting

### "Connection failed" Error
- Verify your API key is correct
- Check your internet connection
- Ensure the base URL is correct (especially for custom providers)
- Check browser console for detailed error messages

### Responses are too long/short
- Adjust **Max Tokens** in advanced settings
- Modify the system prompt to emphasize brevity

### Responses don't match personality
- Try increasing **Temperature** for more varied responses
- Verify the personality descriptions in the code

### Slimes not responding
- Check if API is configured (green "● Configured" indicator)
- Look for the thinking indicator ("...")
- Check browser console for errors

## Performance Tips

1. **Use DeepSeek** for cost-effective, fast responses
2. **Lower Max Tokens** (100-150) for quicker responses
3. **Disable AI** if you prefer simple phrases (just don't configure an API key)
4. The active slime skips some AI processing to maintain smooth interactions

## API Costs

### DeepSeek (as of 2025)
- Very affordable, typically fractions of a cent per conversation
- ~$0.14 per 1M input tokens
- ~$0.28 per 1M output tokens

### OpenAI
- GPT-3.5-turbo: ~$0.50 per 1M tokens
- GPT-4: ~$30 per 1M tokens (input), ~$60 per 1M tokens (output)

Each slime interaction uses approximately 150-300 tokens.

## Privacy

- All AI processing happens via direct API calls from your browser
- No data is stored on Slime-chan servers
- Your conversations are subject to your chosen AI provider's privacy policy
- You can delete your API key at any time using the "Reset" button

## Future Enhancements

Planned features:
- [ ] Conversation memory (remembering previous interactions)
- [ ] Mood system (affecting personality dynamically)
- [ ] Multi-slime conversations
- [ ] Voice synthesis for responses
- [ ] Custom personality builder
- [ ] Response caching for common phrases

## Contributing

To improve the AI integration:
1. Fork the repository
2. Make your changes to the relevant files
3. Test with multiple providers
4. Submit a pull request

## Support

If you encounter issues:
1. Check this guide first
2. Review browser console for errors
3. Open an issue on GitHub with:
   - Provider you're using
   - Error messages
   - Steps to reproduce

---

Made with ❤️ for Slime-chan
