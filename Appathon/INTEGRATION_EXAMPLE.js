/**
 * EXAMPLE: How to integrate auto-initialization into App.js
 *
 * This file shows you how to modify your App.js to automatically
 * populate the Firebase database on first launch
 */

import { useState, useEffect, useRef } from "react";
import { View, Text } from "react-native";
import './config/firebase';
import { autoInitializeDatabase } from './utils/autoInitialize';

function MainApp() {
  const [screen, setScreen] = useState("loading");
  const hasAutoInitialized = useRef(false);

  // Auto-initialize database on app load
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // TODO: Replace with actual user ID from Firebase Auth
        const userId = 'demo-user-123';

        // This will only run on first app launch
        const wasInitialized = await autoInitializeDatabase(userId);

        if (wasInitialized) {
          console.log('✅ Database populated with sample data!');
          console.log('Check your Firebase Console to see the data.');
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    // Only run once
    if (!hasAutoInitialized.current) {
      hasAutoInitialized.current = true;
      initializeApp();
    }
  }, []);

  // Rest of your app code...
  return (
    <View>
      <Text>Your app content here</Text>
    </View>
  );
}

export default MainApp;

/**
 * ALTERNATIVE: Manual initialization with a button
 *
 * If you prefer to manually trigger database seeding (for testing),
 * you can use this approach:
 */

import { TouchableOpacity, Text } from 'react-native';
import { seedDatabaseForUser } from './utils/seedDatabase';

function TestingScreen() {
  const handleSeedDatabase = async () => {
    const userId = 'test-user-123';
    const success = await seedDatabaseForUser(userId);

    if (success) {
      alert('Database seeded successfully! Check Firebase Console.');
    } else {
      alert('Failed to seed database. Check console for errors.');
    }
  };

  return (
    <TouchableOpacity onPress={handleSeedDatabase}>
      <Text>Seed Database with Test Data</Text>
    </TouchableOpacity>
  );
}

/**
 * IMPORTANT NOTES:
 *
 * 1. Replace 'demo-user-123' with actual user ID from Firebase Authentication
 * 2. Make sure your Firebase credentials are added to config/firebase.js
 * 3. The auto-initialization only runs ONCE on first app launch
 * 4. To reset and re-seed, call resetInitialization() from utils/autoInitialize
 * 5. Check Firebase Console (https://console.firebase.google.com) to verify data
 */
