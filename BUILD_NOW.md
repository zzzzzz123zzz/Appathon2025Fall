# 🚀 Build Your App NOW - Step by Step

## Current Status
✅ All code is ready
✅ EAS CLI installed
✅ Native code generated
✅ Push notifications implemented

## 📱 Let's Build for Android (15 minutes)

### Step 1: Login to Expo (First time only)

Open a terminal and run:
```bash
cd /Users/kuldeepdebnath/Documents/Github/Appathon/Appathon
eas login
```

- If you have an Expo account: Enter your credentials
- If not: Create one (free!) at https://expo.dev/signup

### Step 2: Configure the Project

```bash
eas build:configure
```

This will ask a few questions:
- "Select a platform": Choose **Android**
- Press Enter to confirm

### Step 3: Start the Build

```bash
eas build --profile development --platform android
```

This will:
1. Upload your code to EAS
2. Build the APK in the cloud (~10-15 minutes)
3. Give you a download link

**What to do while waiting:**
- The build runs in the cloud, you can close the terminal
- You'll get a link to track progress at expo.dev
- When done, you get a download link for the APK

### Step 4: Download and Install

When the build completes:
1. You'll see a QR code and download link
2. On your Android phone:
   - Open the download link
   - Download the APK
   - Install it (you may need to allow "Install from Unknown Sources")

### Step 5: Start the Dev Server

In your terminal:
```bash
cd /Users/kuldeepdebnath/Documents/Github/Appathon/Appathon
npx expo start --dev-client
```

### Step 6: Connect and Test

1. Open the installed app on your phone
2. It will ask for the dev server URL
3. Scan the QR code from the terminal OR enter the URL manually
4. The app loads!

### Step 7: Test Push Notifications

1. **On the mobile app:**
   - Log in as a patient
   - Grant notification permissions when asked
   - Check console: You should see the push token

2. **On the doctor portal** (http://localhost:3000):
   - Log in as a doctor
   - Select the patient
   - Click "Notify Patient" button
   - Enter title and message
   - Send!

3. **On your phone:**
   - 🔔 Notification appears!
   - Works in foreground, background, and closed app
   - **FULL push notification support!**

---

## 🍎 Want iOS Too?

### If you have a Mac with Xcode:
```bash
eas build --profile development --platform ios
```

### If you don't have an Apple Developer account:
- iOS builds require an Apple Developer account ($99/year)
- OR you can use the iOS Simulator on Mac (free, but no push notifications)

---

## ⚡ Quick Commands Summary

```bash
# 1. Login (first time)
eas login

# 2. Build for Android
eas build --profile development --platform android

# 3. Wait for build to complete (~15 min)

# 4. Download and install APK on your phone

# 5. Start dev server
npx expo start --dev-client

# 6. Open app and scan QR code

# 7. Test notifications!
```

---

## 🆘 Need Help?

### Build failed?
- Check expo.dev for error logs
- Run: `eas build:list` to see all builds

### Can't install APK?
- Go to Settings > Security > Enable "Install from Unknown Sources"

### App won't connect?
- Make sure phone and computer are on same WiFi
- Try entering the URL manually instead of QR code

### Notifications not working?
- Make sure you're on the development build (not Expo Go!)
- Check that push token is saved in Firestore
- Verify patient has granted notification permissions

---

## 🎯 Ready to Start?

Run this command to begin:

```bash
cd /Users/kuldeepdebnath/Documents/Github/Appathon/Appathon && eas login
```

After logging in, run:

```bash
eas build --profile development --platform android
```

Then relax for 15 minutes while it builds! ☕

When it's done, you'll have a fully functional app with working push notifications! 🎉
