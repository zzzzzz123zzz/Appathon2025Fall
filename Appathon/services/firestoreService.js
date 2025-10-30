import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ===== USER PROFILE =====

// Create or update user profile
export const saveUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error saving user profile:', error);
    return { success: false, error: error.message };
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};

// ===== QUIZ DATA =====

// Save quiz data
export const saveQuizData = async (userId, quizData) => {
  try {
    const quizRef = doc(db, 'users', userId, 'quizData', 'responses');
    await setDoc(quizRef, {
      ...quizData,
      completedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving quiz data:', error);
    return { success: false, error: error.message };
  }
};

// Get quiz data
export const getQuizData = async (userId) => {
  try {
    const quizRef = doc(db, 'users', userId, 'quizData', 'responses');
    const quizSnap = await getDoc(quizRef);

    if (quizSnap.exists()) {
      return { success: true, data: quizSnap.data() };
    } else {
      return { success: false, error: 'Quiz data not found' };
    }
  } catch (error) {
    console.error('Error getting quiz data:', error);
    return { success: false, error: error.message };
  }
};

// ===== NOTES/JOURNAL ENTRIES =====

// Create a new note
export const createNote = async (userId, noteData) => {
  try {
    const notesRef = collection(db, 'users', userId, 'notes');
    const docRef = await addDoc(notesRef, {
      ...noteData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, noteId: docRef.id };
  } catch (error) {
    console.error('Error creating note:', error);
    return { success: false, error: error.message };
  }
};

// Get all notes for a user
export const getUserNotes = async (userId) => {
  try {
    const notesRef = collection(db, 'users', userId, 'notes');
    const q = query(notesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const notes = [];
    querySnapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, data: notes };
  } catch (error) {
    console.error('Error getting notes:', error);
    return { success: false, error: error.message };
  }
};

// Get a single note
export const getNote = async (userId, noteId) => {
  try {
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    const noteSnap = await getDoc(noteRef);

    if (noteSnap.exists()) {
      return { success: true, data: { id: noteSnap.id, ...noteSnap.data() } };
    } else {
      return { success: false, error: 'Note not found' };
    }
  } catch (error) {
    console.error('Error getting note:', error);
    return { success: false, error: error.message };
  }
};

// Update a note
export const updateNote = async (userId, noteId, noteData) => {
  try {
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    await updateDoc(noteRef, {
      ...noteData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating note:', error);
    return { success: false, error: error.message };
  }
};

// Delete a note
export const deleteNote = async (userId, noteId) => {
  try {
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    await deleteDoc(noteRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting note:', error);
    return { success: false, error: error.message };
  }
};
