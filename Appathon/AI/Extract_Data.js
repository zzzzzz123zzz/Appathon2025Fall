/**
 * Extract_Data.js - Health Data Extraction using Firebase Genkit
 * 
 * Extracts structured health information from user diary entries
 * Uses: Firebase Genkit + Google AI (Gemini)
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';  // ✅ Correct package name
import { z } from 'zod';
import { db } from '../config/firebase.js';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

/**
 * Output schema for extracted health data
 */
const OutputSchema = z.object({
  symptoms: z
    .array(
      z.object({
        name: z.string().describe("The name of the symptom (e.g., 'nausea', 'headache', 'fatigue')"),
        duration: z.string().optional().describe("Duration of the symptom (e.g., '6 days', 'a few weeks')"),
        degree: z.enum(['mild', 'moderate', 'severe', 'worsening', 'improving']).optional()
          .describe("Severity or trend of the symptom"),
      })
    )
    .describe("List of symptoms the user reports"),

  moods: z.object({
    overall: z
      .enum(['positive', 'neutral', 'negative'])
      .describe("Overall sentiment inferred from user's tone"),
    score: z
      .number()
      .min(1)
      .max(10)
      .describe("Mood score (1 = very negative, 10 = very positive)"),
    emotions: z
      .array(z.string())
      .describe("List of specific emotions (e.g., 'happy', 'sad', 'anxious')"),
  })
  .describe("Structured summary of emotional tone and mood"),

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
    .describe("List of medications mentioned"),

  otherHealthChallenges: z
    .array(z.string())
    .optional()
    .default([])
    .describe("Chronic conditions or ongoing health concerns"),
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
});

/**
 * Extract health data from user input
 * 
 * @param {string} userId - User's ID
 * @param {string} userInput - User's diary entry text
 * @returns {Promise<Object>} Extracted health data as JSON
 */
async function extractFromUserInput(userId, userInput) {
  try {
    console.log('🔍 Extracting health data from user input...');
    
    const result = await ai.generate({
      model: 'googleai/gemini-1.5-flash',  // ✅ Correct model format
      config: {
        temperature: 0.1,  // Low temperature for consistent extraction
        maxOutputTokens: 1024,
      },
      prompt: `
You are a medical information extractor.
Analyze this user's health diary entry and extract structured information.

USER ENTRY:
"${userInput}"

EXTRACTION RULES:

1. **Symptoms**
   - name → the symptom (e.g., "nausea", "fatigue")
   - duration → only if specific time mentioned (e.g., "3 days", "two weeks")
   - degree → choose one: mild, moderate, severe, worsening, improving
     * mild = slight, minor, small, light
     * moderate = noticeable, somewhat, quite
     * severe = extreme, very bad, intense
     * worsening = "getting worse", "worse than before"
     * improving = "getting better", "less than before"
   - Omit fields if not mentioned

2. **Moods**
   - overall → positive, neutral, or negative (based on tone)
   - score → 1-10 (1 = most negative, 10 = most positive)
   - emotions → specific emotions mentioned or inferred (e.g., ["anxious", "tired"])
   - Avoid duplicates (use "anxious" not both "anxiety" and "anxious")

3. **Medications**
   - name → medication name (e.g., "melatonin", "ibuprofen")
   - dosage → amount if mentioned (e.g., "1 mg", "two tablets")
   - taken → 
     * true = currently taking ("I take", "I'm taking")
     * false = stopped taking ("I used to take", "I don't take anymore")
     * omit if unclear
   - time → when taken (e.g., "at night", "in the morning")

4. **Other Health Challenges**
   - Chronic conditions (e.g., "diabetes", "asthma")
   - Ongoing health concerns not captured as symptoms
   - Do NOT repeat symptoms already listed

Return valid JSON matching the schema.
Use empty arrays [] if no data found.
Be accurate and concise.
      `,
      output: {
        format: 'json',
        schema: OutputSchema,
      },
    });

    console.log('✅ Extraction successful!');
    return {
      userId,
      timestamp: new Date().toISOString(),
      userInput,
      extractedData: result.output,
    };

  } catch (error) {
    console.error('❌ Extraction failed:', error);
    throw new Error(`Failed to extract health data: ${error.message}`);
  }
}

/**
 * Extract data from multiple entries (for weekly summaries)
 * 
 * @param {string} userId - User's ID
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {Promise<Object>} Aggregated extracted health data
 */
async function extractFromMultipleEntries(userId, days = 7) {
  try {
    console.log(`🔍 Fetching last ${days} days of entries for user ${userId}...`);
    
    // Get user's entries from Firestore
    const entriesRef = collection(db, 'entries');
    const q = query(
      entriesRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(days * 3)  // Assuming ~3 entries per day max
    );
    
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => doc.data().userMessage || doc.data().message);
    
    if (entries.length === 0) {
      console.log('⚠️ No entries found');
      return {
        userId,
        timestamp: new Date().toISOString(),
        entriesAnalyzed: 0,
        extractedData: {
          symptoms: [],
          moods: { overall: 'neutral', score: 5, emotions: [] },
          medications: [],
          otherHealthChallenges: [],
        },
      };
    }

    console.log(`📝 Found ${entries.length} entries`);
    
    // Combine all entries
    const combinedText = entries.map((entry, idx) => 
      `Entry ${idx + 1}: ${entry}`
    ).join('\n\n');

    const result = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      config: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
      prompt: `
You are a medical information extractor.
Analyze these health diary entries from the past ${days} days and extract aggregated structured information.

USER ENTRIES:
${combinedText}

EXTRACTION RULES:

1. **Symptoms**
   - List ALL symptoms mentioned across all entries
   - If a symptom appears multiple times, note its frequency or progression
   - Include duration and degree if mentioned

2. **Moods**
   - overall → aggregate mood across ALL entries
   - score → average mood score (1-10)
   - emotions → all emotions mentioned across entries (no duplicates)

3. **Medications**
   - List all medications mentioned
   - Note if user is currently taking them or stopped

4. **Other Health Challenges**
   - List chronic conditions or ongoing concerns
   - Avoid repeating symptoms

Return valid JSON matching the schema.
Aggregate information from all entries.
Use empty arrays [] if no data found.
      `,
      output: {
        format: 'json',
        schema: OutputSchema,
      },
    });

    console.log('✅ Multiple entries extracted successfully!');
    return {
      userId,
      timestamp: new Date().toISOString(),
      entriesAnalyzed: entries.length,
      extractedData: result.output,
    };

  } catch (error) {
    console.error('❌ Multi-entry extraction failed:', error);
    throw new Error(`Failed to extract from multiple entries: ${error.message}`);
  }
}

/**
 * Save extracted data to Firestore
 * 
 * @param {Object} extractedResult - Result from extraction function
 * @returns {Promise<string>} Document ID
 */
async function saveExtractedData(extractedResult) {
  try {
    console.log('💾 Saving extracted data to Firestore...');
    
    const docRef = await addDoc(collection(db, 'extractedHealthData'), {
      ...extractedResult,
      createdAt: new Date().toISOString(),
    });
    
    console.log(`✅ Saved with ID: ${docRef.id}`);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Failed to save:', error);
    throw new Error(`Failed to save extracted data: ${error.message}`);
  }
}

/**
 * Complete pipeline: Extract and save
 * 
 * @param {string} userId - User's ID
 * @param {string} userInput - User's diary entry
 * @returns {Promise<Object>} Result with extracted data and document ID
 */
async function extractAndSave(userId, userInput) {
  // Extract data
  const extracted = await extractFromUserInput(userId, userInput);
  
  // Save to Firestore
  const docId = await saveExtractedData(extracted);
  
  return {
    success: true,
    docId,
    extractedData: extracted.extractedData,
  };
}

// Export functions
export {
  extractFromUserInput,
  extractFromMultipleEntries,
  saveExtractedData,
  extractAndSave,
  OutputSchema,
};

// Default export
export default {
  extractFromUserInput,
  extractFromMultipleEntries,
  saveExtractedData,
  extractAndSave,
};