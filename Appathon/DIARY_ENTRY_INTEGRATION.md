# Diary Entry Integration Guide

## Overview

The "Finish Entry" button in ChatScreen now performs a complete workflow:
1. **Captures** the full conversation from the chat
2. **Extracts** health data (symptoms, moods, medications) using AI
3. **Generates** a summary of the entry
4. **Saves** everything to Firebase as a diary entry

## What Was Implemented

### 1. New Service: `diaryService.js`

**Location:** `services/diaryService.js`

This service handles the complete diary entry workflow:

**Main Function:** `processDiaryEntry(userId, conversationText, messages)`
- Filters user messages from AI responses
- Extracts health data using AI (currently placeholder, ready for real AI integration)
- Generates an entry summary
- Saves to Firebase under `users/{userId}/diaryEntries`

**What Gets Saved:**
```javascript
{
  conversationText: "Full conversation with AI responses",
  userInput: "Just the user's messages",
  extractedData: {
    symptoms: [
      { name: "headache", duration: "2 days", degree: "moderate" }
    ],
    moods: {
      overall: "positive",
      score: 7,
      emotions: ["happy", "relieved"]
    },
    medications: [],
    otherHealthChallenges: []
  },
  summary: "Quick summary of the entry",
  messageCount: 5,
  type: "chat",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. Updated Files

#### `App.js` (Lines 19, 281-314, 355-360)
- Imported `processDiaryEntry` from diaryService
- Updated `navigateToSuccess()` to handle both chat entries and regular notes
- Modified ChatScreen component to pass messages array

#### `ChatScreen.js` (Line 174-182)
- Updated `handleFinishSession()` to pass messages array to onFinish callback

#### `firestoreService.js` (Lines 169-224)
- Added `createDiaryEntry()` - Save diary entries
- Added `getDiaryEntries()` - Fetch user's diary entries
- Added `getDiaryEntry()` - Fetch single diary entry

### 3. Firebase Collections Structure

```
users/
  {userId}/
    diaryEntries/         ← NEW: Chat-based diary entries with AI extraction
      {entryId}/
        - conversationText
        - userInput
        - extractedData
        - summary
        - messageCount
        - type
        - createdAt
        - updatedAt

    notes/                ← EXISTING: Manual notes
      {noteId}/
        - content
        - mood
        - createdAt
        - updatedAt
```

## Current Flow

### When User Clicks "Finish Session":

1. **ChatScreen.js** collects conversation and messages
2. **App.js** receives the data and calls `processDiaryEntry()`
3. **diaryService.js** processes the entry:
   - Extracts user messages only
   - Runs AI extraction (currently placeholder)
   - Generates summary
   - Saves to Firebase
4. **Success screen** is shown
5. User returns to home

## AI Extraction Status

### Current Implementation: Placeholder

The service currently uses basic keyword detection for:
- **Symptoms**: headache, fatigue, nausea, pain
- **Moods**: happy, sad, anxious, stressed
- **Score**: Based on emotional keywords

### Next Steps: Full AI Integration

You have two options to integrate the full AI extraction from `AI/Ai.js`:

#### Option 1: Firebase Cloud Functions (Recommended)

Deploy your AI extraction code as a Cloud Function:

```javascript
// In AI/functions.js (already exists!)
exports.processDiaryEntry = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const result = await processDiaryEntry(
    context.auth.uid,
    'User',
    data.message
  );

  return result;
});
```

Then update `diaryService.js`:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

async function extractHealthData(text) {
  const functions = getFunctions();
  const processEntry = httpsCallable(functions, 'processDiaryEntry');

  const result = await processEntry({ message: text });
  return result.data.extracted;
}
```

#### Option 2: Direct API Endpoint

Set up an API endpoint that runs the Genkit AI extraction:

```javascript
async function extractHealthData(text) {
  const response = await fetch('YOUR_API_ENDPOINT', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();
  return data.extractedData;
}
```

## Testing the Flow

### 1. Start the app and sign in
### 2. Navigate to the Chat tab
### 3. Have a conversation (at least 3 messages)
### 4. Click "Finish Session"
### 5. Check Firebase Console

**Expected Firebase Document:**
```
users/{userId}/diaryEntries/{entryId}
{
  "conversationText": "Me: I have a headache today...",
  "userInput": "I have a headache today and feeling stressed",
  "extractedData": {
    "symptoms": [{"name": "headache"}],
    "moods": {
      "overall": "negative",
      "score": 4,
      "emotions": ["stressed"]
    },
    "medications": [],
    "otherHealthChallenges": []
  },
  "summary": "Diary entry with 15 words. Mentioned 1 symptom(s): headache. Mood: negative (4/10), feeling stressed.",
  "messageCount": 5,
  "type": "chat",
  "createdAt": "2025-10-30T...",
  "updatedAt": "2025-10-30T..."
}
```

## Using the Data

### Display Recent Entries

```javascript
import { getDiaryEntries } from './services/diaryService';

const entries = await getDiaryEntries(userId, 10);
console.log('Recent entries:', entries.data);
```

### Generate Weekly Summary

The `AI/summary.js` module can aggregate entries:

```javascript
import { getWeeklySummary } from './AI/summary.js';

const summary = await getWeeklySummary(userId);
console.log('Weekly summary:', summary);
```

### Display Health Trends

```javascript
const entries = await getDiaryEntries(userId, 30);

// Get all symptoms from last 30 entries
const allSymptoms = entries.data.flatMap(entry =>
  entry.extractedData?.symptoms || []
);

// Count symptom frequency
const symptomCounts = {};
allSymptoms.forEach(s => {
  symptomCounts[s.name] = (symptomCounts[s.name] || 0) + 1;
});

console.log('Most common symptoms:', symptomCounts);
```

## Next Features to Build

1. **Display diary entries** on HistoryScreen
2. **Show extracted health data** in a visual format
3. **Weekly/Monthly summaries** screen
4. **Health trends chart** (symptoms over time, mood tracking)
5. **Export functionality** (PDF, CSV)
6. **Search/Filter entries** by date, mood, symptoms

## Benefits of This Implementation

✅ **Structured Data**: All health information is extracted and queryable
✅ **Trend Analysis**: Can aggregate symptoms, moods, medications over time
✅ **Separation**: Chat diary entries separate from manual notes
✅ **Scalable**: Ready to integrate full AI extraction
✅ **Firebase Native**: Uses Firestore collections properly
✅ **Future-Proof**: Schema matches the AI extraction output

## API Reference

### diaryService.js

#### `processDiaryEntry(userId, conversationText, messages)`
Process and save a complete diary entry with AI extraction.

**Parameters:**
- `userId` (string): User's ID
- `conversationText` (string): Full conversation text
- `messages` (array): Array of message objects

**Returns:** `Promise<{success, entryId, extractedData, summary}>`

#### `getRecentDiaryEntries(userId, limitCount)`
Get recent diary entries for a user.

**Parameters:**
- `userId` (string): User's ID
- `limitCount` (number): Number of entries to retrieve (default: 10)

**Returns:** `Promise<{success, data}>`

#### `getDiaryEntriesByDays(userId, days)`
Get diary entries from a specific time period.

**Parameters:**
- `userId` (string): User's ID
- `days` (number): Number of days to look back (default: 7)

**Returns:** `Promise<{success, data}>`

### firestoreService.js

#### `createDiaryEntry(userId, entryData)`
Create a diary entry with extracted health data.

#### `getDiaryEntries(userId, limitCount)`
Get all diary entries for a user.

#### `getDiaryEntry(userId, entryId)`
Get a single diary entry.

## Troubleshooting

### Issue: Entry not showing in Firebase
- Check console logs for errors
- Verify user is authenticated (`currentUser` exists)
- Check Firebase security rules allow writes to `diaryEntries`

### Issue: Extraction not working
- Currently uses placeholder extraction
- Integrate Cloud Function for real AI extraction
- Check `needsAIProcessing: true` flag in saved data

### Issue: Messages array empty
- Verify ChatScreen is passing messages array
- Check `handleFinishSession` in ChatScreen.js:180

## Firebase Security Rules

Add these rules to allow diary entry access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/diaryEntries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
