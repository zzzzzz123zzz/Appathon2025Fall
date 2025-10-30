import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import 'dotenv/config';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

/*Output schema for the weekly summary page*/
const OutputSchema = z.object({
  symptoms: z
    .array(
      z.object({
        name: z.string().describe("The name of the symptom mentioned by the user (e.g., 'nausea', 'headache', 'fatigue')."),
        duration: z.string().optional().describe("The duration of time the symptom has been experienced (e.g., '6 days', 'a few weeks')."),
        degree: z.string().optional().describe("The severity or intensity of the symptom (e.g., 'mild', 'severe', 'worsening', 'improving')."),
      })
    )
    .describe("A list of symptoms the user reports, including name, duration, and severity if mentioned."),

  moods: z.object({
    overall: z
      .enum(['positive', 'neutral', 'negative'])
      .describe("Overall sentiment inferred from the user's tone and language."),
    score: z
      .number()
      .min(1)
      .max(10)
      .describe("A mood intensity or sentiment score (1 = very negative, 10 = very positive)."),
    emotions: z
      .array(
        z.string().describe("Individual mood descriptors (e.g., 'happy', 'sad', 'anxious', 'stressed').")
      )
      .describe("List of explicit or inferred emotional states."),
  })
  .describe("A structured summary of the user's emotional tone, overall mood, and individual emotions."),

  medications: z
    .array(
      z.object({
        name: z.string().describe("The name of the medication or supplement (e.g., 'melatonin', 'Zoloft')."),
        dosage: z.string().optional().describe("The dosage of the medication if mentioned (e.g., '1 mg', 'two tablets')."),
        taken: z.boolean().optional().describe("Whether the user has indicated they are currently taking this medication."),
        time: z.string().optional().describe("When the user takes the medication (e.g., 'at night', 'in the morning', 'before bed')."),
      })
    )
    .optional()
    .default([])
    .describe("List of medications the user is taking, including name, dosage, whether they’re currently taking it, and the timing of use."),

  otherHealthChallenges: z
    .array(
      z.string().describe("Other health issues, chronic conditions, or health-related concerns not captured as symptoms.")
    )
    .optional()
    .default([])
    .describe("Additional ongoing health-related issues and concerns mentioned by the user."),
});


//Function might taken in parameter (ex. user_id) to retrieve entries from the backend for a certain user
//Return: JSON object matching the OutputSchema
async function extract_data(){
  //Sample user_message_history (message/journal history will be extracted from the database for the past 7 days)
   /*
    Code for retrieving journal entries and messages from the database goes here
  */
  const user_message_history = [];


  const ai = genkit({
    plugins: [googleAI()],
  });
  const response = await ai.generate({
    model: googleAI.model('gemini-2.5-flash'),
    system: `
      You are a medical information extractor.
      Analyze user messages to identify health-related details and emotional cues.
      Follow the output schema EXACTLY.
    `,
    messages: user_message_history,
    prompt: `
      You are an expert medical and emotional data extractor.
      Your task is to read the user's messages and extract structured data according to the schema.
      Be accurate, concise, and consistent.

      Extract the following:

      1. **Symptoms**
        - Include:
          - name → the symptom (e.g., "nausea", "fatigue").
          - duration → only if the user mentions a **specific numeric time** (e.g., "3 days", "two weeks").
          - degree → normalize to one of:
            - "mild" → slight, minor, small, light
            - "moderate" → noticeable, somewhat, quite, "worse than usual" (but not extreme)
            - "severe" → extreme, very bad, intense
            - "worsening" → explicitly "getting worse", "worse than before", "progressively worse"
            - "improving" → explicitly "getting better", "less than before"
        - Do not fabricate data. If no duration or degree is mentioned, omit those fields.

      2. **Moods**
        - Extract a structured emotional profile with:
          - **overall** → the general tone of the user's messages; choose one of:
            - "positive" → optimistic, happy, hopeful
            - "neutral" → balanced, factual, or emotionally flat
            - "negative" → sad, anxious, frustrated, hopeless
          - **score** → a number from 1–10 (1 = most negative, 10 = most positive)
          - **emotions** → array of specific emotions explicitly mentioned or inferred
            (e.g., ["anxious", "tired", "overwhelmed"])
        - Base the overall sentiment and score on the *aggregate tone* across all messages.
        - Avoid duplication (e.g., "anxiety" and "anxious" → just one form: "anxious").

      3. **Medications**
        - Extract any drugs, supplements, or remedies mentioned.
        - For each medication, include:
          - **name** → the medication’s name (e.g., "melatonin", "Zoloft").
          - **dosage** → amount or strength, if mentioned (e.g., "1 mg", "two tablets").
          - **taken** → set this to:
              - true → if the user currently takes it or uses it sometimes ("I take", "I’m taking", "I sometimes take").
              - false → if the user indicates they **no longer take it**, **used to take it**, or **stopped taking it** ("I used to take", "I stopped taking", "I don’t take it anymore").
              - unknown → if it's ambiguous whether the user currently takes it.
          - **time** → when they take it (e.g., "at night", "in the morning", "before bed") if mentioned.
        - Important:
          - Pay attention to **verb tense** and **negation**.
          - Examples:
            - "I take 1 mg of melatonin every night" → { name: "melatonin", dosage: "1 mg", taken: true, time: "at night" }
            - "I used to take 1 mg of melatonin" → { name: "melatonin", dosage: "1 mg", taken: false }
            - "I sometimes take ibuprofen" → { name: "ibuprofen", taken: true }
            - "I don't take my antidepressants anymore" → { name: "antidepressants", taken: false }
            - "I’m not sure if I should take vitamin D" → { name: "vitamin D", taken: "unknown" }

      4. **Other Health Challenges**
      - Include both:
        - Long-term or chronic conditions (e.g., “diabetes”, “asthma”)
        - Health-related concerns, risks, or management issues that are **not direct symptoms**
          (e.g., “I need to monitor my blood sugar”, “I’ve been gaining weight”, “My cholesterol is high”)
      - These represent **general or ongoing health difficulties**, distinct from temporary symptoms.

      Return a valid JSON strictly matching the schema.
      Return arrays for every category (use [] if no data found).
      Avoid prose or explanations — return structured JSON only.
    `,
    output: { schema: OutputSchema },
  });
  
  //Store the json response in the firebase database
  /*
    Code for storing the json response to the database goes here
  */
  return response;
}