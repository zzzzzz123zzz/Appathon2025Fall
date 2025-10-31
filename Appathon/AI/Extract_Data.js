/**
 * Extract_Data.js - Health Data Extraction using Firebase Genkit
 *
 * This module provides a simplified interface for health data extraction
 * by using shared functions from app.js
 * Uses: Firebase Genkit + Google AI (Gemini)
 */

import { processDiaryEntry, getRecentEntries, ExtractedHealthDataSchema } from './app.js';
import { db } from '../config/firebase.js';
import { collection, addDoc } from 'firebase/firestore';

/**
 * Re-export schema from app.js for backward compatibility
 */
const OutputSchema = ExtractedHealthDataSchema;

/**
 * Extract health data from user input
 * This is a wrapper around processDiaryEntry from app.js
 *
 * @param {string} userId - User's ID
 * @param {string} userInput - User's diary entry text
 * @returns {Promise<Object>} Extracted health data as JSON
 */
async function extractFromUserInput(userId, userInput) {
  try {
    console.log('🔍 Extracting health data from user input...');

    // Use the shared processDiaryEntry function
    const result = await processDiaryEntry(userId, 'User', userInput);

    console.log('✅ Extraction successful!');
    return {
      userId,
      timestamp: new Date().toISOString(),
      userInput,
      extractedData: result.extracted,
    };

  } catch (error) {
    console.error('❌ Extraction failed:', error);
    throw new Error(`Failed to extract health data: ${error.message}`);
  }
}

/**
 * Extract data from multiple entries (for weekly summaries)
 * This now uses getRecentEntries from app.js
 *
 * @param {string} userId - User's ID
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {Promise<Object>} Aggregated extracted health data
 */
async function extractFromMultipleEntries(userId, days = 7) {
  try {
    console.log(`🔍 Fetching last ${days} days of entries for user ${userId}...`);

    // Use the shared getRecentEntries function
    const entries = await getRecentEntries(userId, days * 3);

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

    // Return aggregated data from the entries
    // Note: For full aggregation logic, use generateWeeklySummary from app.js
    return {
      userId,
      timestamp: new Date().toISOString(),
      entriesAnalyzed: entries.length,
      entries: entries.map(e => ({
        extractedData: e.extractedData,
        timestamp: e.timestamp,
      })),
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
  // Extract data using the shared function
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