# Firebase Integration Guide

## How Firebase Auto-Creates Collections

Firebase Firestore **automatically creates collections and documents** when you write data to them. You don't need to manually create the database structure like in SQL databases.

### Key Concepts:
- **Collections** are created automatically when you add the first document
- **Documents** are created when you call `setDoc()` or `addDoc()`
- No schema definition needed - Firestore is schema-less

## Database Structure

Your app will have these collections:

```
firestore/
├── users/
│   └── {userId}/
│       ├── name: string
│       ├── email: string
│       ├── createdAt: timestamp
│       └── preferences: object
│
├── journalEntries/
│   └── {entryId}/
│       ├── userId: string
│       ├── content: string
│       ├── createdAt: timestamp
│       └── date: string
│
├── chatMessages/
│   └── {messageId}/
│       ├── userId: string
│       ├── message: string
│       ├── sender: string (user/ai)
│       └── timestamp: timestamp
│
└── summaries/
    └── {summaryId}/
        ├── userId: string
        ├── type: string (weekly/monthly)
        ├── startDate: string
        ├── endDate: string
        └── insights: array
```

## Usage Examples

### 1. Save a Journal Entry (NoteScreen.js)

Update your `NoteScreen.js` to save entries to Firebase:

\`\`\`javascript
import { saveJournalEntry } from '../utils/database';

const handleFinishEntry = async () => {
  if (noteText.trim().length > 0) {
    try {
      // Replace 'user123' with actual user ID from authentication
      const userId = 'user123';
      await saveJournalEntry(userId, noteText);

      if (onFinish) {
        onFinish(noteText);
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
      // Show error message to user
    }
  }
};
\`\`\`

### 2. Initialize User on Signup (SignupScreen.js)

When a user signs up, initialize their profile:

\`\`\`javascript
import { initializeUserProfile } from '../utils/database';

const handleSignup = async (userData) => {
  try {
    // After successful authentication
    const userId = 'user123'; // Get from Firebase Auth

    await initializeUserProfile(userId, {
      name: userData.name,
      email: userData.email,
      preferences: {
        theme: 'light',
        notificationsEnabled: true,
      },
    });

    // Navigate to next screen
  } catch (error) {
    console.error('Signup failed:', error);
  }
};
\`\`\`

### 3. Load Journal History (HistoryScreen.js)

Display user's journal entries:

\`\`\`javascript
import { useState, useEffect } from 'react';
import { getUserJournalEntries } from '../utils/database';

export default function HistoryScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const userId = 'user123'; // Get from auth
      const userEntries = await getUserJournalEntries(userId);
      setEntries(userEntries);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render entries...
}
\`\`\`

### 4. Save Chat Messages (ChatScreen.js)

Save conversations to Firestore:

\`\`\`javascript
import { saveChatMessage } from '../utils/database';

const sendMessage = async (messageText) => {
  try {
    const userId = 'user123';

    // Save user message
    await saveChatMessage(userId, messageText, 'user');

    // Get AI response...
    const aiResponse = 'AI response here';

    // Save AI response
    await saveChatMessage(userId, aiResponse, 'ai');
  } catch (error) {
    console.error('Failed to save message:', error);
  }
};
\`\`\`

## Testing with Seed Data

To populate your database with test data:

\`\`\`javascript
import { seedDatabaseForUser } from '../utils/seedDatabase';

// Call this once to populate test data
const seedData = async () => {
  const testUserId = 'test-user-123';
  await seedDatabaseForUser(testUserId);
  console.log('Database seeded with test data!');
};

// You can call this from a button or on app load
seedData();
\`\`\`

## Important Notes

1. **No manual collection creation needed** - Collections are created automatically when you add the first document

2. **User Authentication** - You should implement Firebase Authentication to get real user IDs. For now, you can use hardcoded IDs for testing.

3. **Error Handling** - Always wrap database calls in try-catch blocks

4. **Real-time Updates** - You can use Firestore's `onSnapshot()` for real-time data updates

5. **Security Rules** - Set up Firestore security rules in the Firebase Console to protect user data

## Next Steps

1. Add your Firebase credentials to `config/firebase.js`
2. Import database functions where needed
3. Replace hardcoded user IDs with real authentication
4. Test by creating journal entries and checking Firebase Console
