import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDfc_kZmRFKRlQbQiAgXkDvfx0z15YEoJM",
  authDomain: "ai-health-journal-60978.firebaseapp.com",
  projectId: "ai-health-journal-60978",
  storageBucket: "ai-health-journal-60978.appspot.com",
  messagingSenderId: "952074679292",
  appId: "1:952074679292:web:c6b0d6325210d23195b879",
  measurementId: "G-Q9ZDDDB291"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
