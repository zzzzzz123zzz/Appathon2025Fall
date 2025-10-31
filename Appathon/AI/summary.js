/**
 * summary.js - Health Summary Generation Module
 *
 * PURPOSE: Generate health summaries from user diary entries
 * This module creates:
 * - Weekly health summaries
 * - Monthly health trends
 * - Custom period summaries
 *
 * TECHNOLOGY: Uses shared functions from app.js
 * MODEL: gemini-1.5-flash (via app.js)
 *
 * OUTPUT: Human-readable summaries and structured health data
 */

import { generateWeeklySummary, getRecentEntries, ExtractedHealthDataSchema } from './app.js';

/**
 * Generate a weekly summary for a user
 * This is a wrapper around generateWeeklySummary from app.js
 *
 * @param {string} userId - User's ID
 * @returns {Promise<Object>} Weekly summary with health data
 */
async function getWeeklySummary(userId) {
  try {
    console.log(`📊 Generating weekly summary for user ${userId}...`);

    // Use the shared generateWeeklySummary function
    const summary = await generateWeeklySummary(userId);

    console.log('✅ Weekly summary generated!');
    return summary;

  } catch (error) {
    console.error('❌ Weekly summary generation failed:', error);
    throw new Error(`Failed to generate weekly summary: ${error.message}`);
  }
}

/**
 * Generate a monthly summary for a user
 *
 * @param {string} userId - User's ID
 * @returns {Promise<Object>} Monthly summary with health data
 */
async function getMonthlySummary(userId) {
  try {
    console.log(`📊 Generating monthly summary for user ${userId}...`);

    // Get entries from the last 30 days (approximately 90 entries)
    const entries = await getRecentEntries(userId, 90);

    if (entries.length === 0) {
      return {
        summary: "No entries found for the past month.",
        extractedData: {
          symptoms: [],
          moods: { overall: 'neutral', score: 5, emotions: [] },
          medications: [],
          otherHealthChallenges: [],
        },
      };
    }

    // Aggregate symptoms, moods, medications across all entries
    const aggregated = aggregateHealthData(entries);

    console.log('✅ Monthly summary generated!');
    return {
      summary: generateMonthlySummaryText(aggregated, entries.length),
      extractedData: aggregated,
      entriesAnalyzed: entries.length,
      generatedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error('❌ Monthly summary generation failed:', error);
    throw new Error(`Failed to generate monthly summary: ${error.message}`);
  }
}

/**
 * Generate a custom period summary
 *
 * @param {string} userId - User's ID
 * @param {number} entryLimit - Maximum number of entries to analyze
 * @returns {Promise<Object>} Custom period summary
 */
async function getCustomSummary(userId, entryLimit = 14) {
  try {
    console.log(`📊 Generating custom summary for user ${userId} (${entryLimit} entries)...`);

    const entries = await getRecentEntries(userId, entryLimit);

    if (entries.length === 0) {
      return {
        summary: "No entries found.",
        extractedData: {
          symptoms: [],
          moods: { overall: 'neutral', score: 5, emotions: [] },
          medications: [],
          otherHealthChallenges: [],
        },
      };
    }

    const aggregated = aggregateHealthData(entries);

    console.log('✅ Custom summary generated!');
    return {
      summary: generateCustomSummaryText(aggregated, entries.length),
      extractedData: aggregated,
      entriesAnalyzed: entries.length,
      generatedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error('❌ Custom summary generation failed:', error);
    throw new Error(`Failed to generate custom summary: ${error.message}`);
  }
}

/**
 * Aggregate health data from multiple entries
 *
 * @param {Array<Object>} entries - Array of entry objects
 * @returns {Object} Aggregated health data
 */
function aggregateHealthData(entries) {
  const symptomsMap = new Map();
  const emotionsSet = new Set();
  const medicationsMap = new Map();
  const challengesSet = new Set();
  let totalMoodScore = 0;
  let moodCount = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  entries.forEach(entry => {
    const data = entry.extractedData;
    if (!data) return;

    // Aggregate symptoms
    data.symptoms?.forEach(symptom => {
      if (symptomsMap.has(symptom.name)) {
        symptomsMap.get(symptom.name).count++;
      } else {
        symptomsMap.set(symptom.name, { ...symptom, count: 1 });
      }
    });

    // Aggregate moods
    if (data.moods) {
      totalMoodScore += data.moods.score;
      moodCount++;
      if (data.moods.overall === 'positive') positiveCount++;
      else if (data.moods.overall === 'negative') negativeCount++;
      else neutralCount++;

      data.moods.emotions?.forEach(emotion => emotionsSet.add(emotion));
    }

    // Aggregate medications
    data.medications?.forEach(med => {
      medicationsMap.set(med.name, med);
    });

    // Aggregate challenges
    data.otherHealthChallenges?.forEach(challenge => challengesSet.add(challenge));
  });

  // Determine overall mood
  let overall = 'neutral';
  if (positiveCount > negativeCount && positiveCount > neutralCount) overall = 'positive';
  else if (negativeCount > positiveCount && negativeCount > neutralCount) overall = 'negative';

  return {
    symptoms: Array.from(symptomsMap.values()),
    moods: {
      overall,
      score: moodCount > 0 ? Math.round(totalMoodScore / moodCount) : 5,
      emotions: Array.from(emotionsSet),
    },
    medications: Array.from(medicationsMap.values()),
    otherHealthChallenges: Array.from(challengesSet),
  };
}

/**
 * Generate monthly summary text
 */
function generateMonthlySummaryText(data, entryCount) {
  let text = `Monthly Health Summary (${entryCount} entries)\n\n`;
  text += formatHealthData(data);
  return text;
}

/**
 * Generate custom summary text
 */
function generateCustomSummaryText(data, entryCount) {
  let text = `Health Summary (${entryCount} entries)\n\n`;
  text += formatHealthData(data);
  return text;
}

/**
 * Format health data for display
 */
function formatHealthData(data) {
  let text = '';

  if (data.symptoms.length > 0) {
    text += 'Symptoms:\n';
    data.symptoms.forEach(s => {
      text += `- ${s.name}`;
      if (s.count) text += ` (mentioned ${s.count}x)`;
      if (s.duration) text += ` - ${s.duration}`;
      if (s.degree) text += ` [${s.degree}]`;
      text += '\n';
    });
    text += '\n';
  }

  text += `Overall Mood: ${data.moods.overall} (Score: ${data.moods.score}/10)\n`;
  if (data.moods.emotions.length > 0) {
    text += `Emotions: ${data.moods.emotions.join(', ')}\n`;
  }
  text += '\n';

  if (data.medications.length > 0) {
    text += 'Medications:\n';
    data.medications.forEach(m => {
      text += `- ${m.name}`;
      if (m.dosage) text += ` (${m.dosage})`;
      if (m.time) text += ` - ${m.time}`;
      text += '\n';
    });
    text += '\n';
  }

  if (data.otherHealthChallenges.length > 0) {
    text += `Other Health Concerns: ${data.otherHealthChallenges.join(', ')}\n`;
  }

  return text;
}

// Export functions and schema
export {
  getWeeklySummary,
  getMonthlySummary,
  getCustomSummary,
  ExtractedHealthDataSchema,
};

// Default export for CommonJS compatibility
export default {
  getWeeklySummary,
  getMonthlySummary,
  getCustomSummary,
};