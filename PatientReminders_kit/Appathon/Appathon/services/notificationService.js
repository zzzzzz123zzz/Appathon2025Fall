/**
 * Appathon/Appathon/services/notificationService.js
 * Centralized notification setup for Expo.
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let notificationListener = null;
let responseListener = null;

export async function registerForPushNotificationsAsync() {
  // Request permissions (iOS shows prompt; Android 13+ runtime perm)
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    console.warn("Notification permission not granted");
  }

  // Configure foreground behavior
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export function setupNotificationListeners({ onDeeplink }) {
  // Clear old listeners if any (hot reload safe)
  if (notificationListener) Notifications.removeNotificationSubscription(notificationListener);
  if (responseListener) Notifications.removeNotificationSubscription(responseListener);

  notificationListener = Notifications.addNotificationReceivedListener((_notification) => {
    // Optional analytics
  });

  responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    const dl = response?.notification?.request?.content?.data?.deeplink;
    if (typeof dl === "string" && dl.startsWith("myapp://") && typeof onDeeplink === "function") {
      onDeeplink(dl);
    }
  });
}

export function teardownNotificationListeners() {
  if (notificationListener) Notifications.removeNotificationSubscription(notificationListener);
  if (responseListener) Notifications.removeNotificationSubscription(responseListener);
  notificationListener = null;
  responseListener = null;
}
