/**
 * Appathon/Appathon/services/notificationService.js
 * Centralized notification setup for Expo.
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getAuth } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import Constants from "expo-constants";
import { db } from "../config/firebase";

let notificationListener = null;
let responseListener = null;

export async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Notification permission not granted");
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("doctor-alerts", {
      name: "Doctor Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export function setupNotificationListeners({ onDeeplink }) {
  if (notificationListener) {
    Notifications.removeNotificationSubscription(notificationListener);
  }
  if (responseListener) {
    Notifications.removeNotificationSubscription(responseListener);
  }

  notificationListener = Notifications.addNotificationReceivedListener(() => {
    // Optional analytics hook
  });

  responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    const dl = response?.notification?.request?.content?.data?.deeplink;
    if (typeof dl === "string" && dl.startsWith("myapp://") && typeof onDeeplink === "function") {
      onDeeplink(dl);
    }
  });
}

export function teardownNotificationListeners() {
  if (notificationListener) {
    Notifications.removeNotificationSubscription(notificationListener);
  }
  if (responseListener) {
    Notifications.removeNotificationSubscription(responseListener);
  }
  notificationListener = null;
  responseListener = null;
}

export async function captureAndSaveExpoPushToken() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return null;

  const projectId =
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId ||
    process.env.EXPO_PUBLIC_PROJECT_ID ||
    null;

  let tokenData;
  try {
    const tokenConfig = projectId
      ? { projectId }
      : Constants.experienceId
      ? { experienceId: Constants.experienceId }
      : undefined;

    tokenData = await Notifications.getExpoPushTokenAsync(tokenConfig);
  } catch (error) {
    console.error("Failed to obtain Expo push token:", error);
    if (error?.message?.includes('No "projectId" found')) {
      console.warn(
        "Set EXPO_PUBLIC_PROJECT_ID in your env or add extra.eas.projectId to app.json when using a development build."
      );
    }
    return null;
  }

  const token = tokenData?.data;
  if (!token) return null;

  const uid = getAuth().currentUser?.uid;
  if (uid) {
    await setDoc(
      doc(db, "users", uid),
      {
        pushToken: token,
        pushTokenUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  return token;
}
