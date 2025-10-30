import { initializeUserProfile, saveJournalEntry, saveSummary } from './database';

/**
 * Seed database with example data for testing
 * Call this function once when you want to populate the database
 */
export const seedDatabaseForUser = async (userId) => {
  try {
    console.log('Starting database seeding for user:', userId);

    // 1. Create user profile
    await initializeUserProfile(userId, {
      name: 'Theodore',
      email: 'theodore@example.com',
      preferences: {
        theme: 'light',
        notificationsEnabled: true,
      },
    });

    // 2. Create sample journal entries
    const sampleEntries = [
      'Today was a great day! I learned so much about React Native and Firebase.',
      'Feeling grateful for all the support from my friends and family.',
      'Had an interesting conversation about mindfulness and mental health today.',
    ];

    for (const entry of sampleEntries) {
      await saveJournalEntry(userId, entry);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 3. Create a sample summary
    await saveSummary(userId, {
      type: 'weekly',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      entryCount: 3,
      insights: [
        'You focused on personal growth this week',
        'Gratitude was a recurring theme',
        'Social connections were important',
      ],
    });

    console.log('Database seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
};

/**
 * Initialize database for a new user
 * This is typically called after user signup/authentication
 */
export const initializeNewUser = async (userId, userData) => {
  try {
    await initializeUserProfile(userId, {
      name: userData.name || 'User',
      email: userData.email || '',
      preferences: {
        theme: 'light',
        notificationsEnabled: true,
      },
    });

    console.log('New user initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing new user:', error);
    return false;
  }
};
