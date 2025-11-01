// Appathon/Appathon/services/reminderService.js
import * as Notifications from "expo-notifications";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

/** Generate n evenly-spaced "HH:mm" times between startHour and endHour (24h). */
export function generateTimes(n, startHour = 8, endHour = 22) {
  const spanMin = (endHour - startHour) * 60;
  const step = Math.floor(spanMin / n);
  return Array.from({ length: n }, (_, i) => {
    const mins = startHour * 60 + i * step;
    const hh = String(Math.floor(mins / 60)).padStart(2, "0");
    const mm = String(mins % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  });
}

export async function cancelAllReminders() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn("cancelAllReminders error:", e);
  }
}

/** Schedule daily repeating local notifications at each "HH:mm". */
export async function scheduleLocalReminders(timesHHmm) {
  await cancelAllReminders();
  for (const t of timesHHmm) {
    const [hh, mm] = t.split(":").map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily check-in",
        body: "Quick journal: how are you feeling right now?",
        data: { deeplink: "myapp://journal/new" },
      },
      trigger: { hour: hh, minute: mm, repeats: true },
    });
  }
}

/** Save reminder prefs under users/{uid}/reminderPrefs/prefs */
export async function saveReminderPrefs(uid, { enabled, frequency, timesLocal, timezone }) {
  const ref = doc(db, "users", uid, "reminderPrefs", "prefs");
  await setDoc(
    ref,
    {
      reminderEnabled: !!enabled,
      frequencyPerDay: Number(frequency || 1),
      timesLocal: timesLocal || [],
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
