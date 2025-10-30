# 🎙️ Speech-to-Text Setup Guide

## Current Status

✅ Audio recording is working
✅ Detailed logging is enabled
⚠️ Currently using MOCK transcriptions (returns random test phrases)

To enable **real transcription**, follow the steps below.

---

## 📊 Check the Logs

When you record audio, you'll now see detailed logs in the console:

```
🎙️ Stopping recording...
📊 Recording Status: {
  uri: "file:///path/to/recording.m4a",
  duration: "3.45s",
  isDoneRecording: true,
  canRecord: false
}
🔄 Starting transcription...
📁 Audio URI: file:///path/to/recording.m4a
📦 Audio file info: { size: "42.35 KB", type: "audio/x-m4a" }
⚠️ Using MOCK transcription (no real API configured)
💡 To enable real transcription, see comments in useSpeechRecognition.js
📝 Mock transcription: I've been feeling a bit anxious lately.
```

These logs help you verify that:
- Audio is being recorded successfully ✅
- File size and format are correct ✅
- Recording duration is captured ✅

---

## 🚀 Enable Real Transcription (OpenAI Whisper)

### Why OpenAI Whisper?

- ✅ **Best accuracy** for speech-to-text
- ✅ **Easy to integrate** (just 1 API call)
- ✅ **Affordable** ($0.006 per minute)
- ✅ **Supports multiple languages**
- ✅ **No training required**

### Step 1: Get OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Click **"Create new secret key"**
4. Copy your API key (starts with `sk-`)
5. **Important:** Add billing info in [Settings → Billing](https://platform.openai.com/settings/organization/billing)

### Step 2: Create API Keys Config File

Create a file: `Appathon/config/apiKeys.js`

```javascript
// Appathon/config/apiKeys.js
export const OPENAI_API_KEY = 'sk-your-actual-api-key-here';
```

⚠️ **Security Note:** This file is gitignored. NEVER commit API keys to git!

### Step 3: Enable Whisper in the Code

Open `Appathon/hooks/useSpeechRecognition.js` and find this section (around line 178):

```javascript
// ============================================================
// OPTION 1: OpenAI Whisper API (RECOMMENDED - Uncomment to use)
// ============================================================
```

**Uncomment all the code** from line 187 to line 214:

```javascript
const OPENAI_API_KEY = require('../config/apiKeys').OPENAI_API_KEY;

const formData = new FormData();
formData.append('file', {
  uri: audioUri,
  type: 'audio/m4a',
  name: 'recording.m4a',
});
formData.append('model', 'whisper-1');

console.log('🚀 Sending to OpenAI Whisper API...');
const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
  },
  body: formData,
});

if (!response.ok) {
  const errorText = await response.text();
  console.error('❌ Whisper API error:', errorText);
  throw new Error(`Whisper API error: ${response.status}`);
}

const data = await response.json();
console.log('✅ Transcription successful:', data.text);
return data.text;
```

### Step 4: Comment Out the Mock Code

Find this section (around line 216) and **comment it out** or delete it:

```javascript
// ============================================================
// OPTION 2: Mock Transcription (CURRENT - For testing)
// ============================================================
// console.log('⚠️ Using MOCK transcription (no real API configured)');
// ... (comment out the entire mock section)
```

### Step 5: Test It

1. **Restart the app** completely (kill and relaunch)
2. Go to the Chat screen
3. Hold the mic button and speak
4. Release the button
5. Check the console logs - you should see:
   ```
   🚀 Sending to OpenAI Whisper API...
   ✅ Transcription successful: [your actual spoken words]
   ```

---

## 🔧 Alternative: Use Firebase AI (Gemini)

If you prefer to use Google's Gemini (via Firebase AI):

### Step 1: Enable Vertex AI API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: `ai-health-journal-60978`
3. Enable **Vertex AI API**
4. Enable **Cloud Speech-to-Text API**

### Step 2: Create a Cloud Function

Create a Firebase Cloud Function that:
1. Receives the audio file URL
2. Downloads the audio
3. Calls Google Cloud Speech-to-Text API
4. Returns the transcription

See the example code in `hooks/useSpeechRecognition.js` around line 125.

---

## 💰 Cost Comparison

### OpenAI Whisper (Recommended)
- **$0.006 per minute** of audio
- Example: 100 minutes = $0.60
- No monthly fees

### Google Cloud Speech-to-Text
- **$0.016 per minute** (standard)
- **$0.024 per minute** (enhanced)
- Free tier: 60 minutes/month

### Azure Speech Service
- **$1.00 per hour** (standard)
- Free tier: 5 hours/month

---

## 🐛 Troubleshooting

### "Cannot read property 'OPENAI_API_KEY'"
- Make sure `config/apiKeys.js` exists and exports the key correctly
- Check that you uncommented `require('../config/apiKeys')`

### "Invalid API key"
- Double-check your API key from OpenAI dashboard
- Make sure there are no extra spaces or quotes
- Verify billing is set up on OpenAI account

### "Network request failed"
- Check your internet connection
- Verify the OpenAI API is accessible (not blocked by firewall)
- Try the request in Postman/curl first

### Audio file is too large
- OpenAI Whisper supports up to 25 MB
- If needed, reduce quality in recording settings
- Current setting: `HIGH_QUALITY` preset

### Getting error 429 (Rate limit)
- You're making too many requests
- OpenAI free tier: 3 requests/minute
- Add retry logic or upgrade your plan

---

## 📝 Next Steps

Once transcription is working:

1. ✅ Test with various accents and speech patterns
2. ✅ Add language detection (Whisper auto-detects)
3. ✅ Implement retry logic for failed transcriptions
4. ✅ Cache transcriptions locally for offline access
5. ✅ Add confidence scores to transcriptions
6. ✅ Implement speaker diarization (who said what)

---

## 🔒 Security Best Practices

1. **Never commit API keys** - use `.gitignore`
2. **Use environment variables** in production
3. **Rotate keys regularly** (every 90 days)
4. **Set spending limits** on OpenAI account
5. **Monitor usage** to detect abuse
6. **Use a backend proxy** instead of calling from client (more secure)

---

## 📚 Resources

- [OpenAI Whisper API Docs](https://platform.openai.com/docs/guides/speech-to-text)
- [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text)
- [Firebase AI (Gemini) Docs](https://firebase.google.com/docs/vertex-ai)
- [Expo Audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/)

---

**Current Implementation:** Mock transcriptions (for testing)
**Recommended:** OpenAI Whisper API (best accuracy, easy setup)
**Alternative:** Firebase AI + Cloud Speech-to-Text (if already using Google Cloud)
