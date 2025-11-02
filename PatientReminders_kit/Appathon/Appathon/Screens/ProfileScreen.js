// Appathon/Appathon/Screens/ProfileScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, Switch, Button, Alert, ScrollView } from "react-native";
import * as Notifications from "expo-notifications";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { registerForPushNotificationsAsync, setupNotificationListeners } from "../services/notificationService";
import { saveReminderPrefs, scheduleLocalReminders, generateTimes, cancelAllReminders } from "../services/reminderService";

export default function ProfileScreen({ navigation }) {
  const auth = getAuth();
  const uid = auth?.currentUser?.uid;
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (!uid) return;
        const snap = await getDoc(doc(db, "users", uid, "reminderPrefs", "prefs"));
        if (snap.exists()) {
          const d = snap.data();
          setNotificationsEnabled(!!d.reminderEnabled);
          setReminderFrequency(d.frequencyPerDay || 1);
        }
      } catch (e) {
        console.warn("load prefs error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  useEffect(() => {
    registerForPushNotificationsAsync();
    setupNotificationListeners({
      onDeeplink: (dl) => {
        try {
          const target = "NoteScreen"; // change to your journal compose screen
          navigation?.navigate?.(target);
        } catch {}
      },
    });
  }, []);

  async function applyReminderSettings(enabled, freq) {
    if (!uid) {
      Alert.alert("Login required", "Please sign in to set reminders.");
      return;
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const times = generateTimes(freq);

    await saveReminderPrefs(uid, {
      enabled,
      frequency: freq,
      timesLocal: times,
      timezone: tz,
    });

    if (enabled) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        setNotificationsEnabled(false);
        Alert.alert("Permission needed", "Enable notifications in Settings to receive reminders.");
        return;
      }
      await scheduleLocalReminders(times);
      Alert.alert("Saved", `Scheduled ${freq} daily reminder(s).`);
    } else {
      await cancelAllReminders();
      Alert.alert("Saved", "Reminders disabled.");
    }
  }

  if (loading) {
    return <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}><Text>Loading…</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Profile</Text>

      <View style={{ padding: 16, backgroundColor: "#fff", borderRadius: 12, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Push Notifications</Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text>Enable reminders</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={async (val) => {
              setNotificationsEnabled(val);
              await applyReminderSettings(val, reminderFrequency);
            }}
          />
        </View>

        <Text style={{ marginTop: 8 }}>Daily Reminders</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[1,2,3].map((n) => (
            <View key={n} style={{ marginRight: 8 }}>
              <Button
                title={`${n}x`}
                onPress={async () => {
                  setReminderFrequency(n);
                  if (notificationsEnabled) await applyReminderSettings(true, n);
                }}
                color={reminderFrequency === n ? "#2563eb" : undefined}
              />
            </View>
          ))}
        </View>

        <Text style={{ color: "#555", marginTop: 12 }}>
          We’ll schedule evenly-spaced reminders between 8am and 10pm local time.
        </Text>
      </View>
    </ScrollView>
  );
}
