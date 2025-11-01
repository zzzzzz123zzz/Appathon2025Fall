// Example API Keys Configuration
//
// SETUP INSTRUCTIONS:
// 1. Copy this file to: config/apiKeys.js
// 2. Replace the placeholder values with your actual API keys
// 3. NEVER commit apiKeys.js to git (it's in .gitignore)

// OpenAI API Key for Whisper (Speech-to-Text)
// Get your key from: https://platform.openai.com/api-keys
export const OPENAI_API_KEY = 'sk-your-openai-api-key-here';

// Optional: Other API keys you might need
export const GOOGLE_CLOUD_API_KEY = 'your-google-cloud-key-here';
export const AZURE_SPEECH_KEY = 'your-azure-speech-key-here';

// AssemblyAI API Key for Speech-to-Text (FREE - 5 hours/month)
// Get your key from: https://www.assemblyai.com/
export const ASSEMBLYAI_API_KEY = '022b81930c464beeb8da87a6b1c40940';

// Google AI API Key for Gemini (FREE - generous limits)
// Get your key from: https://aistudio.google.com/app/apikey
export const GOOGLE_AI_API_KEY = 'AIzaSyDDYJqs6JxEIaArgE3GRBRiOpA6B9CWNfg';

// Usage in your code:
// import { OPENAI_API_KEY } from '../config/apiKeys';
// const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
//   headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
// });
