# Full AI Extraction Setup Guide

## Current Status

✅ **Improved Keyword Detection** - Now detects 30+ symptoms including:
- Heart palpitations ✓
- Chest pain, shortness of breath
- Dizziness, migraines
- Nausea, vomiting, stomach pain
- Fatigue, weakness, insomnia
- Back pain, joint pain, muscle pain
- Cough, sore throat, fever
- Plus mood detection and medications

✅ **Cloud Function Created** - Ready to deploy for full AI extraction

## What's Working NOW (Without Deployment)

Your app is already working with **enhanced keyword detection**! When you write "I am having heart palpitations", it will:

1. ✅ Detect the symptom: `{ name: "heart palpitations", degree: "moderate" }`
2. ✅ Save to Firebase under `users/{userId}/diaryEntries`
3. ✅ Show success alert with symptom count
4. ✅ Extract mood and emotions

### Test It Now:

1. **Reload your app** (press `r` in Expo terminal)
2. **Click "+ New Entry"**
3. **Type**: "I am having heart palpitations and feeling stressed"
4. **Click "Finish Entry"**
5. **Check logs** - You should see:
```
📝 Extracted data: {
  symptoms: [{ name: "heart palpitations", degree: "moderate" }],
  moods: { overall: "negative", score: 4, emotions: ["stressed"] }
}
```

### Check Firebase:

Go to: `Firestore Database` → `users` → `{your_user_id}` → `diaryEntries`

You'll see:
```javascript
{
  userInput: "I am having heart palpitations and feeling stressed",
  extractedData: {
    symptoms: [
      { name: "heart palpitations", degree: "moderate" }
    ],
    moods: {
      overall: "negative",
      score: 4,
      emotions: ["stressed"]
    },
    medications: [],
    otherHealthChallenges: [],
    extractionMethod: "keyword-placeholder"  // Shows it's using keyword detection
  },
  type: "note",
  createdAt: ...
}
```

## Upgrade to Full AI Extraction (Optional)

The keyword detection works well, but for even better accuracy, you can deploy the Cloud Function to use Gemini AI.

### Benefits of Full AI Extraction:

- ✨ **Better Understanding**: Detects symptoms not in keyword list
- ✨ **Context Awareness**: Understands "my headache is getting worse" → degree: "worsening"
- ✨ **Duration Detection**: Extracts "for 3 days", "since yesterday"
- ✨ **Medication Parsing**: Better detects dosages and timing
- ✨ **Natural Language**: Handles complex sentences better

### Deployment Steps:

#### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### 2. Login to Firebase

```bash
firebase login
```

#### 3. Initialize Firebase Functions

In your project root:

```bash
cd C:\Users\Veges\OneDrive\Documents\GitHub\Appathon\Appathon
firebase init functions
```

Select:
- **Use an existing project**: ai-health-journal-60978
- **Language**: JavaScript
- **ESLint**: No (optional)
- **Install dependencies**: Yes

#### 4. Set Google AI API Key

Get your API key from: https://aistudio.google.com/app/apikey

```bash
firebase functions:config:set google_ai.api_key="YOUR_API_KEY_HERE"
```

#### 5. Install Dependencies

```bash
cd functions
npm install
```

#### 6. Deploy the Function

```bash
firebase deploy --only functions
```

This will output URLs like:
```
✔  functions[extractHealthData(us-central1)] deployed
   https://us-central1-ai-health-journal-60978.cloudfunctions.net/extractHealthData
```

#### 7. Update diaryService.js

Replace the `extractHealthDataPlaceholder` call with the Cloud Function:

```javascript
// At the top of diaryService.js
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../config/firebase';

// In processDiaryEntry function, replace line 51:
// const extractedData = await extractHealthDataPlaceholder(userMessages || conversationText);

// With:
const functions = getFunctions(app);
const extractHealthData = httpsCallable(functions, 'extractHealthData');

try {
  const result = await extractHealthData({ text: userMessages || conversationText });
  const extractedData = result.data.extractedData;
} catch (error) {
  console.warn('⚠️ Cloud Function failed, falling back to keyword detection:', error);
  // Fallback to keyword detection if Cloud Function fails
  const extractedData = await extractHealthDataPlaceholder(userMessages || conversationText);
}
```

#### 8. Test Full AI Extraction

After deploying, try complex entries:

```
"My migraine has been getting progressively worse over the past 3 days.
I'm taking ibuprofen 400mg twice daily but it's not helping much.
Feeling really anxious about it."
```

Expected extraction:
```javascript
{
  symptoms: [
    { name: "migraine", duration: "3 days", degree: "worsening" }
  ],
  moods: {
    overall: "negative",
    score: 3,
    emotions: ["anxious"]
  },
  medications: [
    { name: "ibuprofen", dosage: "400mg", taken: true, time: "twice daily" }
  ],
  extractionMethod: "genkit-ai"  // Shows it's using AI
}
```

## Comparison

### Keyword Detection (Current - Free)
✅ Fast
✅ Free (no API costs)
✅ Works offline
✅ Detects 30+ common symptoms
❌ Limited to predefined keywords
❌ No context understanding
❌ Can't detect duration/dosage

### AI Extraction (Optional - Better Accuracy)
✅ Detects any symptom mentioned
✅ Understands context and severity
✅ Extracts duration, dosage, timing
✅ Handles complex sentences
❌ Requires internet
❌ API costs (very low - ~$0.0001 per entry)
❌ Slightly slower (1-2 seconds)

## Cost Estimate

Using Gemini 1.5 Flash (current model):
- **Input**: $0.075 per 1M characters
- **Output**: $0.30 per 1M characters
- **Average diary entry**: ~500 characters input, ~200 characters output
- **Cost per entry**: ~$0.0001 (one hundredth of a cent)
- **For 1000 entries**: ~$0.10

**Recommendation**: Start with keyword detection (current), upgrade to AI later if needed.

## Troubleshooting

### "heart palpitations" not detected?

1. Check logs for: `📝 Extracted data:`
2. Verify the text includes the exact phrase "heart palpitation" or "palpitation"
3. Make sure you reloaded the app after the update

### Cloud Function deployment failed?

1. Make sure Firebase CLI is installed: `firebase --version`
2. Check you're logged in: `firebase login`
3. Verify project selected: `firebase use ai-health-journal-60978`
4. Check billing is enabled in Firebase Console

### Data not saving to Firebase?

1. Update Firebase Security Rules (see DIARY_ENTRY_INTEGRATION.md)
2. Check user is authenticated in console logs
3. Look for error messages in the alert popup

## Summary

🎉 **Your app already detects "heart palpitations" and 30+ other symptoms!**

Just reload your app and test it now. The keyword detection is working and saving everything to Firebase.

If you want even better accuracy with AI, follow the deployment steps above, but it's optional - the current system works great for most use cases!
