const functions = require('firebase-functions');
const { processDiaryEntry, getRecentEntries, generateWeeklySummary } = require('./app');

/**
 * Add diary entry
 */
exports.addDiaryEntry = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const result = await processDiaryEntry(
    context.auth.uid,
    data.userName || 'User',
    data.message
  );
  
  return {
    success: true,
    aiResponse: result.aiResponse,
    extracted: result.extracted,
    entryId: result.entryId
  };
});

/**
 * Get user's entries
 */
exports.getMyEntries = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const entries = await getRecentEntries(context.auth.uid, data.limit || 10);
  return { success: true, entries };
});

/**
 * Generate weekly summary
 */
exports.getWeeklySummary = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const summary = await generateWeeklySummary(context.auth.uid);
  return { success: true, summary };
});