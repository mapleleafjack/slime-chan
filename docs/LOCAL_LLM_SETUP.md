# Local LLM Setup

This project now supports running a **tiny local LLM** directly in your Next.js backend using Transformers.js!

## What's Included

- **Model**: LaMini-Flan-T5-783M (~300MB) - A small but capable language model
- **No API Keys Required**: Runs completely locally
- **OpenAI-Compatible API**: Drop-in replacement for external APIs
- **Automatic Model Caching**: Model loads once and stays in memory

## How to Use

### 1. Select Local LLM Provider

In your app's settings/debug menu:
1. Open the AI configuration
2. Select **"Local"** as the AI provider
3. No API key needed!
4. The model will automatically download on first use

### 2. First Run

The first time you use the local LLM:
- The model (~300MB) will download automatically
- This may take 1-2 minutes depending on your connection
- Subsequent uses will be instant (model is cached)

### 3. Performance

- **Response Time**: 2-5 seconds per message (on average hardware)
- **Quality**: Good for simple, creative responses
- **Memory**: ~1GB RAM usage when active

## Alternative Models

You can switch to different models by editing `/app/api/local-llm/route.ts`:

### Even Smaller (Faster, Less Coherent)
```typescript
textGenerator = await pipeline("text-generation", "Xenova/gpt2")
// Size: ~500MB, Faster responses, simpler language
```

### Slightly Larger (Better Quality)
```typescript
textGenerator = await pipeline("text-generation", "Xenova/Phi-1_5")
// Size: ~800MB, Better responses, more coherent
```

### Current Model (Recommended)
```typescript
textGenerator = await pipeline("text-generation", "Xenova/LaMini-Flan-T5-783M")
// Size: ~300MB, Good balance of size and quality
```

## Advantages

✅ **No API Costs**: Completely free to run  
✅ **Privacy**: Data never leaves your machine  
✅ **Offline Support**: Works without internet (after initial download)  
✅ **No Rate Limits**: Use as much as you want  

## Limitations

❌ **Slower**: 2-5 seconds vs <1 second for cloud APIs  
❌ **Less Capable**: Simpler responses than GPT-3.5/GPT-4  
❌ **Resource Usage**: Uses ~1GB RAM  
❌ **First Load**: Initial model download takes time  

## Troubleshooting

### Model Won't Load
- Check your internet connection (first time only)
- Ensure you have at least 2GB free disk space
- Try restarting the dev server

### Slow Responses
- Normal! Local LLMs are slower than cloud APIs
- Consider using a smaller model like `gpt2`
- Reduce `max_tokens` in settings (currently 150)

### Out of Memory
- Close other applications
- Use a smaller model
- Increase Node.js memory limit: `NODE_OPTIONS=--max-old-space-size=4096 npm run dev`

## API Endpoint

The local LLM is accessible at: `http://localhost:3000/api/local-llm`

Health check:
```bash
curl http://localhost:3000/api/local-llm
```

## Technical Details

- **Library**: Transformers.js by Xenova
- **Runtime**: Node.js (Next.js API route)
- **Model Format**: ONNX (optimized for CPU)
- **Caching**: Automatic pipeline caching
- **Compatibility**: OpenAI-compatible API format
