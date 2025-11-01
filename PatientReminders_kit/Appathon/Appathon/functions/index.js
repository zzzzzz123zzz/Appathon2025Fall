/* Appathon/Appathon/functions/index.js */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();

exports.reminderCron = onSchedule(
  { schedule: "every 5 minutes", timeZone: "UTC", region: "us-central1" },
  async () => {
    const db = admin.firestore();
    const now = new Date();
    const prefsSnap = await db.collectionGroup("reminderPrefs").get();

    const messages = [];
    for (const docSnap of prefsSnap.docs) {
      const prefs = docSnap.data() || {};
      const { reminderEnabled, timesLocal = [], timezone, lastJournalAt } = prefs;
      if (!reminderEnabled || !Array.isArray(timesLocal) || timesLocal.length === 0) continue;

      // parent user: users/{uid}
      const userRef = docSnap.ref.parent.parent;
      if (!userRef) continue;
      const userDoc = await userRef.get();
      const user = userDoc.data() || {};
      const expoPushToken = user.pushToken; // you should already be saving this

      if (!expoPushToken || typeof expoPushToken !== "string") continue;

      // local HH:mm for user
      const tz = timezone || "UTC";
      const fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
      const localHHmm = fmt.format(now);

      const windowMinutes = 3;
      const hit = timesLocal.some((t) => {
        const [th, tm] = t.split(":").map(Number);
        const [nh, nm] = localHHmm.split(":").map(Number);
        const diff = Math.abs((th * 60 + tm) - (nh * 60 + nm));
        return diff <= windowMinutes;
      });
      if (!hit) continue;

      if (lastJournalAt) {
        const minsSince = (Date.now() - Number(lastJournalAt)) / (1000 * 60);
        if (minsSince < 60) continue;
      }

      messages.push({
        to: expoPushToken,
        sound: "default",
        title: "Time to check in",
        body: "Take 30 seconds to journal how you feel.",
        data: { deeplink: "myapp://journal/new", reason: "scheduled" },
      });
    }

    // send to Expo push
    const chunkSize = 100;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      try {
        const res = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chunk),
        });
        if (!res.ok) {
          console.error("Expo push error", await res.text());
        }
      } catch (e) {
        console.error("Expo push fetch failed", e);
      }
    }
  }
);
