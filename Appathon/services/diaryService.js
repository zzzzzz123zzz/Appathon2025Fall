/**
 * diaryService.js - Diary Entry Processing Service
 *
 * This service handles the complete diary entry workflow:
 * 1. Takes conversation text from ChatScreen
 * 2. Extracts health data using AI (via API call or direct processing)
 * 3. Generates a summary
 * 4. Saves to Firebase with extracted data
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Process and save a complete diary entry with AI extraction
 *
 * @param {string} userId - User's ID
 * @param {string} conversationText - Full conversation text from chat
 * @param {Array} messages - Array of message objects (optional, for metadata)
 * @returns {Promise<Object>} Result with entry ID and extracted data
 */
export const processDiaryEntry = async (userId, conversationText, messages = []) => {
  try {
    console.log('📝 Processing diary entry for user:', userId);
    console.log('📝 Messages array:', messages);
    console.log('📝 Conversation text length:', conversationText?.length);

    // Extract user messages only (filter out AI responses)
    const userMessages = messages
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.text)
      .join(' ');

    console.log('📝 User messages extracted:', userMessages);

    // For now, we'll save the raw conversation
    // TODO: Add AI extraction here (call Cloud Function or API endpoint)
    // const extractedData = await extractHealthData(userMessages || conversationText);

    // Temporary: Save with placeholder extraction data
    // You'll need to integrate with your AI extraction endpoint
    const extractedData = await extractHealthDataPlaceholder(userMessages || conversationText);

    console.log('📝 Extracted data:', extractedData);

    // Generate a summary of the entry
    const summary = generateEntrySummary(conversationText, extractedData);

    console.log('📝 Generated summary:', summary);

    // Save to Firestore under users/{userId}/diaryEntries
    console.log('📝 Attempting to save to Firestore...');
    const diaryEntriesRef = collection(db, 'users', userId, 'diaryEntries');

    const dataToSave = {
      conversationText,
      userInput: userMessages || conversationText,
      extractedData,
      summary,
      messageCount: messages.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      type: messages.length > 0 ? 'chat' : 'note', // 'chat' if has messages, otherwise 'note'
    };

    console.log('📝 Data to save:', dataToSave);

    const docRef = await addDoc(diaryEntriesRef, dataToSave);

    console.log('✅ Diary entry saved successfully! Document ID:', docRef.id);

    return {
      success: true,
      entryId: docRef.id,
      extractedData,
      summary,
    };

  } catch (error) {
    console.error('❌ Error processing diary entry:', error);
    console.error('❌ Error stack:', error.stack);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get recent diary entries for a user
 *
 * @param {string} userId - User's ID
 * @param {number} limitCount - Number of entries to retrieve
 * @returns {Promise<Object>} Result with entries array
 */
export const getRecentDiaryEntries = async (userId, limitCount = 10) => {
  try {
    const diaryEntriesRef = collection(db, 'users', userId, 'diaryEntries');
    const q = query(
      diaryEntriesRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const entries = [];

    querySnapshot.forEach((doc) => {
      entries.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      data: entries,
    };

  } catch (error) {
    console.error('❌ Error getting diary entries:', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * Get diary entries from a specific time period
 *
 * @param {string} userId - User's ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Object>} Result with entries array
 */
export const getDiaryEntriesByDays = async (userId, days = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const diaryEntriesRef = collection(db, 'users', userId, 'diaryEntries');
    const q = query(
      diaryEntriesRef,
      where('createdAt', '>=', startDate),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const entries = [];

    querySnapshot.forEach((doc) => {
      entries.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      data: entries,
    };

  } catch (error) {
    console.error('❌ Error getting diary entries by days:', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * Placeholder function for AI health data extraction
 * TODO: Replace this with actual AI extraction
 * This should call a Cloud Function or API endpoint that runs the Genkit AI extraction
 *
 * @param {string} text - User's diary text
 * @returns {Promise<Object>} Extracted health data
 */
async function extractHealthDataPlaceholder(text) {
  // TODO: Call your AI extraction endpoint here
  // Enhanced keyword detection (temporary until full AI integration)
  const lowerText = text.toLowerCase();

  const symptoms = [];

  // Cardiovascular symptoms
  if (lowerText.includes('heart palpitation') || lowerText.includes('palpitation')) {
    symptoms.push({ name: 'heart palpitations', degree: 'moderate' });
  }
  if (lowerText.includes('chest pain') || lowerText.includes('chest pressure')) {
    symptoms.push({ name: 'chest pain', degree: 'severe' });
  }
  if (lowerText.includes('shortness of breath') || lowerText.includes('breathing')) {
    symptoms.push({ name: 'shortness of breath' });
  }

  // Head/neurological symptoms
  if (lowerText.includes('headache') || lowerText.includes('head ache')) {
    symptoms.push({ name: 'headache' });
  }
  if (lowerText.includes('dizzy') || lowerText.includes('dizziness') || lowerText.includes('lightheaded')) {
    symptoms.push({ name: 'dizziness' });
  }
  if (lowerText.includes('migraine')) {
    symptoms.push({ name: 'migraine', degree: 'severe' });
  }

  // Digestive symptoms
  if (lowerText.includes('nausea') || lowerText.includes('nauseous')) {
    symptoms.push({ name: 'nausea' });
  }
  if (lowerText.includes('vomit') || lowerText.includes('throw up')) {
    symptoms.push({ name: 'vomiting' });
  }
  if (lowerText.includes('stomach ache') || lowerText.includes('stomach pain')) {
    symptoms.push({ name: 'stomach pain' });
  }
  if (lowerText.includes('diarrhea')) {
    symptoms.push({ name: 'diarrhea' });
  }

  // Energy/general symptoms
  if (lowerText.includes('tired') || lowerText.includes('fatigue') || lowerText.includes('exhausted')) {
    symptoms.push({ name: 'fatigue' });
  }
  if (lowerText.includes('weak') || lowerText.includes('weakness')) {
    symptoms.push({ name: 'weakness' });
  }
  if (lowerText.includes('insomnia') || lowerText.includes('can\'t sleep') || lowerText.includes('cannot sleep')) {
    symptoms.push({ name: 'insomnia' });
  }

  // Pain symptoms
  if (lowerText.includes('back pain')) {
    symptoms.push({ name: 'back pain' });
  }
  if (lowerText.includes('joint pain') || lowerText.includes('joints hurt')) {
    symptoms.push({ name: 'joint pain' });
  }
  if (lowerText.includes('muscle pain') || lowerText.includes('sore muscle')) {
    symptoms.push({ name: 'muscle pain' });
  }
  if (lowerText.includes('pain') && symptoms.length === 0) {
    symptoms.push({ name: 'pain' });
  }

  // Respiratory symptoms
  if (lowerText.includes('cough') || lowerText.includes('coughing')) {
    symptoms.push({ name: 'cough' });
  }
  if (lowerText.includes('sore throat')) {
    symptoms.push({ name: 'sore throat' });
  }
  if (lowerText.includes('fever') || lowerText.includes('temperature')) {
    symptoms.push({ name: 'fever' });
  }

  // Mood detection
  let moodScore = 5;
  let overall = 'neutral';
  const emotions = [];

  // Positive indicators
  if (lowerText.includes('happy') || lowerText.includes('great') || lowerText.includes('good') || lowerText.includes('better')) {
    moodScore = 8;
    overall = 'positive';
    emotions.push('happy');
  }
  if (lowerText.includes('excited') || lowerText.includes('joy')) {
    emotions.push('excited');
    moodScore = Math.max(moodScore, 8);
    overall = 'positive';
  }

  // Negative indicators
  if (lowerText.includes('sad') || lowerText.includes('down') || lowerText.includes('depressed')) {
    moodScore = 3;
    overall = 'negative';
    emotions.push('sad');
  }
  if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('anxiety')) {
    emotions.push('anxious');
    if (moodScore > 4) moodScore = 4;
    overall = 'negative';
  }
  if (lowerText.includes('stressed') || lowerText.includes('stress')) {
    emotions.push('stressed');
    if (moodScore > 4) moodScore = 4;
  }
  if (lowerText.includes('angry') || lowerText.includes('mad') || lowerText.includes('frustrated')) {
    emotions.push('angry');
    if (moodScore > 4) moodScore = 4;
    overall = 'negative';
  }
  if (lowerText.includes('scared') || lowerText.includes('afraid') || lowerText.includes('fear')) {
    emotions.push('scared');
    overall = 'negative';
  }

  // Detect medications
  const medications = [];
  const medKeywords = [
    'aspirin', 'ibuprofen', 'tylenol', 'acetaminophen', 'advil',
    'melatonin', 'zoloft', 'prozac', 'lexapro', 'xanax',
    'vitamin', 'supplement', 'medication', 'medicine', 'pill', 'tablet'
  ];

  medKeywords.forEach(med => {
    if (lowerText.includes(med)) {
      medications.push({
        name: med.charAt(0).toUpperCase() + med.slice(1),
        taken: true
      });
    }
  });

  return {
    symptoms,
    moods: {
      overall,
      score: moodScore,
      emotions,
    },
    medications,
    otherHealthChallenges: [],
    needsAIProcessing: true, // Flag to indicate this needs real AI processing
    extractionMethod: 'keyword-placeholder', // Indicates this is not full AI
  };
}

/**
 * Generate a summary of the diary entry
 *
 * @param {string} conversationText - Full conversation
 * @param {Object} extractedData - Extracted health data
 * @returns {string} Summary text
 */
function generateEntrySummary(conversationText, extractedData) {
  const wordCount = conversationText.split(' ').length;
  const { symptoms, moods } = extractedData;

  let summary = `Diary entry with ${wordCount} words. `;

  if (symptoms.length > 0) {
    summary += `Mentioned ${symptoms.length} symptom(s): ${symptoms.map(s => s.name).join(', ')}. `;
  }

  summary += `Mood: ${moods.overall} (${moods.score}/10)`;

  if (moods.emotions.length > 0) {
    summary += `, feeling ${moods.emotions.join(', ')}`;
  }

  summary += '.';

  return summary;
}

/**
 * TODO: Integrate with your AI extraction endpoint
 *
 * This function should call your Cloud Function or API endpoint
 * that runs the Genkit AI extraction from AI/Ai.js
 *
 * Example implementation:
 *
 * async function extractHealthData(text) {
 *   const response = await fetch('YOUR_CLOUD_FUNCTION_URL', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ text, userId }),
 *   });
 *   return await response.json();
 * }
 */

export default {
  processDiaryEntry,
  getRecentDiaryEntries,
  getDiaryEntriesByDays,
};
