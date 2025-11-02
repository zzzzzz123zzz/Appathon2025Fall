// Test script to verify Firebase Storage is properly set up
// Run with: node scripts/testFirebaseStorage.js

const { initializeApp } = require('firebase/app');
const { getStorage, ref, listAll } = require('firebase/storage');

const firebaseConfig = {
  apiKey: "AIzaSyDfc_kZmRFKRlQbQiAgXkDvfx0z15YEoJM",
  authDomain: "ai-health-journal-60978.firebaseapp.com",
  projectId: "ai-health-journal-60978",
  storageBucket: "ai-health-journal-60978.appspot.com",
  messagingSenderId: "952074679292",
  appId: "1:952074679292:web:c6b0d6325210d23195b879",
  measurementId: "G-Q9ZDDDB291"
};

async function testStorage() {
  console.log('🔍 Testing Firebase Storage Setup...\n');

  try {
    console.log('✅ Step 1: Initializing Firebase app...');
    const app = initializeApp(firebaseConfig);
    console.log('   App initialized successfully');

    console.log('\n✅ Step 2: Getting Storage instance...');
    const storage = getStorage(app);
    console.log('   Storage instance created');
    console.log('   Storage bucket:', storage._bucket);

    console.log('\n✅ Step 3: Testing connection to storage bucket...');
    const storageRef = ref(storage);

    // Try to list files (this will fail if storage isn't enabled)
    await listAll(storageRef);

    console.log('   ✅ SUCCESS! Storage bucket exists and is accessible!');
    console.log('\n🎉 Firebase Storage is properly set up!');
    console.log('   Your app should now be able to upload images.');

  } catch (error) {
    console.error('\n❌ ERROR: Firebase Storage is NOT set up properly\n');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    if (error.code === 'storage/bucket-not-found' || error.message.includes('404')) {
      console.log('\n🔧 SOLUTION:');
      console.log('   Firebase Storage has NOT been initialized in Firebase Console.');
      console.log('   You MUST do this manually:\n');
      console.log('   1. Go to: https://console.firebase.google.com/project/ai-health-journal-60978/storage');
      console.log('   2. Click the "Get started" button');
      console.log('   3. Choose "Start in production mode" → Next');
      console.log('   4. Select a location (us-central1 recommended) → Done');
      console.log('   5. Wait 30 seconds for setup to complete');
      console.log('   6. Go to Rules tab and set up security rules');
      console.log('   7. Run this test script again\n');
    } else if (error.code === 'storage/unauthorized') {
      console.log('\n🔧 SOLUTION:');
      console.log('   Storage is enabled but security rules are blocking access.');
      console.log('   Go to: https://console.firebase.google.com/project/ai-health-journal-60978/storage/rules');
      console.log('   And set up the security rules as instructed.\n');
    }
  }
}

testStorage();
