/**
 * Extract_Data.js - Data Extraction Module (Firebase Genkit Implementation)
 * 
 * PURPOSE: Extract structured health data from user diary entries
 * This module processes individual diary entries or conversations and extracts:
 * - Symptoms (with duration and severity)
 * - Mood and emotions
 * - Medications
 * - Other health challenges
 * 
 * TECHNOLOGY: Firebase Genkit with Google AI (Gemini)
 * MODEL: gemini-1.5-flash
 * 
 * OUTPUT: JSON object matching ExtractedHealthDataSchema
 * 
 * This is the FIRST STEP in the pipeline:
 * User Input → Extract_Data.js → Structured JSON → Firebase
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

/**
 * Schema for extracted health data
 * This represents the structured format for storing user health information
 */
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

/**
 * Initialize Firebase Genkit with Google AI
 */
const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-1.5-flash', // Default model
});

/**
 * Main extraction function using Firebase Genkit
 * 
 * @param {string} userId - The user's ID for database storage
 * @param {string[]} userMessages - Array of recent diary entry messages
 * @param {Object} options - Optional configuration
 * @returns {Promise<Object>} Extracted health data matching ExtractedHealthDataSchema
 */
async function extractHealthData(userId, userMessages, options = {}) {
  const {
    timeframe = '7 days',
    includeMetadata = true,
  } = options;

  // Format messages for the prompt
  const messagesText = userMessages.map((msg, idx) => 
    `Entry ${idx + 1}: ${msg}`
  ).join('\n\n');

  // Build the extraction prompt
  const extractionPrompt = `
Analyze these health diary entries from the past ${timeframe} and extract structured health information.

DIARY ENTRIES:
${messagesText}

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

  try {
    // Use Genkit's generate function with structured output
    const result = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      config: {
        temperature: 0.1, // Low temperature for consistent structured extraction
        maxOutputTokens: 1024,
      },
      prompt: extractionPrompt,
      output: {
        format: 'json',
        schema: ExtractedHealthDataSchema,
      },
    });

    // Genkit returns structured output that matches the schema
    const extractedData = result.output;

    // Add metadata if requested
    if (includeMetadata) {
      return {
        userId,
        extractedAt: new Date().toISOString(),
        timeframe,
        entriesAnalyzed: userMessages.length,
        data: extractedData,
      };
    }

    return extractedData;

  } catch (error) {
    console.error('Error extracting health data:', error);
    throw new Error(`Health data extraction failed: ${error.message}`);
  }
}

/**
 * Extract data from a single diary entry (for real-time processing)
 * 
 * @param {string} userId - The user's ID
 * @param {string} message - Single diary entry message
 * @returns {Promise<Object>} Extracted health data
 */
async function extractFromSingleEntry(userId, message) {
  return extractHealthData(userId, [message], { 
    timeframe: 'current entry',
    includeMetadata: true 
  });
}

/**
 * Extract data from multiple entries (for weekly summaries)
 * 
 * @param {string} userId - The user's ID
 * @param {Array<Object>} entries - Array of entry objects from Firebase
 * @returns {Promise<Object>} Aggregated extracted health data
 */
async function extractFromMultipleEntries(userId, entries) {
  // Extract just the messages from entry objects
  const messages = entries.map(entry => entry.userMessage || entry.message);
  
  return extractHealthData(userId, messages, {
    timeframe: `${entries.length} entries`,
    includeMetadata: true
  });
}

/**
 * Validate extracted data against schema
 * 
 * @param {Object} data - Data to validate
 * @returns {boolean} True if valid, throws error if invalid
 */
function validateExtractedData(data) {
  try {
    ExtractedHealthDataSchema.parse(data);
    return true;
  } catch (error) {
    console.error('Validation error:', error.errors);
    throw new Error('Extracted data does not match schema');
  }
}

// Export functions and schema
export {
  extractHealthData,
  extractFromSingleEntry,
  extractFromMultipleEntries,
  validateExtractedData,
  ExtractedHealthDataSchema,
};

// Default export for CommonJS compatibility
export default {
  extractHealthData,
  extractFromSingleEntry,
  extractFromMultipleEntries,
  validateExtractedData,
  ExtractedHealthDataSchema,
};