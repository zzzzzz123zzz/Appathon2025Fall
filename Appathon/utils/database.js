import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Database Collections
 */
export const COLLECTIONS = {
  USERS: 'users',
  JOURNAL_ENTRIES: 'journalEntries',
  CHAT_MESSAGES: 'chatMessages',
  SUMMARIES: 'summaries',
};

/**
 * Initialize user profile in Firestore
 * This automatically creates the users collection if it doesn't exist
 */
export const initializeUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);

    // Check if user already exists
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create new user profile
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('User profile created successfully');
    } else {
      console.log('User profile already exists');
    }

    return userRef.id;
  } catch (error) {
    console.error('Error initializing user profile:', error);
    throw error;
  }
};

/**
 * Save a journal entry
 * Automatically creates the journalEntries collection if it doesn't exist
 */
export const saveJournalEntry = async (userId, noteText) => {
  try {
    const journalRef = collection(db, COLLECTIONS.JOURNAL_ENTRIES);

    const entry = {
      userId,
      content: noteText,
      createdAt: serverTimestamp(),
      date: new Date().toISOString(),
    };

    const docRef = await addDoc(journalRef, entry);
    console.log('Journal entry saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving journal entry:', error);
    throw error;
  }
};

/**
 * Get all journal entries for a user
 */
export const getUserJournalEntries = async (userId) => {
  try {
    const journalRef = collection(db, COLLECTIONS.JOURNAL_ENTRIES);
    const q = query(
      journalRef,
      where('userId', '==', userId),
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

    return entries;
  } catch (error) {
    console.error('Error getting journal entries:', error);
    throw error;
  }
};

/**
 * Save a chat message
 * Automatically creates the chatMessages collection if it doesn't exist
 */
export const saveChatMessage = async (userId, message, sender = 'user') => {
  try {
    const chatRef = collection(db, COLLECTIONS.CHAT_MESSAGES);

    const chatMessage = {
      userId,
      message,
      sender, // 'user' or 'ai'
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(chatRef, chatMessage);
    console.log('Chat message saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving chat message:', error);
    throw error;
  }
};

/**
 * Get chat history for a user
 */
export const getUserChatHistory = async (userId) => {
  try {
    const chatRef = collection(db, COLLECTIONS.CHAT_MESSAGES);
    const q = query(
      chatRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const messages = [];

    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return messages;
  } catch (error) {
    console.error('Error getting chat history:', error);
    throw error;
  }
};

/**
 * Save a weekly/monthly summary
 */
export const saveSummary = async (userId, summaryData) => {
  try {
    const summaryRef = collection(db, COLLECTIONS.SUMMARIES);

    const summary = {
      userId,
      ...summaryData,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(summaryRef, summary);
    console.log('Summary saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving summary:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);

    await setDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log('User profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        ...userSnap.data(),
      };
    } else {
      console.log('No user profile found');
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};
