import AsyncStorage from '@react-native-async-storage/async-storage';
import { seedDatabaseForUser } from './seedDatabase';

/**
 * Auto-initialize database on first app launch
 * This checks if the app has been launched before, and if not,
 * it seeds the database with sample data
 */
export const autoInitializeDatabase = async (userId) => {
  try {
    const hasInitialized = await AsyncStorage.getItem('database_initialized');

    if (!hasInitialized) {
      console.log('First launch detected - initializing database...');

      // Seed the database with sample data
      const success = await seedDatabaseForUser(userId);

      if (success) {
        // Mark as initialized
        await AsyncStorage.setItem('database_initialized', 'true');
        console.log('Database auto-initialized successfully');
        return true;
      }
    } else {
      console.log('Database already initialized');
      return false;
    }
  } catch (error) {
    console.error('Error in auto-initialization:', error);
    return false;
  }
};

/**
 * Reset initialization flag (useful for testing)
 */
export const resetInitialization = async () => {
  try {
    await AsyncStorage.removeItem('database_initialized');
    console.log('Initialization flag reset');
  } catch (error) {
    console.error('Error resetting initialization:', error);
  }
};

/**
 * Check if database has been initialized
 */
export const isDatabaseInitialized = async () => {
  try {
    const hasInitialized = await AsyncStorage.getItem('database_initialized');
    return hasInitialized === 'true';
  } catch (error) {
    console.error('Error checking initialization:', error);
    return false;
  }
};
