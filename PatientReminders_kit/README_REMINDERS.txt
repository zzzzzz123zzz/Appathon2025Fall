# Patient Reminders Drop‑in Kit

## Copy these into your repo (overwrite if asked):
- Appathon/Appathon/services/reminderService.js
- Appathon/Appathon/services/notificationService.js
- Appathon/Appathon/Screens/ProfileScreen.js
- Appathon/Appathon/app.json
- Appathon/Appathon/functions/index.js

## Install deps (Expo app)
cd Appathon/Appathon
npx expo install expo-notifications

## Optional: Deploy scheduled function
cd Appathon/Appathon/functions
npm i
npx firebase deploy --only functions

## Notes
- ProfileScreen now includes a toggle and 1x/2x/3x buttons.
- Reminders are evenly spaced between 08:00–22:00 local time.
- We save prefs to users/{uid}/reminderPrefs/prefs.
- On tap, we navigate to "NoteScreen" — change that name if needed.
