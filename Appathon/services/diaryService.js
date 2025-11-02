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

// Note: AI/Ai.js is a Node.js backend module and cannot be imported in React Native
// The AI logic has been adapted directly in this file for use in the mobile app

/**
 * Get AI response to a user message in real-time during chat
 * This provides contextual health advice and acknowledges the user's input
 *
 * @param {string} userMessage - User's current message
 * @param {string} userName - User's name for personalization
 * @param {Array} previousMessages - Previous messages in the conversation for context
 * @param {string} userId - User's ID to fetch previous entries
 * @returns {Promise<Object>} AI response with advice
 */
export const getAIChatResponse = async (userMessage, userName = 'User', previousMessages = [], userId = null) => {
  try {
    console.log('🤖 Getting AI response for message:', userMessage);

    // Extract health data from the current message
    const extractedData = await extractHealthDataEnhanced(userMessage);

    console.log('🤖 Extracted data:', extractedData);

    // Analyze conversation context to avoid repetitive questions
    const conversationContext = analyzeConversationContext(previousMessages);

    // Always fetch previous journal entries for context (last 10 entries)
    let previousEntries = null;
    if (userId) {
      try {
        const entriesResult = await getRecentDiaryEntries(userId, 10);
        if (entriesResult.success && entriesResult.data.length > 0) {
          previousEntries = entriesResult.data;
          console.log('📚 Retrieved', previousEntries.length, 'previous entries for context');
        }
      } catch (error) {
        console.log('Could not fetch previous entries:', error);
        // Continue without previous entries
      }
    }

    // Generate contextual response with advice
    const aiResponse = generateContextualResponse(
      extractedData,
      userName,
      userMessage,
      previousMessages,
      conversationContext,
      previousEntries
    );

    return {
      success: true,
      response: aiResponse,
      extractedData,
    };

  } catch (error) {
    console.error('❌ Error getting AI chat response:', error);
    // Return a fallback response
    return {
      success: false,
      response: "I'm here to listen. Can you tell me more about how you're feeling?",
      error: error.message,
    };
  }
};

/**
 * Analyze conversation context to understand what's been discussed
 *
 * @param {Array} messages - Previous conversation messages
 * @returns {Object} Context analysis
 */
function analyzeConversationContext(messages) {
  const aiMessages = messages.filter(m => m.sender === 'ai').map(m => m.text.toLowerCase());
  const userMessages = messages.filter(m => m.sender === 'user').map(m => m.text.toLowerCase());

  // Track topics that have been discussed
  const discussedTopics = new Set();
  const recentUserTopics = [];

  // Analyze last few user messages for topics
  userMessages.slice(-3).forEach(msg => {
    if (msg.includes('hunting') || msg.includes('hunt')) recentUserTopics.push('hunting');
    if (msg.includes('work') || msg.includes('job')) recentUserTopics.push('work');
    if (msg.includes('family') || msg.includes('friend')) recentUserTopics.push('relationships');
    if (msg.includes('exercise') || msg.includes('workout') || msg.includes('gym')) recentUserTopics.push('exercise');
    if (msg.includes('sleep') || msg.includes('tired')) recentUserTopics.push('sleep');
    if (msg.includes('eat') || msg.includes('food') || msg.includes('meal')) recentUserTopics.push('food');
  });

  // Count how many times AI has asked about feelings/emotions
  let feelingQuestions = 0;
  let whatQuestions = 0;
  let healthQuestions = 0;
  let sleepQuestions = 0;
  let activityQuestions = 0;

  aiMessages.forEach(msg => {
    if (msg.includes('how') && (msg.includes('feel') || msg.includes('feeling'))) {
      feelingQuestions++;
    }
    if (msg.includes('what makes') || msg.includes('what gives') || msg.includes('why')) {
      whatQuestions++;
    }
    if (msg.includes('health') || msg.includes('symptoms') || msg.includes('physical')) {
      healthQuestions++;
    }
    if (msg.includes('sleep')) {
      sleepQuestions++;
    }
    if (msg.includes('how often') || msg.includes('do you')) {
      activityQuestions++;
    }
  });

  return {
    messageCount: messages.length,
    recentTopics: recentUserTopics,
    feelingQuestionsAsked: feelingQuestions,
    whatQuestionsAsked: whatQuestions,
    healthQuestionsAsked: healthQuestions,
    sleepQuestionsAsked: sleepQuestions,
    activityQuestionsAsked: activityQuestions,
    conversationDepth: Math.floor(messages.length / 2), // Number of exchanges
  };
}

/**
 * Generate talking points from previous journal entries
 *
 * @param {Array} previousEntries - Array of previous diary entries
 * @returns {Array} Array of talking point strings
 */
function generateTalkingPointsFromHistory(previousEntries) {
  if (!previousEntries || previousEntries.length === 0) return [];

  const talkingPoints = [];
  const allSymptoms = new Set();
  const allMedications = new Set();
  let hadNegativeMood = false;
  let hadPositiveMood = false;
  let recentEmotions = [];

  // Analyze patterns across all entries
  previousEntries.forEach((entry, index) => {
    const data = entry.extractedData;
    if (!data) return;

    // Collect symptoms
    if (data.symptoms && data.symptoms.length > 0) {
      data.symptoms.forEach(s => allSymptoms.add(s.name));
    }

    // Track mood patterns
    if (data.moods) {
      if (data.moods.score <= 4) {
        hadNegativeMood = true;
      } else if (data.moods.score >= 7) {
        hadPositiveMood = true;
        if (data.moods.emotions && data.moods.emotions.length > 0) {
          recentEmotions.push(...data.moods.emotions);
        }
      }
    }

    // Collect medications
    if (data.medications && data.medications.length > 0) {
      data.medications.forEach(m => allMedications.add(m.name));
    }
  });

  // Generate follow-up questions based on history
  if (allSymptoms.size > 0) {
    const symptomList = Array.from(allSymptoms);
    if (symptomList.length === 1) {
      talkingPoints.push({
        type: 'symptom',
        text: `I see you've mentioned ${symptomList[0]} in your past entries. How is that going now?`,
        topic: 'symptoms',
      });
    } else if (symptomList.length === 2) {
      talkingPoints.push({
        type: 'symptom',
        text: `You've been tracking ${symptomList[0]} and ${symptomList[1]}. Are these still bothering you?`,
        topic: 'symptoms',
      });
    } else {
      talkingPoints.push({
        type: 'symptom',
        text: `I noticed you've been dealing with several symptoms like ${symptomList.slice(0, 2).join(' and ')}. How are you feeling physically today?`,
        topic: 'symptoms',
      });
    }
  }

  // Mood-based follow-ups
  if (hadNegativeMood && hadPositiveMood) {
    talkingPoints.push({
      type: 'mood',
      text: `Your mood has been up and down recently. How are you feeling emotionally today?`,
      topic: 'mood',
    });
  } else if (hadNegativeMood) {
    talkingPoints.push({
      type: 'mood',
      text: `I noticed you were struggling with your mood. Things feeling any better?`,
      topic: 'mood',
    });
  } else if (hadPositiveMood && recentEmotions.length > 0) {
    // Get unique emotions
    const uniqueEmotions = [...new Set(recentEmotions)];
    talkingPoints.push({
      type: 'mood',
      text: `You've been feeling ${uniqueEmotions[0]} lately. Is that still the case?`,
      topic: 'mood',
    });
  }

  // Medication follow-ups
  if (allMedications.size > 0) {
    const medList = Array.from(allMedications);
    if (medList.length === 1) {
      talkingPoints.push({
        type: 'medication',
        text: `How's the ${medList[0]} working out for you?`,
        topic: 'medication',
      });
    } else {
      talkingPoints.push({
        type: 'medication',
        text: `I see you're taking ${medList.join(', ')}. Any changes or side effects to report?`,
        topic: 'medication',
      });
    }
  }

  return talkingPoints;
}

/**
 * Detect if user is asking about their own health history
 *
 * @param {string} userMessage - User's message
 * @param {Array} previousEntries - User's previous journal entries
 * @returns {string|null} Answer based on history or null
 */
function detectPersonalHistoryQuestion(userMessage, previousEntries) {
  if (!previousEntries || previousEntries.length === 0) return null;

  const lowerMessage = userMessage.toLowerCase();

  // Detect if asking about their medication
  if (lowerMessage.includes('my medication') ||
      lowerMessage.includes('my meds') ||
      lowerMessage.includes('what medication') ||
      lowerMessage.includes('which medication') ||
      lowerMessage.includes('what meds') ||
      lowerMessage.includes('medication i') ||
      lowerMessage.includes('meds i') ||
      (lowerMessage.includes('medication') && (lowerMessage.includes('taking') || lowerMessage.includes('take') || lowerMessage.includes('am i'))) ||
      lowerMessage.includes('what am i taking') ||
      lowerMessage.includes('am i on')) {

    // Collect all medications from history
    const allMeds = new Set();
    console.log('🔍 Checking medications in', previousEntries.length, 'entries');

    previousEntries.forEach((entry, index) => {
      console.log(`Entry ${index}:`, entry.extractedData?.medications);
      if (entry.extractedData?.medications) {
        entry.extractedData.medications.forEach(med => {
          if (med.taken !== false) { // Only include medications they're currently taking
            console.log('✅ Found medication:', med.name);
            allMeds.add(med.name);
          }
        });
      }
    });

    console.log('📋 Total medications found:', Array.from(allMeds));

    if (allMeds.size > 0) {
      const medList = Array.from(allMeds).join(', ');
      return `Based on your journal entries, you've mentioned taking ${medList}. `;
    } else {
      return "I don't see any medications recorded in your recent journal entries. You can tell me what you're taking and I'll track it for you. ";
    }
  }

  // Detect if they're hinting at ADHD medication or similar
  if ((lowerMessage.includes('adhd') || lowerMessage.includes('add')) &&
      (lowerMessage.includes('med') || lowerMessage.includes('pill') || lowerMessage.includes('prescription'))) {

    // Check if they have ADHD medication in history
    let hasADHDMed = false;
    previousEntries.forEach(entry => {
      if (entry.extractedData?.medications) {
        entry.extractedData.medications.forEach(med => {
          const medName = med.name.toLowerCase();
          if (medName.includes('adhd') || medName.includes('adderall') ||
              medName.includes('ritalin') || medName.includes('vyvanse') ||
              medName.includes('concerta') || medName.includes('strattera')) {
            hasADHDMed = true;
          }
        });
      }
    });

    if (hasADHDMed) {
      return "Yes, I see you've mentioned your ADHD medication in your journal entries. ";
    }
  }

  // Detect if asking about their symptoms
  if (lowerMessage.includes('my symptoms') ||
      lowerMessage.includes('what symptoms') ||
      lowerMessage.includes('symptoms have i') ||
      lowerMessage.includes('what have i been')) {

    const allSymptoms = new Set();
    previousEntries.forEach(entry => {
      if (entry.extractedData?.symptoms) {
        entry.extractedData.symptoms.forEach(s => allSymptoms.add(s.name));
      }
    });

    if (allSymptoms.size > 0) {
      const symptomList = Array.from(allSymptoms).join(', ');
      return `Looking at your journal history, you've mentioned experiencing ${symptomList}. `;
    } else {
      return "I don't see any symptoms recorded in your recent journal entries. ";
    }
  }

  // Detect if asking about their mood/feelings
  if (lowerMessage.includes('how have i been') ||
      lowerMessage.includes('how was i') ||
      lowerMessage.includes('my mood')) {

    const recentEntry = previousEntries[0];
    if (recentEntry?.extractedData?.moods) {
      const mood = recentEntry.extractedData.moods;
      const score = mood.score;
      let response = '';

      if (score <= 4) {
        response = "Based on your last entry, you were having a difficult time with your mood. ";
      } else if (score >= 7) {
        response = "Your last entry showed you were feeling really positive! ";
      } else {
        response = "Your last entry showed you were feeling fairly balanced. ";
      }

      if (mood.emotions && mood.emotions.length > 0) {
        response += `You mentioned feeling ${mood.emotions.join(', ')}. `;
      }

      return response;
    }
  }

  return null;
}

/**
 * Detect if user is asking a question and provide an answer
 *
 * @param {string} userMessage - User's message
 * @param {Array} previousEntries - User's previous entries for personal questions
 * @returns {string|null} Answer to the question or null if not a question
 */
function detectAndAnswerQuestion(userMessage, previousEntries = null) {
  const lowerMessage = userMessage.toLowerCase();

  // FIRST: Check if asking about their personal health history
  if (previousEntries) {
    const personalAnswer = detectPersonalHistoryQuestion(userMessage, previousEntries);
    if (personalAnswer) {
      return personalAnswer;
    }
  }

  // Check if this is actually a question
  const isQuestion = lowerMessage.includes('?') ||
                     lowerMessage.startsWith('how ') ||
                     lowerMessage.startsWith('what ') ||
                     lowerMessage.startsWith('why ') ||
                     lowerMessage.startsWith('when ') ||
                     lowerMessage.startsWith('where ') ||
                     lowerMessage.startsWith('can ') ||
                     lowerMessage.startsWith('should ') ||
                     lowerMessage.includes('how do i') ||
                     lowerMessage.includes('how can i');

  if (!isQuestion) return null;

  // Meditation questions
  if (lowerMessage.includes('meditat')) {
    if (lowerMessage.includes('how')) {
      return "Here's a simple way to meditate: Find a quiet place and sit comfortably. Close your eyes and focus on your breathing - breathe in slowly through your nose, hold for a moment, then breathe out through your mouth. When your mind wanders (and it will!), gently bring your attention back to your breath. Start with just 5 minutes a day. There are also great apps like Headspace or Calm that can guide you. ";
    }
    if (lowerMessage.includes('why') || lowerMessage.includes('benefit')) {
      return "Meditation can help reduce stress and anxiety, improve focus, lower blood pressure, and promote better sleep. Many people find it helps them feel more calm and centered throughout the day. ";
    }
  }

  // Sleep questions
  if (lowerMessage.includes('sleep') && (lowerMessage.includes('how') || lowerMessage.includes('can'))) {
    return "For better sleep, try these tips: Keep a consistent sleep schedule, avoid screens 1 hour before bed, make your room cool and dark, avoid caffeine after 2pm, and try relaxation techniques like deep breathing. If sleep problems persist, consider talking to a doctor. ";
  }

  // Anxiety/stress management
  if ((lowerMessage.includes('anxiet') || lowerMessage.includes('stress')) &&
      (lowerMessage.includes('how') || lowerMessage.includes('help'))) {
    return "For anxiety and stress, try: deep breathing exercises (breathe in for 4 counts, hold for 4, out for 4), regular physical activity, talking to someone you trust, limiting caffeine, getting enough sleep, and practicing mindfulness. If anxiety is interfering with daily life, reaching out to a mental health professional can be very helpful. ";
  }

  // Exercise questions
  if (lowerMessage.includes('exercise') && (lowerMessage.includes('how') || lowerMessage.includes('should'))) {
    return "Adults should aim for at least 150 minutes of moderate exercise per week (like brisk walking) or 75 minutes of vigorous exercise (like running). Start small - even 10-15 minutes a day is beneficial. Find activities you enjoy so you'll stick with it. ";
  }

  // Depression questions
  if (lowerMessage.includes('depress') && (lowerMessage.includes('what') || lowerMessage.includes('help'))) {
    return "If you're experiencing depression, know that help is available. Consider: talking to a therapist or counselor, reaching out to trusted friends/family, maintaining a routine, getting regular exercise and sunlight, and eating nutritious meals. If you're having thoughts of self-harm, please call the National Suicide Prevention Lifeline at 988. ";
  }

  // Headache questions
  if (lowerMessage.includes('headache') && (lowerMessage.includes('what') || lowerMessage.includes('how'))) {
    return "For headaches, try: resting in a quiet, dark room, applying a cold compress to your forehead, staying hydrated, gentle neck stretches, and over-the-counter pain relievers if appropriate. If headaches are frequent or severe, see a doctor to rule out underlying conditions. ";
  }

  // Diet/nutrition questions
  if ((lowerMessage.includes('diet') || lowerMessage.includes('eat')) &&
      (lowerMessage.includes('what') || lowerMessage.includes('how'))) {
    return "A healthy diet includes: plenty of fruits and vegetables, whole grains, lean proteins, healthy fats (like nuts, avocado, olive oil), and staying hydrated with water. Try to limit processed foods, excess sugar, and saturated fats. Everyone's nutritional needs are different, so consider consulting a nutritionist for personalized advice. ";
  }

  // General health questions
  if (lowerMessage.includes('healthy') && lowerMessage.includes('how')) {
    return "To stay healthy: eat a balanced diet, exercise regularly, get 7-9 hours of sleep, manage stress, stay hydrated, avoid smoking, limit alcohol, maintain social connections, and get regular check-ups with your doctor. Small, consistent habits make a big difference! ";
  }

  return null;
}

/**
 * Generate contextual AI response with health advice
 *
 * @param {Object} extractedData - Extracted health data
 * @param {string} userName - User's name
 * @param {string} userMessage - Current user message
 * @param {Array} previousMessages - Previous conversation messages
 * @param {Object} conversationContext - Analysis of conversation history
 * @param {Array} previousEntries - Previous journal entries for talking points
 * @returns {string} AI response
 */
function generateContextualResponse(extractedData, userName, userMessage, previousMessages, conversationContext, previousEntries = null) {
  const { symptoms, moods, medications, otherHealthChallenges } = extractedData;
  const lowerMessage = userMessage.toLowerCase();

  let response = '';
  let followUp = '';

  // FIRST: Check if user is asking a question - if so, answer it directly
  const questionAnswer = detectAndAnswerQuestion(userMessage, previousEntries);
  if (questionAnswer) {
    response = questionAnswer;
    // After answering, ask if they need more information or have concerns
    const answerFollowUps = [
      "Does that help?",
      "Is there anything else you'd like to know?",
      "Let me know if you have any other questions.",
      "Anything else on your mind?",
    ];
    followUp = answerFollowUps[Math.floor(Math.random() * answerFollowUps.length)];
    return response + followUp;
  }

  // Acknowledge symptoms with specific advice
  if (symptoms.length > 0) {
    response += `I understand you're experiencing ${symptoms.map(s => s.name).join(', ')}. `;

    // Provide severity-based advice
    const severeSymptoms = symptoms.filter(s => s.degree === 'severe' || s.degree === 'worsening');
    if (severeSymptoms.length > 0) {
      response += `I'm concerned about your ${severeSymptoms.map(s => s.name).join(' and ')}. If these symptoms persist or worsen, please consult a healthcare provider promptly. `;
    }

    // Symptom-specific advice
    symptoms.forEach(symptom => {
      const advice = getSymptomAdvice(symptom.name, symptom.degree);
      if (advice) {
        response += advice + ' ';
      }
    });

    // Varied follow-up questions for symptoms
    followUp = getVariedFollowUp('symptom', conversationContext, previousEntries);
  }
  // Mood-based responses with actionable advice
  else if (moods.score <= 4) {
    response += "I hear that you're going through a difficult time. ";

    // Specific advice for low mood
    if (moods.emotions.includes('anxious') || moods.emotions.includes('stressed')) {
      response += "When feeling anxious or stressed, try taking slow, deep breaths. A short walk or talking with someone you trust can also help. ";
    }
    if (moods.emotions.includes('sad') || moods.emotions.includes('depressed')) {
      response += "It's completely okay to feel this way. If these feelings continue, consider reaching out to a mental health professional. ";
    }
    response += "Sometimes small steps like getting fresh air, staying hydrated, or doing something you enjoy can make a difference. ";

    followUp = getVariedFollowUp('negative_mood', conversationContext, previousEntries);
  }
  else if (moods.score >= 7) {
    // Positive mood - be more conversational and less repetitive
    const positiveResponses = [
      "That's wonderful to hear! ",
      "I'm glad you're feeling good! ",
      "It's great that you're in a positive place. ",
      "That sounds really positive! ",
    ];

    // If user mentioned a specific activity (like hunting), engage with it
    if (conversationContext.recentTopics.includes('hunting')) {
      response = "Hunting clearly brings you a lot of happiness. ";
      followUp = getVariedFollowUp('positive_activity', conversationContext, previousEntries);
    } else if (conversationContext.recentTopics.includes('exercise')) {
      response = "Exercise can be such a mood booster. ";
      followUp = getVariedFollowUp('positive_activity', conversationContext, previousEntries);
    } else if (conversationContext.recentTopics.includes('relationships')) {
      response = "It's great that your relationships are bringing you joy. ";
      followUp = getVariedFollowUp('positive_activity', conversationContext, previousEntries);
    } else {
      response = positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
      followUp = getVariedFollowUp('positive_mood', conversationContext, previousEntries);
    }
  }
  // Neutral mood or general conversation
  else {
    // Medication acknowledgment
    if (medications.length > 0) {
      response += `I've noted you mentioned ${medications.map(m => m.name).join(', ')}. Make sure to take medications as prescribed and monitor for any side effects. `;
      followUp = getVariedFollowUp('medication', conversationContext, previousEntries);
    }
    // General conversational responses
    else {
      response = generateNaturalAcknowledgment(userMessage, conversationContext);
      followUp = getVariedFollowUp('general', conversationContext, previousEntries);
    }
  }

  return response + followUp;
}

/**
 * Generate natural acknowledgment based on user message
 */
function generateNaturalAcknowledgment(userMessage, context) {
  const lowerMessage = userMessage.toLowerCase();

  // Short answers detection
  if (userMessage.trim().split(' ').length <= 3) {
    const shortResponses = [
      "I see. ",
      "Got it. ",
      "Thanks for sharing. ",
      "Okay. ",
    ];
    return shortResponses[Math.floor(Math.random() * shortResponses.length)];
  }

  // Contextual acknowledgments
  if (lowerMessage.includes('because') || lowerMessage.includes('since')) {
    return "That makes sense. ";
  }

  if (lowerMessage.includes('always') || lowerMessage.includes('usually')) {
    return "I understand that's a pattern for you. ";
  }

  if (lowerMessage.includes('love') || lowerMessage.includes('enjoy')) {
    return "It's great that you have something you're passionate about. ";
  }

  return "Thanks for sharing that with me. ";
}

/**
 * Get varied follow-up questions to avoid repetition
 */
function getVariedFollowUp(responseType, context, previousEntries = null) {
  const {
    conversationDepth,
    feelingQuestionsAsked,
    whatQuestionsAsked,
    healthQuestionsAsked,
    sleepQuestionsAsked,
    activityQuestionsAsked,
    recentTopics
  } = context;

  // Check if we have talking points from previous entries
  let talkingPoints = [];
  if (previousEntries && previousEntries.length > 0) {
    talkingPoints = generateTalkingPointsFromHistory(previousEntries);
  }

  // Use talking points more frequently throughout the conversation
  // After 2nd exchange, start mixing in historical context
  if (conversationDepth >= 2 && talkingPoints.length > 0) {
    // 50% chance to use a historical talking point after 2nd exchange
    if (Math.random() > 0.5 || conversationDepth >= 3) {
      // Pick a random talking point
      const randomPoint = talkingPoints[Math.floor(Math.random() * talkingPoints.length)];
      console.log('📝 Using talking point from history:', randomPoint.text);
      return randomPoint.text;
    }
  }

  // After deep conversation (4+ exchanges), move to closing statements instead of more questions
  if (conversationDepth >= 4) {
    const closingStatements = [
      "Thanks for sharing. I've recorded everything you've told me today.",
      "I've noted all of this. Remember to take care of yourself.",
      "Got it. Feel free to come back anytime you want to check in on your health.",
      "Thanks for checking in today. I'm here whenever you need to track your health.",
    ];
    return closingStatements[Math.floor(Math.random() * closingStatements.length)];
  }

  // Track which topics have been asked about already
  const topicsAsked = [];
  if (sleepQuestionsAsked > 0) topicsAsked.push('sleep');
  if (healthQuestionsAsked > 0) topicsAsked.push('health');
  if (activityQuestionsAsked > 0) topicsAsked.push('activity');

  // Avoid asking the same type of question repeatedly
  if (responseType === 'positive_mood' || responseType === 'positive_activity') {
    // If we've already asked "what" questions multiple times, stop and move to different topics
    if (whatQuestionsAsked >= 1) {
      // Move to completely different topics that haven't been asked
      const newTopicQuestions = [];

      if (!topicsAsked.includes('sleep')) {
        newTopicQuestions.push("How has your sleep been?");
        newTopicQuestions.push("Are you sleeping well?");
      }
      if (!topicsAsked.includes('health')) {
        newTopicQuestions.push("Any physical health concerns today?");
        newTopicQuestions.push("How are you feeling physically?");
      }

      // If we've exhausted topics, make a closing statement
      if (newTopicQuestions.length === 0) {
        return "Thanks for sharing. I've recorded everything for you.";
      }

      return newTopicQuestions[Math.floor(Math.random() * newTopicQuestions.length)];
    }

    // First time - ask one brief follow-up then move on
    const briefFollowUps = [
      "That's great to hear. How's your sleep been?",
      "Wonderful. Any health concerns today?",
      "That's good. How are you feeling physically?",
    ];
    return briefFollowUps[Math.floor(Math.random() * briefFollowUps.length)];
  }

  if (responseType === 'negative_mood') {
    // Don't keep probing negative feelings - ask once then shift to actionable health topics
    if (feelingQuestionsAsked >= 1) {
      return "I understand. Let me know if there's anything specific you'd like to track health-wise.";
    }

    const supportiveFollowUps = [
      "How has this been affecting your sleep?",
      "Have you been able to eat and take care of yourself?",
      "Are there any physical symptoms along with these feelings?",
    ];
    return supportiveFollowUps[Math.floor(Math.random() * supportiveFollowUps.length)];
  }

  if (responseType === 'symptom') {
    // Ask one clarifying question max, then move on
    if (conversationDepth >= 2) {
      return "Got it. I've logged that for you.";
    }

    const symptomFollowUps = [
      "How long have you been experiencing this?",
      "Is this affecting your daily activities?",
    ];
    return symptomFollowUps[Math.floor(Math.random() * symptomFollowUps.length)];
  }

  if (responseType === 'medication') {
    const medFollowUps = [
      "How are you feeling overall?",
      "Any side effects you've noticed?",
    ];
    return medFollowUps[Math.floor(Math.random() * medFollowUps.length)];
  }

  // General follow-ups with variety - prioritize topics not yet discussed
  const generalFollowUps = [];

  if (!topicsAsked.includes('health') && healthQuestionsAsked === 0) {
    generalFollowUps.push("Any health concerns today?");
    generalFollowUps.push("How are you feeling physically?");
  }

  if (!topicsAsked.includes('sleep') && sleepQuestionsAsked === 0) {
    generalFollowUps.push("How has your sleep been?");
  }

  // Fallback to simple closing statements if we've covered everything
  if (generalFollowUps.length === 0) {
    const closings = [
      "Anything else you'd like to share?",
      "I've got all that noted.",
      "Thanks for checking in.",
    ];
    return closings[Math.floor(Math.random() * closings.length)];
  }

  return generalFollowUps[Math.floor(Math.random() * generalFollowUps.length)];
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
    'fatigue': 'For fatigue, ensure you\'re getting enough sleep and consider checking your iron levels with your doctor.',
    'dizziness': 'For dizziness, sit or lie down immediately and avoid sudden movements. If it persists, see a doctor.',
    'insomnia': 'For sleep issues, try establishing a consistent bedtime routine and limiting screen time before bed.',
    'anxiety': 'For anxiety, try deep breathing exercises, meditation, or journaling your thoughts.',
    'pain': 'For pain, rest the affected area and consider over-the-counter pain relief if appropriate.',
    'fever': 'For fever, stay hydrated, rest, and monitor your temperature. Seek medical care if it goes above 103°F (39.4°C).',
    'cough': 'For cough, stay hydrated and use a humidifier. See a doctor if it persists beyond a few weeks.',
    'stomach ache': 'For stomach pain, try eating bland foods and staying hydrated. See a doctor if pain is severe.',
    'chest pain': 'For chest pain, this could be serious. If it\'s severe or accompanied by other symptoms, seek emergency medical care immediately.',
    'shortness of breath': 'For shortness of breath, try to stay calm and breathe slowly. If it\'s severe, seek medical attention.',
    'back pain': 'For back pain, try gentle stretching, applying heat or ice, and avoiding activities that worsen it.',
    'migraine': 'For migraines, rest in a dark, quiet room and consider speaking with your doctor about prevention strategies.',
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
 * Enhanced health data extraction with better accuracy
 *
 * @param {string} text - User's message
 * @returns {Promise<Object>} Extracted health data
 */
async function extractHealthDataEnhanced(text) {
  // This is an enhanced version of the placeholder extraction
  // In the future, this can be replaced with actual AI API calls
  const lowerText = text.toLowerCase();

  const symptoms = [];

  // Cardiovascular symptoms
  if (lowerText.includes('heart palpitation') || lowerText.includes('palpitation')) {
    symptoms.push({ name: 'heart palpitations', degree: 'moderate' });
  }
  if (lowerText.includes('chest pain') || lowerText.includes('chest pressure')) {
    symptoms.push({ name: 'chest pain', degree: 'severe' });
  }
  if (lowerText.includes('shortness of breath') || lowerText.includes('hard to breathe') || lowerText.includes('can\'t breathe')) {
    symptoms.push({ name: 'shortness of breath', degree: 'moderate' });
  }

  // Head/neurological symptoms
  if (lowerText.includes('headache') || lowerText.includes('head ache')) {
    const degree = lowerText.includes('severe') || lowerText.includes('bad') ? 'severe' : 'moderate';
    symptoms.push({ name: 'headache', degree });
  }
  if (lowerText.includes('dizzy') || lowerText.includes('dizziness') || lowerText.includes('lightheaded')) {
    symptoms.push({ name: 'dizziness', degree: 'moderate' });
  }
  if (lowerText.includes('migraine')) {
    symptoms.push({ name: 'migraine', degree: 'severe' });
  }

  // Digestive symptoms
  if (lowerText.includes('nausea') || lowerText.includes('nauseous') || lowerText.includes('feel sick')) {
    symptoms.push({ name: 'nausea' });
  }
  if (lowerText.includes('vomit') || lowerText.includes('throw up') || lowerText.includes('throwing up')) {
    symptoms.push({ name: 'vomiting', degree: 'moderate' });
  }
  if (lowerText.includes('stomach ache') || lowerText.includes('stomach pain') || lowerText.includes('stomachache')) {
    symptoms.push({ name: 'stomach ache' });
  }
  if (lowerText.includes('diarrhea')) {
    symptoms.push({ name: 'diarrhea' });
  }

  // Energy/general symptoms
  if (lowerText.includes('tired') || lowerText.includes('fatigue') || lowerText.includes('exhausted')) {
    const degree = lowerText.includes('very') || lowerText.includes('extremely') ? 'severe' : 'moderate';
    symptoms.push({ name: 'fatigue', degree });
  }
  if (lowerText.includes('weak') || lowerText.includes('weakness')) {
    symptoms.push({ name: 'weakness' });
  }
  if (lowerText.includes('insomnia') || lowerText.includes('can\'t sleep') || lowerText.includes('cannot sleep') || lowerText.includes('trouble sleeping')) {
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

  // Respiratory symptoms
  if (lowerText.includes('cough') || lowerText.includes('coughing')) {
    symptoms.push({ name: 'cough' });
  }
  if (lowerText.includes('sore throat')) {
    symptoms.push({ name: 'sore throat' });
  }
  if (lowerText.includes('fever') || lowerText.includes('temperature') || lowerText.includes('hot')) {
    symptoms.push({ name: 'fever', degree: 'moderate' });
  }

  // Mood detection
  let moodScore = 5;
  let overall = 'neutral';
  const emotions = [];

  // Positive indicators
  if (lowerText.includes('happy') || lowerText.includes('great') || lowerText.includes('wonderful')) {
    moodScore = 8;
    overall = 'positive';
    emotions.push('happy');
  }
  if (lowerText.includes('good') || lowerText.includes('better') || lowerText.includes('improving')) {
    moodScore = Math.max(moodScore, 7);
    overall = 'positive';
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
  if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('anxiety') || lowerText.includes('nervous')) {
    emotions.push('anxious');
    if (moodScore > 4) moodScore = 4;
    overall = 'negative';
  }
  if (lowerText.includes('stressed') || lowerText.includes('stress') || lowerText.includes('overwhelmed')) {
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
  if (lowerText.includes('terrible') || lowerText.includes('awful') || lowerText.includes('horrible')) {
    moodScore = Math.min(moodScore, 3);
    overall = 'negative';
  }

  // Detect medications
  const medications = [];
  const medKeywords = [
    'aspirin', 'ibuprofen', 'tylenol', 'acetaminophen', 'advil',
    'melatonin', 'zoloft', 'prozac', 'lexapro', 'xanax',
    'adderall', 'ritalin', 'vyvanse', 'concerta', 'strattera',
    'wellbutrin', 'cymbalta', 'paxil', 'celexa',
    'ativan', 'klonopin', 'valium',
    'vitamin', 'supplement'
  ];

  medKeywords.forEach(med => {
    if (lowerText.includes(med)) {
      medications.push({
        name: med.charAt(0).toUpperCase() + med.slice(1),
        taken: !lowerText.includes('stopped') && !lowerText.includes('quit')
      });
    }
  });

  // Detect medication categories/types
  if (lowerText.includes('adhd medication') ||
      lowerText.includes('adhd meds') ||
      lowerText.includes('adhd med') ||
      lowerText.includes('add medication') ||
      lowerText.includes('add meds') ||
      (lowerText.includes('medication') && lowerText.includes('adhd')) ||
      (lowerText.includes('meds') && lowerText.includes('adhd')) ||
      (lowerText.includes('taking') && lowerText.includes('adhd')) ||
      lowerText.includes('for adhd') ||
      lowerText.includes('for my adhd')) {
    medications.push({
      name: 'ADHD medication',
      taken: !lowerText.includes('stopped') && !lowerText.includes('quit')
    });
  }

  if (lowerText.includes('antidepressant')) {
    medications.push({
      name: 'Antidepressant',
      taken: !lowerText.includes('stopped') && !lowerText.includes('quit')
    });
  }

  if (lowerText.includes('anxiety medication') || lowerText.includes('anti-anxiety')) {
    medications.push({
      name: 'Anxiety medication',
      taken: !lowerText.includes('stopped') && !lowerText.includes('quit')
    });
  }

  if (lowerText.includes('pain medication') || lowerText.includes('pain reliever')) {
    medications.push({
      name: 'Pain medication',
      taken: !lowerText.includes('stopped') && !lowerText.includes('quit')
    });
  }

  if (lowerText.includes('sleep medication') || lowerText.includes('sleeping pill')) {
    medications.push({
      name: 'Sleep medication',
      taken: !lowerText.includes('stopped') && !lowerText.includes('quit')
    });
  }

  return {
    symptoms,
    moods: {
      overall,
      score: moodScore,
      emotions,
    },
    medications,
    otherHealthChallenges: [],
  };
}

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

    // Extract health data using the enhanced extraction function
    const extractedData = await extractHealthDataEnhanced(userMessages || conversationText);

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
