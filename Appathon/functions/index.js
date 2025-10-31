/**
 * Firebase Cloud Functions for AI Health Diary
 *
 * This file contains Cloud Functions that use Genkit AI for health data extraction.
 * Deploy this with: firebase deploy --only functions
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { genkit } = require('genkit');
const { googleAI } = require('@genkit-ai/googleai');
const { z } = require('zod');

// Initialize Genkit with Google AI
const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-1.5-flash',
});

// Health data extraction schema
const ExtractedHealthDataSchema = z.object({
  symptoms: z
    .array(
      z.object({
        name: z.string().describe("The name of the symptom (e.g., 'nausea', 'headache', 'fatigue')"),
        duration: z.string().optional().describe("How long the symptom has lasted (e.g., '6 days', 'a few weeks')"),
        degree: z.enum(['mild', 'moderate', 'severe', 'worsening', 'improving']).optional()
          .describe("The severity or trend of the symptom"),
      })
    )
    .describe("List of symptoms reported by the user"),

  moods: z.object({
    overall: z
      .enum(['positive', 'neutral', 'negative'])
      .describe("Overall emotional tone"),
    score: z
      .number()
      .min(1)
      .max(10)
      .describe("Mood score (1 = very negative, 10 = very positive)"),
    emotions: z
      .array(z.string())
      .describe("Specific emotions (e.g., 'happy', 'sad', 'anxious', 'stressed')"),
  })
  .describe("Emotional state and mood information"),

  medications: z
    .array(
      z.object({
        name: z.string().describe("Medication name (e.g., 'melatonin', 'Zoloft')"),
        dosage: z.string().optional().describe("Dosage if mentioned (e.g., '1 mg', 'two tablets')"),
        taken: z.boolean().optional().describe("Whether currently taking this medication"),
        time: z.string().optional().describe("When taken (e.g., 'at night', 'in the morning')"),
      })
    )
    .optional()
    .default([])
    .describe("Medications and supplements mentioned"),

  otherHealthChallenges: z
    .array(z.string())
    .optional()
    .default([])
    .describe("Chronic conditions or ongoing health concerns not captured as symptoms"),
});

// Extraction rules prompt
const EXTRACTION_RULES = `
EXTRACTION RULES:

1. **Symptoms**
   - Extract symptom name (use common medical terms)
   - Duration: ONLY if user mentions specific time (e.g., "3 days", "two weeks")
   - Degree: Choose from: mild, moderate, severe, worsening, improving
     * mild = slight, minor, small, light
     * moderate = noticeable, somewhat, quite, "worse than usual" but not extreme
     * severe = extreme, very bad, intense, unbearable
     * worsening = "getting worse", "worse than before"
     * improving = "getting better", "less than before"
   - If duration or degree not mentioned, omit those fields

2. **Moods**
   - Overall: positive, neutral, or negative (based on tone across ALL entries)
   - Score: 1-10 (1 = most negative, 10 = most positive)
   - Emotions: list specific emotions mentioned or clearly inferred
   - Avoid duplicates (use "anxious" not both "anxiety" and "anxious")

3. **Medications**
   - Name: medication or supplement name
   - Dosage: only if explicitly stated
   - Taken:
     * true = currently taking ("I take", "I'm taking")
     * false = stopped taking ("I used to take", "I don't take anymore")
     * omit if unclear
   - Time: when taken if mentioned (morning, night, etc.)

4. **Other Health Challenges**
   - Chronic conditions (diabetes, asthma, etc.)
   - Ongoing health management concerns
   - Do NOT repeat symptoms already listed

IMPORTANT:
- Only extract what is explicitly stated
- Use empty arrays [] for missing data
- Return valid JSON matching the schema
- No explanations or prose
`;

/**
 * Cloud Function: Extract health data from diary entry
 *
 * Called from React Native app to process diary entries with AI
 */
exports.extractHealthData = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { text } = request.data;

  if (!text || typeof text !== 'string') {
    throw new HttpsError('invalid-argument', 'Text is required');
  }

  try {
    console.log('Extracting health data for user:', request.auth.uid);

    const prompt = `
You are a medical information extractor.
Analyze this user's health diary entry and extract structured information.

USER ENTRY:
"${text}"

${EXTRACTION_RULES}
`;

    const result = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      config: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
      prompt,
      output: {
        format: 'json',
        schema: ExtractedHealthDataSchema,
      },
    });

    console.log('Extraction successful');

    return {
      success: true,
      extractedData: result.output,
      extractionMethod: 'genkit-ai',
    };

  } catch (error) {
    console.error('Error extracting health data:', error);
    throw new HttpsError('internal', `Failed to extract health data: ${error.message}`);
  }
});

/**
 * Cloud Function: Generate weekly summary
 *
 * Aggregates entries from the past 7 days
 */
exports.generateWeeklySummary = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { entries } = request.data;

  if (!entries || !Array.isArray(entries)) {
    throw new HttpsError('invalid-argument', 'Entries array is required');
  }

  try {
    // Combine all messages
    const messagesText = entries
      .map((entry, idx) => `Entry ${idx + 1}: ${entry.userMessage || entry.userInput}`)
      .join('\n\n');

    const prompt = `
Analyze these health diary entries from the past 7 days and extract aggregated structured information.

DIARY ENTRIES:
${messagesText}

${EXTRACTION_RULES}

Note: Aggregate information from all entries. For symptoms, note frequency or progression if mentioned multiple times.
`;

    const result = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      config: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
      prompt,
      output: {
        format: 'json',
        schema: ExtractedHealthDataSchema,
      },
    });

    return {
      success: true,
      extractedData: result.output,
      entriesAnalyzed: entries.length,
    };

  } catch (error) {
    console.error('Error generating weekly summary:', error);
    throw new HttpsError('internal', `Failed to generate summary: ${error.message}`);
  }
});
