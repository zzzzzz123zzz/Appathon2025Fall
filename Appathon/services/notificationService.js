import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions from the user
 */
export async function registerForPushNotifications() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Ask for permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions');
      return { success: false, error: 'Permission not granted' };
    }

    // Get the Expo push token
    // Note: This will fail in Expo Go on SDK 53+
    // Use a development build for full push notification support
    try {
      // projectId will be automatically read from app.json extra.eas.projectId
      const tokenData = await Notifications.getExpoPushTokenAsync();

      const token = tokenData.data;
      console.log('📱 Expo Push Token:', token);

      return { success: true, token };
    } catch (tokenError) {
      console.warn('⚠️ Could not get push token (Expo Go limitation on SDK 53+)');
      console.warn('💡 For full push notification support, create a development build');
      console.warn('   Run: npx expo install expo-dev-client && eas build');
      return { success: false, error: 'Push notifications require a development build in SDK 53+' };
    }
  } catch (error) {
    console.error('Error getting push token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save the push token to Firestore for the current user
 */
export async function savePushToken(userId, token) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      pushToken: token,
      pushTokenUpdatedAt: new Date().toISOString(),
    });

    console.log('✅ Push token saved to Firestore');
    return { success: true };
  } catch (error) {
    console.error('Error saving push token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(onNotificationReceived, onNotificationTapped) {
  // Listen for notifications received while app is in foreground
  const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('📨 Notification received:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listen for user tapping on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('👆 Notification tapped:', response);
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(receivedListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(title, body, data = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // null means show immediately
    });

    return { success: true };
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return { success: false, error: error.message };
  }
}
