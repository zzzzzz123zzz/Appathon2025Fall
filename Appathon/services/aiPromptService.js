/**
 * aiPromptService.js - AI-Powered Empathetic Prompt Generation
 *
 * Uses Google's Gemini AI to generate context-aware, empathetic follow-up questions
 * based on what the user is writing in their diary.
 */

import { GOOGLE_AI_API_KEY } from '../config/apiKeys';

/**
 * Check if API key is configured
 */
function isAPIKeyConfigured() {
  return GOOGLE_AI_API_KEY && GOOGLE_AI_API_KEY !== 'your-google-ai-api-key-here';
}

/**
 * List available models to debug
 */
async function listAvailableModels() {
  const versions = ['v1beta', 'v1'];

  for (const version of versions) {
    try {
      const url = `https://generativelanguage.googleapis.com/${version}/models?key=${GOOGLE_AI_API_KEY}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        console.log(`📋 Available models for ${version}:`, data.models?.map(m => m.name) || []);
        return data.models || [];
      }
    } catch (error) {
      console.log(`⚠️ Could not list models for ${version}`);
    }
  }
  return [];
}

/**
 * Call Gemini API directly using REST API with v1
 */
async function callGeminiAPI(prompt) {
  if (!isAPIKeyConfigured()) {
    console.warn('⚠️ Google AI API key not configured. Using fallback prompts.');
    return null;
  }

  // First time, list available models for debugging
  if (!callGeminiAPI.modelsListed) {
    await listAvailableModels();
    callGeminiAPI.modelsListed = true;
  }

  // Try different models and API versions (using newer Gemini 2.x models)
  const modelConfigs = [
    { version: 'v1beta', model: 'gemini-2.5-flash' },
    { version: 'v1beta', model: 'gemini-2.0-flash' },
    { version: 'v1beta', model: 'gemini-flash-latest' },
    { version: 'v1beta', model: 'gemini-pro-latest' },
  ];

  for (const config of modelConfigs) {
    try {
      const url = `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${GOOGLE_AI_API_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 100,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`⚠️ Model ${config.model} with ${config.version} failed:`, errorText);
        continue;
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const generatedText = data.candidates[0].content.parts[0].text;
        console.log(`✅ Successfully used model: ${config.model} with API ${config.version}`);
        return generatedText;
      }
    } catch (error) {
      console.log(`⚠️ Error with ${config.model}, trying next...`);
      continue;
    }
  }

  console.error('❌ All model configurations failed');
  return null;
}

/**
 * Fallback empathetic prompts (used when AI is unavailable)
 */
const FALLBACK_PROMPTS = {
  sad: [
    "I hear that you're going through a difficult time. What's been weighing on you most?",
    "It sounds like things have been tough. Would you like to explore what's causing these feelings?",
    "I'm sorry you're feeling this way. What do you think would help you feel a bit better?"
  ],
  anxious: [
    "Anxiety can be overwhelming. What specific worries are on your mind right now?",
    "I understand that feeling. Have you noticed any patterns in when the anxiety shows up?",
    "What situations or thoughts seem to trigger these anxious feelings?"
  ],
  angry: [
    "It's okay to feel angry. What happened that upset you?",
    "Anger is a valid emotion. Can you tell me more about what triggered this?",
    "What would you need to happen to feel better about this situation?"
  ],
  depressed: [
    "Depression can feel so heavy. How long have you been feeling this way?",
    "I'm here to listen. What does the depression feel like for you?",
    "Have you been able to identify anything that makes it feel better or worse?"
  ],
  stressed: [
    "Stress can be exhausting. What's been putting the most pressure on you?",
    "It sounds like you're carrying a lot right now. What feels most overwhelming?",
    "What parts of this stress feel within your control, and what doesn't?"
  ],
  happy: [
    "It's wonderful to hear you're feeling good! What's been bringing you joy?",
    "I love that you're in a positive space. What contributed to this feeling?",
    "Tell me more about what's making you feel this way!"
  ],
  tired: [
    "Fatigue can affect so much. How has your sleep been lately?",
    "Feeling tired all the time is tough. What do you think might be draining your energy?",
    "Have you noticed if anything specific makes you more or less tired?"
  ],
  hopeful: [
    "Hope is such a powerful feeling. What's giving you this sense of optimism?",
    "It's beautiful to feel hopeful. What are you looking forward to?",
    "Tell me more about what's shifted to bring you this hope!"
  ],
  general: [
    "Tell me more about that...",
    "How does that make you feel?",
    "What else comes to mind when you think about this?",
    "Can you explore that feeling a bit deeper?",
    "What's underneath that thought?",
    "I'm listening. What else would you like to share?",
    "How has this been affecting you?",
    "What do you think you need right now?"
  ]
};

/**
 * Detect emotional keywords and context from user's text
 */
function detectEmotionalContext(text) {
  const lowerText = text.toLowerCase();

  const emotionPatterns = {
    sad: /\b(sad|down|depressed|crying|cry|tears|hurt|broken|heartbroken|upset|miserable)\b/i,
    anxious: /\b(anxious|anxiety|worried|worry|nervous|scared|fear|panic|overwhelmed|stress)\b/i,
    angry: /\b(angry|mad|furious|rage|frustrated|annoyed|irritated|pissed)\b/i,
    depressed: /\b(depressed|depression|hopeless|empty|numb|worthless|suicidal)\b/i,
    stressed: /\b(stressed|stress|pressure|overwhelmed|exhausted|burned out|burnout)\b/i,
    happy: /\b(happy|joy|joyful|excited|great|wonderful|amazing|good|better|improving)\b/i,
    tired: /\b(tired|exhausted|fatigued|drained|sleepy|worn out)\b/i,
    hopeful: /\b(hopeful|hope|optimistic|better|improving|progress|positive)\b/i
  };

  for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
    if (pattern.test(lowerText)) {
      return emotion;
    }
  }

  return 'general';
}

/**
 * Generate an empathetic follow-up question using AI
 *
 * @param {string} userText - What the user has written so far
 * @param {Array} previousSegments - Previous text segments (for context)
 * @returns {Promise<string>} An empathetic follow-up question
 */
export async function generateEmpatheticPrompt(userText, previousSegments = []) {
  try {
    // Detect emotional context
    const emotionalContext = detectEmotionalContext(userText);

    // Check if API is configured
    if (!isAPIKeyConfigured()) {
      const prompts = FALLBACK_PROMPTS[emotionalContext] || FALLBACK_PROMPTS.general;
      return prompts[Math.floor(Math.random() * prompts.length)];
    }

    // Build context from previous segments
    let context = '';
    if (previousSegments.length > 0) {
      context = 'Previous conversation:\n' +
        previousSegments
          .filter(s => s.type === 'user')
          .map(s => s.text)
          .slice(-2) // Only last 2 user responses for context
          .join('\n') + '\n\n';
    }

    // Create the prompt for Gemini
    const prompt = `You are an empathetic mental health journaling assistant. The user is writing in their diary and has just written:

${context}Current entry: "${userText}"

Generate ONE short, empathetic follow-up question (maximum 15 words) that:
1. Acknowledges their feelings
2. Encourages them to explore deeper
3. Is warm and supportive
4. Relates specifically to what they just wrote
5. Uses "you" language to be personal

Important:
- Keep it under 15 words
- Make it feel like a caring friend asking
- Don't repeat what they already said
- Be specific to their situation
- End with a question mark

Just respond with the question, nothing else.`;

    console.log('🤖 Generating empathetic prompt with Gemini...');

    const generatedPrompt = await callGeminiAPI(prompt);

    if (!generatedPrompt) {
      console.warn('⚠️ No response from AI, using fallback');
      const prompts = FALLBACK_PROMPTS[emotionalContext] || FALLBACK_PROMPTS.general;
      return prompts[Math.floor(Math.random() * prompts.length)];
    }

    const trimmedPrompt = generatedPrompt.trim();
    console.log('✅ Generated prompt:', trimmedPrompt);

    // Validate the response (fallback if invalid)
    if (trimmedPrompt.length > 150 || !trimmedPrompt.includes('?')) {
      console.warn('⚠️ Invalid AI response, using fallback');
      const prompts = FALLBACK_PROMPTS[emotionalContext] || FALLBACK_PROMPTS.general;
      return prompts[Math.floor(Math.random() * prompts.length)];
    }

    return trimmedPrompt;

  } catch (error) {
    console.error('❌ Error generating AI prompt:', error);

    // Fallback to context-aware predefined prompts
    const emotionalContext = detectEmotionalContext(userText);
    const prompts = FALLBACK_PROMPTS[emotionalContext] || FALLBACK_PROMPTS.general;
    return prompts[Math.floor(Math.random() * prompts.length)];
  }
}

export default {
  generateEmpatheticPrompt,
};
