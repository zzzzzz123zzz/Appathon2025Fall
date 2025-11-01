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
 * Comprehensive extraction rules prompt (tailored for patient free-text)
 * Extends your original scope while remaining deterministic and JSON-only.
 */
const EXTRACTION_RULES = `
EXTRACTION RULES (READ CAREFULLY):

GENERAL PRINCIPLES
- Extract ONLY what the user explicitly states or clearly implies with unambiguous wording.
- Prefer standard medical terms; normalize slang to common terms (e.g., "tummy ache" → "abdominal pain").
- Use ISO-like normalization where applicable (units, dates, frequencies).
- Respect negation (e.g., "no fever") and uncertainty (e.g., "maybe strep"); never invent.
- If a field is unknown or not stated, omit that field (do NOT fabricate).
- Arrays must be present even if empty: use [].
- Return a single, valid, minified JSON object conforming to the SCHEMA below. No extra text.

---------------------------------------
1) SYMPTOMS
---------------------------------------
For each symptom explicitly stated:
- name: string (normalized medical term, lowercase except proper nouns)
- duration: string ONLY if user gives a concrete time (normalize; see DURATION RULES)
- degree: one of [mild, moderate, severe, worsening, improving] (MAP below)
- frequency: string if stated (e.g., "daily", "2-3 times/day", "intermittent")
- onset: string if stated (e.g., "sudden", "gradual", "since Monday")
- triggers: string[] of concrete triggers (e.g., "after meals", "exercise", "pollen")
- relievers: string[] of concrete alleviators (e.g., "ibuprofen", "rest", "ice")
- location: string if a body location is stated (e.g., "lower back", "left knee")
- associatedSymptoms: string[] for symptoms the user links (e.g., "nausea", "vomiting")
- notes: string for short specific details (avoid prose; e.g., "worse at night")

DEGREE MAPPING (pick the strongest applicable once):
- mild = "slight", "a little", "small", "light", "manageable"
- moderate = "noticeable", "somewhat", "quite", "more than usual"
- severe = "extreme", "very bad", "intense", "unbearable", "excruciating"
- worsening = "getting worse", "worse than before", "progressively worse"
- improving = "getting better", "less than before", "easing", "subsiding"

EXCLUSIONS:
- If duration/frequency/degree not stated, omit those fields for that symptom.
- Do not list a symptom in \\"Symptoms\\" if it is clearly negated (see NEGATION RULES).
  Negated mentions go to \\"negations.symptomsNotPresent\\".

---------------------------------------
2) MOODS
---------------------------------------
Capture psychological state when present:
- overall: one of [positive, neutral, negative] based on overall tone THIS ENTRY ONLY.
- score: integer 1–10 if the user provides a scale; if not explicitly present, OMIT.
- emotions: string[] normalized (e.g., "anxious", "sad", "irritable", "hopeful")
- stressors: string[] (e.g., "work", "school", "family conflict") if explicitly stated
- sleepImpact: string (e.g., "trouble falling asleep") if user ties mood ↔ sleep
- notes: short details if needed

DE-DUPING: prefer adjectives (“anxious”) over nouns (“anxiety”). No duplicates.

---------------------------------------
3) MEDICATIONS & SUBSTANCES
---------------------------------------
For each medication/supplement/substance explicitly mentioned:
- name: string (normalized generic if easy, else as stated)
- dosage: string if stated (e.g., "400 mg", "2 puffs", "10 mL")
- route: string if stated (e.g., "oral", "inhaled", "topical")
- frequency: string if stated (e.g., "daily", "twice a day", "PRN", "at night")
- taken: true = currently taking; false = explicitly stopped; omit if unclear
- timing: string if stated (e.g., "morning", "with meals", "bedtime")
- indication: string if user states why (e.g., "for back pain")
- startDate: string if given (e.g., "since June", "3 days ago")
- sideEffects: string[] if explicitly linked (e.g., "nausea", "drowsiness")

Include nicotine, alcohol, cannabis, recreational substances if explicitly mentioned as “substances” with same shape, using \\"route\\" and \\"frequency\\".

---------------------------------------
4) OTHER HEALTH CHALLENGES / CONDITIONS
---------------------------------------
Chronic or ongoing items (do NOT repeat symptoms already listed unless that is the condition name):
- conditions: string[] (e.g., "asthma", "type 2 diabetes", "GERD")
- managementConcerns: string[] (explicit concerns like adherence, cost, monitoring)
- allergies: array of { substance: string, reaction: string (if stated) }
- pastProcedures: string[] if explicitly mentioned (“appendectomy”, “ACL repair”)

---------------------------------------
5) VITALS / MEASUREMENTS (if stated)
---------------------------------------
- vitals: array of { type: one of [temperature, heart_rate, blood_pressure, respirations, oxygen_saturation, weight, height, blood_glucose], value: string (normalized), unit: string (normalized), timing: string if stated }
  Examples:
  - blood_pressure: value "120/80", unit "mmHg"
  - temperature: value "101.3", unit "F" (or "C")
  - blood_glucose: value "145", unit "mg/dL", timing "fasting" if stated

---------------------------------------
6) LIFESTYLE / CONTEXT
---------------------------------------
- sleep: { duration: string if stated (e.g., "6 hours"), quality: string if stated ("poor"/"fragmented"), issues: string[] (e.g., "insomnia", "snoring") }
- diet: { patterns: string[] ("low carb", "high salt"), recentChanges: string[] }
- activity: { level: string if stated ("sedentary", "active"), notes: string }
- substances: (see Section 3) but summarize high-level here if helpful
- exposures: string[] (e.g., "sick contacts", "new pet", "travel", "chemical exposure")

---------------------------------------
7) TESTS / CARE / APPOINTMENTS
---------------------------------------
- testsMentioned: array of { name: string, status: one of [done, ordered, planned], result: string if stated (“negative”, “positive”, value string), timing: string }
- appointments: array of { type: string (“PCP”, “dermatology”), date: string if stated, purpose: string }
- careActionsRequested: string[] (e.g., "refill request", "work note", "imaging referral")
- priorDiagnosesThisEpisode: string[] (e.g., "strep throat last week") if stated

---------------------------------------
8) NEGATIONS & UNCERTAINTY
---------------------------------------
NEGATION RULES:
- Collect clear negatives (e.g., "no fever", "denies chest pain").
- Place negated symptoms in:
  negations: { symptomsNotPresent: string[] }
- Do NOT list negated items under Symptoms.

UNCERTAINTY RULES:
- uncertainty: string[] to capture explicit uncertainty (“maybe strep”, “possible allergy”).
- Do not convert uncertain mentions into confirmed diagnoses or symptoms unless the user also states them as present.

---------------------------------------
9) TEMPORAL & COREFERENCE
---------------------------------------
- Resolve pronouns within the same message only and only when unambiguous.
- Normalize relative time if possible (e.g., "since Monday" → as stated; do not compute calendar dates).
- For recurring patterns, capture frequency (“every morning”, “2–3x/week”).

---------------------------------------
10) RED FLAGS (simple extraction, NOT triage)
---------------------------------------
If explicitly mentioned, copy into:
- redFlags: string[] (e.g., "fainting", "chest pain", "shortness of breath at rest", "blood in stool", "suicidal thoughts")
Do not infer red flags; only record if user states them.

---------------------------------------
11) DEDUP & NORMALIZATION
---------------------------------------
- Merge duplicate symptoms differing only by synonyms; keep one normalized name.
- DURATION RULES: Keep as stated but normalized (e.g., "3 days", "2 weeks", "since yesterday").
- UNITS: Normalize common units (mg, mL, °F/°C, mmHg, bpm, %).
- CASE: Use lowercase for keys and string values, except proper nouns and drug brand names as stated.

---------------------------------------
12) OUTPUT SCHEMA (STRICT)
---------------------------------------
{
  "symptoms": [
    {
      "name": string,
      "duration": string?,
      "degree": "mild" | "moderate" | "severe" | "worsening" | "improving"?,
      "frequency": string?,
      "onset": string?,
      "triggers": string[]?,
      "relievers": string[]?,
      "location": string?,
      "associatedSymptoms": string[]?,
      "notes": string?
    }
  ],
  "mood": {
    "overall": "positive" | "neutral" | "negative"?,
    "score": number?,          // 1..10 if explicitly stated
    "emotions": string[]?,
    "stressors": string[]?,
    "sleepImpact": string?,
    "notes": string?
  },
  "medications": [
    {
      "name": string,
      "dosage": string?,
      "route": string?,
      "frequency": string?,
      "taken": true | false?,   // omit if unclear
      "timing": string?,
      "indication": string?,
      "startDate": string?,
      "sideEffects": string[]?
    }
  ],
  "conditions": {
    "chronic": string[],        // e.g., ["asthma", "type 2 diabetes"]
    "managementConcerns": string[]
  },
  "allergies": [
    { "substance": string, "reaction": string? }
  ],
  "vitals": [
    { "type": string, "value": string, "unit": string, "timing": string? }
  ],
  "lifestyle": {
    "sleep": { "duration": string?, "quality": string?, "issues": string[]? },
    "diet": { "patterns": string[]?, "recentChanges": string[]? },
    "activity": { "level": string?, "notes": string? },
    "exposures": string[]?
  },
  "tests": [
    { "name": string, "status": "done" | "ordered" | "planned", "result": string?, "timing": string? }
  ],
  "appointments": [
    { "type": string, "date": string?, "purpose": string? }
  ],
  "careActionsRequested": string[],
  "priorDiagnosesThisEpisode": string[],
  "negations": {
    "symptomsNotPresent": string[]
  },
  "uncertainty": string[],
  "redFlags": string[],
  "notes": string[]            // misc short factual notes that don’t fit elsewhere
}

---------------------------------------
13) MINI EXAMPLE (FOR VALIDATION)
---------------------------------------
USER: "I've had a pounding headache for 3 days, worse at night. Ibuprofen helps a bit. No fever. I feel anxious. I take sertraline 50 mg daily. BP yesterday was 130/85."

OUTPUT:
{
  "symptoms":[
    {
      "name":"headache",
      "duration":"3 days",
      "degree":"moderate",
      "frequency":"worse at night",
      "relievers":["ibuprofen"],
      "notes":"pounding"
    }
  ],
  "mood":{
    "overall":"neutral",
    "emotions":["anxious"]
  },
  "medications":[
    {"name":"sertraline","dosage":"50 mg","frequency":"daily","taken":true}
  ],
  "conditions":{"chronic":[],"managementConcerns":[]},
  "allergies":[],
  "vitals":[
    {"type":"blood_pressure","value":"130/85","unit":"mmHg","timing":"yesterday"}
  ],
  "lifestyle":{"sleep":{"issues":["worse at night"]},"diet":{},"activity":{},"exposures":[]},
  "tests":[],
  "appointments":[],
  "careActionsRequested":[],
  "priorDiagnosesThisEpisode":[],
  "negations":{"symptomsNotPresent":["fever"]},
  "uncertainty":[],
  "redFlags":[],
  "notes":[]
}

IMPORTANT:
- Output must be valid JSON and match the SCHEMA.
- Do not include any explanations, headings, or commentary—JSON only.
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
  const { symptoms, moods, medications } = extractedData;

  let response = `Thanks for sharing, ${userName}. `;

  if (symptoms.length > 0) {
    response += `I've noted your symptoms: ${symptoms.map(s => s.name).join(', ')}. `;
  }

  if (moods.score <= 4) {
    response += "I'm sorry you're going through a tough time. ";
  } else if (moods.score >= 7) {
    response += "It's great to hear you're feeling well! ";
  }

  if (medications.length > 0) {
    response += `I've recorded your medications. `;
  }

  response += "Keep tracking your health, and I'll help you monitor your progress.";

  return response;
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
