import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDfc_kZmRFKRlQbQiAgXkDvfx0z15YEoJM",
  authDomain: "ai-health-journal-60978.firebaseapp.com",
  projectId: "ai-health-journal-60978",
  storageBucket: "ai-health-journal-60978.appspot.com",
  messagingSenderId: "952074679292",
  appId: "1:952074679292:web:c6b0d6325210d23195b879",
  measurementId: "G-Q9ZDDDB291"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage for persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { auth, db, storage };
