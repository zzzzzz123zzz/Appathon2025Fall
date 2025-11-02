import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import Constants from "expo-constants";

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
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Ask for permission if not already granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Failed to get push notification permissions");
      return { success: false, error: "Permission not granted" };
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("doctor-alerts", {
        name: "Doctor Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    // Get the Expo push token
    // Note: For Expo Go, we'll use the experienceId from Constants
    try {
      // Try to get projectId from app config or use experienceId
      const projectId =
        Constants?.easConfig?.projectId ||
        "2252ee7a-d671-4481-b7ab-1b57e4d3ff2a";

      console.log("🔍 Debug info:");
      console.log("  - Project ID:", projectId);
      console.log("  - Experience ID:", Constants.experienceId);
      console.log("  - App Owner:", Constants.expoConfig?.owner);
      console.log("  - App Slug:", Constants.expoConfig?.slug);

      // For Expo Go, we can use the experienceId format
      const tokenConfig = projectId
        ? { projectId }
        : Constants.experienceId
        ? { experienceId: Constants.experienceId }
        : undefined; // Let Expo auto-detect from manifest if possible

      console.log("📡 Requesting push token with config:", tokenConfig);

      const tokenData = await Notifications.getExpoPushTokenAsync(tokenConfig);

      const token = tokenData.data;
      console.log("📱 Expo Push Token:", token);

      return { success: true, token };
    } catch (tokenError) {
      console.error("⚠️ Could not get push token:", tokenError);
      console.error("Error details:", tokenError.message);
      if (tokenError?.message?.includes('No "projectId" found')) {
        console.warn(
          "💡 Set EXPO_PUBLIC_PROJECT_ID in your env or add extra.eas.projectId to app.json for bare/dev builds."
        );
      } else {
        console.warn(
          "💡 Verify the Expo Go client is running and connected to the internet"
        );
      }
      return {
        success: false,
        error: `Push token error: ${tokenError.message}`,
      };
    }
  } catch (error) {
    console.error("Error getting push token:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Save the push token to Firestore for the current user
 * Supports multiple devices - adds token to array if not already present
 */
export async function savePushToken(userId, token) {
  try {
    const { getDoc, setDoc, arrayUnion } = await import("firebase/firestore");
    const userRef = doc(db, "users", userId);

    // Get current user document
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.warn("User document does not exist, creating new one");
      await setDoc(userRef, {
        pushTokens: [
          {
            token: token,
            deviceId: null,
            addedAt: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
          },
        ],
        pushToken: token, // Keep for backward compatibility
        pushTokenUpdatedAt: new Date().toISOString(),
      });
    } else {
      const userData = userDoc.data();
      const existingTokens = userData.pushTokens || [];

      // Check if this token already exists
      const tokenExists = existingTokens.some((t) => t.token === token);

      if (tokenExists) {
        console.log("📱 Token already registered, updating lastUsed timestamp");
        // Update the lastUsed timestamp for this token
        const updatedTokens = existingTokens.map((t) =>
          t.token === token
            ? { ...t, lastUsed: new Date().toISOString() }
            : t
        );

        await updateDoc(userRef, {
          pushTokens: updatedTokens,
          pushToken: token, // Update primary token for backward compatibility
          pushTokenUpdatedAt: new Date().toISOString(),
        });
      } else {
        console.log("📱 Adding new device token to user account");
        // Add new token to the array
        await updateDoc(userRef, {
          pushTokens: arrayUnion({
            token: token,
            deviceId: null,
            addedAt: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
          }),
          pushToken: token, // Update primary token for backward compatibility
          pushTokenUpdatedAt: new Date().toISOString(),
        });
      }
    }

    console.log("✅ Push token saved to Firestore");
    return { success: true };
  } catch (error) {
    console.error("Error saving push token:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived,
  onNotificationTapped
) {
  // Listen for notifications received while app is in foreground
  const receivedListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("📨 Notification received:", notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Listen for user tapping on notification
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("👆 Notification tapped:", response);
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    });

  // Return cleanup function
  return () => {
    // Use the correct method to remove subscriptions
    if (receivedListener && receivedListener.remove) {
      receivedListener.remove();
    }
    if (responseListener && responseListener.remove) {
      responseListener.remove();
    }
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
    console.error("Error scheduling notification:", error);
    return { success: false, error: error.message };
  }
}
