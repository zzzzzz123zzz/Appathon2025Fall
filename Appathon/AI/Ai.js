/**
 * app.js - Core Business Logic Module
 *
 * This module contains the main business logic for the health diary application.
 * It orchestrates the extraction, storage, and summarization of health data.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import { db } from '../config/firebase.js';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

/**
 * Shared schema for extracted health data
 */
export const ExtractedHealthDataSchema = z.object({
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
 * Initialize Firebase Genkit with Google AI (singleton pattern)
 */
let aiInstance = null;

function getAIInstance() {
  if (!aiInstance) {
    aiInstance = genkit({
      plugins: [
        googleAI({
          apiKey: process.env.GOOGLE_AI_API_KEY,
        }),
      ],
      model: 'googleai/gemini-1.5-flash',
    });
  }
  return aiInstance;
}

/**
 * Common extraction rules prompt
 */
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
 * Core AI extraction function
 *
 * @param {string} prompt - The complete prompt for the AI
 * @param {number} maxTokens - Maximum output tokens
 * @returns {Promise<Object>} Extracted health data
 */
async function extractWithAI(prompt, maxTokens = 1024) {
  const ai = getAIInstance();

  try {
    const result = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      config: {
        temperature: 0.1,
        maxOutputTokens: maxTokens,
      },
      prompt,
      output: {
        format: 'json',
        schema: ExtractedHealthDataSchema,
      },
    });

    return result.output;
  } catch (error) {
    console.error('AI extraction error:', error);
    throw new Error(`AI extraction failed: ${error.message}`);
  }
}

/**
 * Process a single diary entry and extract health data
 *
 * @param {string} userId - User's ID
 * @param {string} userName - User's name
 * @param {string} message - User's diary entry
 * @returns {Promise<Object>} Result with AI response, extracted data, and entry ID
 */
export async function processDiaryEntry(userId, userName, message) {
  try {
    console.log(`Processing diary entry for user ${userId}...`);

    // Extract health data from the message
    const prompt = `
You are a medical information extractor.
Analyze this user's health diary entry and extract structured information.

USER ENTRY:
"${message}"

${EXTRACTION_RULES}
`;

    const extractedData = await extractWithAI(prompt);

    // Save to Firestore
    const entryDoc = await addDoc(collection(db, 'entries'), {
      userId,
      userName,
      userMessage: message,
      extractedData,
      timestamp: new Date().toISOString(),
      createdAt: new Date(),
    });

    // Generate a friendly AI response
    const aiResponse = generateFriendlyResponse(extractedData, userName);

    console.log(`✅ Diary entry processed: ${entryDoc.id}`);

    return {
      success: true,
      entryId: entryDoc.id,
      aiResponse,
      extracted: extractedData,
    };

  } catch (error) {
    console.error('Error processing diary entry:', error);
    throw error;
  }
}

/**
 * Get recent entries for a user
 *
 * @param {string} userId - User's ID
 * @param {number} limitCount - Maximum number of entries to retrieve
 * @returns {Promise<Array>} Array of entry objects
 */
export async function getRecentEntries(userId, limitCount = 10) {
  try {
    const entriesRef = collection(db, 'entries');
    const q = query(
      entriesRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching entries:', error);
    throw error;
  }
}

/**
 * Generate a weekly summary for a user
 *
 * @param {string} userId - User's ID
 * @returns {Promise<Object>} Weekly summary with aggregated health data
 */
export async function generateWeeklySummary(userId) {
  try {
    console.log(`Generating weekly summary for user ${userId}...`);

    // Get entries from the last 7 days
    const entries = await getRecentEntries(userId, 21); // ~3 entries per day

    if (entries.length === 0) {
      return {
        summary: "No entries found for the past week.",
        extractedData: {
          symptoms: [],
          moods: { overall: 'neutral', score: 5, emotions: [] },
          medications: [],
          otherHealthChallenges: [],
        },
      };
    }

    // Combine all messages
    const messagesText = entries
      .map((entry, idx) => `Entry ${idx + 1}: ${entry.userMessage || entry.message}`)
      .join('\n\n');

    // Extract aggregated data
    const prompt = `
Analyze these health diary entries from the past 7 days and extract aggregated structured information.

DIARY ENTRIES:
${messagesText}

${EXTRACTION_RULES}

Note: Aggregate information from all entries. For symptoms, note frequency or progression if mentioned multiple times.
`;

    const extractedData = await extractWithAI(prompt, 2048);

    // Generate human-readable summary
    const summary = generateWeeklySummaryText(extractedData, entries.length);

    console.log('✅ Weekly summary generated');

    return {
      summary,
      extractedData,
      entriesAnalyzed: entries.length,
      generatedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error('Error generating weekly summary:', error);
    throw error;
  }
}

/**
 * Generate a friendly response based on extracted data
 *
 * @param {Object} extractedData - Extracted health data
 * @param {string} userName - User's name
 * @returns {string} Friendly AI response
 */
function generateFriendlyResponse(extractedData, userName) {
  const { symptoms, moods, medications, otherHealthChallenges } = extractedData;

  let response = `Thanks for sharing, ${userName}. `;

  // Acknowledge symptoms with specific advice
  if (symptoms.length > 0) {
    response += `I've noted your symptoms: ${symptoms.map(s => s.name).join(', ')}. `;

    // Provide severity-based advice
    const severeSymptoms = symptoms.filter(s => s.degree === 'severe' || s.degree === 'worsening');
    if (severeSymptoms.length > 0) {
      response += `I'm concerned about your ${severeSymptoms.map(s => s.name).join(' and ')}. If these symptoms persist or worsen, please consult a healthcare provider. `;
    }

    // Symptom-specific advice
    symptoms.forEach(symptom => {
      const advice = getSymptomAdvice(symptom.name, symptom.degree);
      if (advice) {
        response += advice + ' ';
      }
    });
  }

  // Mood-based responses with actionable advice
  if (moods.score <= 4) {
    response += "I'm sorry you're going through a tough time. ";

    // Specific advice for low mood
    if (moods.emotions.includes('anxious') || moods.emotions.includes('stressed')) {
      response += "Try taking deep breaths, going for a short walk, or talking to someone you trust. ";
    }
    if (moods.emotions.includes('sad') || moods.emotions.includes('depressed')) {
      response += "Remember that it's okay to feel this way. Consider reaching out to a mental health professional if these feelings persist. ";
    }
    response += "Small steps like getting fresh air, staying hydrated, or doing something you enjoy can help. ";
  } else if (moods.score >= 7) {
    response += "It's great to hear you're feeling well! Keep up whatever positive habits are working for you. ";
  } else {
    response += "Your mood seems balanced today. ";
  }

  // Medication management advice
  if (medications.length > 0) {
    response += `I've recorded your medications: ${medications.map(m => m.name).join(', ')}. `;
    response += "Make sure to take them as prescribed and track any side effects you notice. ";

    const stoppedMeds = medications.filter(m => m.taken === false);
    if (stoppedMeds.length > 0) {
      response += "If you've stopped any medications, please discuss this with your doctor. ";
    }
  }

  // Address chronic conditions
  if (otherHealthChallenges && otherHealthChallenges.length > 0) {
    response += `I see you're managing ${otherHealthChallenges.join(' and ')}. Stay consistent with your treatment plan and regular check-ups. `;
  }

  response += "Keep tracking your health, and I'll help you monitor your progress and identify patterns.";

  return response;
}

/**
 * Get specific advice for common symptoms
 *
 * @param {string} symptomName - Name of the symptom
 * @param {string} degree - Severity of the symptom
 * @returns {string|null} Advice string or null
 */
function getSymptomAdvice(symptomName, degree) {
  const symptomAdviceMap = {
    'headache': 'For headaches, try resting in a quiet, dark room and staying hydrated.',
    'nausea': 'For nausea, try eating small, bland meals and avoid strong smells.',
    'fatigue': 'For fatigue, ensure you\'re getting enough sleep and consider checking your iron levels.',
    'dizziness': 'For dizziness, sit or lie down immediately and avoid sudden movements. If it persists, see a doctor.',
    'insomnia': 'For sleep issues, try establishing a consistent bedtime routine and limiting screen time before bed.',
    'anxiety': 'For anxiety, try deep breathing exercises, meditation, or journaling your thoughts.',
    'pain': 'For pain, rest the affected area and consider over-the-counter pain relief if appropriate.',
    'fever': 'For fever, stay hydrated, rest, and monitor your temperature. Seek medical care if it goes above 103°F.',
    'cough': 'For cough, stay hydrated and use a humidifier. See a doctor if it persists beyond a few weeks.',
    'stomach ache': 'For stomach pain, try eating bland foods and staying hydrated. See a doctor if pain is severe.',
  };

  const lowerSymptom = symptomName.toLowerCase();
  for (const [key, advice] of Object.entries(symptomAdviceMap)) {
    if (lowerSymptom.includes(key)) {
      return advice;
    }
  }
  return null;
}

/**
 * Generate human-readable weekly summary text
 *
 * @param {Object} extractedData - Aggregated extracted data
 * @param {number} entryCount - Number of entries analyzed
 * @returns {string} Summary text
 */
function generateWeeklySummaryText(extractedData, entryCount) {
  const { symptoms, moods, medications, otherHealthChallenges } = extractedData;

  let summary = `Weekly Health Summary (${entryCount} entries analyzed)\n\n`;

  if (symptoms.length > 0) {
    summary += `Symptoms:\n`;
    symptoms.forEach(s => {
      summary += `- ${s.name}`;
      if (s.duration) summary += ` (${s.duration})`;
      if (s.degree) summary += ` - ${s.degree}`;
      summary += '\n';
    });
    summary += '\n';
  }

  summary += `Overall Mood: ${moods.overall} (Score: ${moods.score}/10)\n`;
  if (moods.emotions.length > 0) {
    summary += `Emotions: ${moods.emotions.join(', ')}\n`;
  }
  summary += '\n';

  if (medications.length > 0) {
    summary += `Medications:\n`;
    medications.forEach(m => {
      summary += `- ${m.name}`;
      if (m.dosage) summary += ` (${m.dosage})`;
      if (m.time) summary += ` - ${m.time}`;
      summary += '\n';
    });
    summary += '\n';
  }

  if (otherHealthChallenges.length > 0) {
    summary += `Other Health Concerns: ${otherHealthChallenges.join(', ')}\n`;
  }

  return summary;
}

// Export all functions
export default {
  processDiaryEntry,
  getRecentEntries,
  generateWeeklySummary,
  ExtractedHealthDataSchema,
};

// CommonJS compatibility for functions.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    processDiaryEntry,
    getRecentEntries,
    generateWeeklySummary,
    ExtractedHealthDataSchema,
  };
}
