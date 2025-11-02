# Development Build Instructions

## ✅ What's Been Done

1. ✅ Installed `expo-dev-client`
2. ✅ Created `eas.json` configuration
3. ✅ Updated `app.json` with proper settings
4. ✅ Generated native Android code (ready to build!)
5. ⚠️ iOS native code generated (CocoaPods needs SSL fix)

## 🚀 Quick Start: Build for Android (Recommended)

Since you have a working Android setup, let's build for Android first:

### Option 1: Local Android Build (Fastest - if you have Android Studio)

```bash
cd Appathon

# Start the dev server
npx expo start --dev-client

# In another terminal, build and run on Android
npx expo run:android
```

This will:
- Build the app with your Android Studio/SDK
- Install it on connected Android device or emulator
- Launch the app with dev client
- **Full push notification support!**

**Requirements:**
- Android Studio installed
- Android SDK configured
- Either Android device connected via USB OR Android emulator running

---

### Option 2: EAS Build (Cloud Build - No Android Studio needed)

This builds in the cloud and gives you a downloadable APK:

```bash
# First time: Login to Expo
npx eas-cli login

# Build for Android
npx eas build --profile development --platform android
```

**What happens:**
1. Code uploaded to EAS servers
2. App built in the cloud (~10-15 minutes)
3. You get a download link for the APK
4. Install APK on your Android device
5. Run `npx expo start --dev-client` to connect

**Advantages:**
- No local Android Studio needed
- Can build while doing other work
- Same APK works on all Android devices

---

## 🍎 iOS Build (If you need it)

### Fix CocoaPods SSL Issue First:

```bash
# Option A: Disable SSL verification temporarily (quick fix)
cd Appathon/ios
pod install --repo-update --insecure

# Option B: Update certificates (better)
cd ~/
brew update
brew reinstall openssl
```

Then:

```bash
# If you have Xcode and Mac
npx expo run:ios

# OR use EAS cloud build
npx eas build --profile development --platform ios
```

**Note:** iOS builds require:
- Mac computer with Xcode
- OR Apple Developer account ($99/year) for EAS build

---

## 📱 Testing Push Notifications

Once you have the development build installed:

### 1. Start the Development Server
```bash
cd Appathon
npx expo start --dev-client
```

### 2. Open the App
- The app will automatically connect to the dev server
- Log in as a patient
- Grant notification permissions

### 3. Check the Console
You should see:
```
📱 Expo Push Token: ExponentPushToken[xxxxxxxxxxxxxx]
✅ Push token saved to Firestore
```

### 4. Send a Notification
- Open Doctor Portal at http://localhost:3000
- Select the patient
- Click "Notify Patient"
- Send a test notification

### 5. Receive Notification
- Notification appears on the device!
- Works in foreground, background, and when app is closed
- **Full production-quality push notifications!**

---

## 🎯 Recommended Path for Quick Demo

**For Android users:**
```bash
# Terminal 1: Start the dev server
cd Appathon
npx expo start --dev-client

# Terminal 2: Build and install
npx expo run:android
```

**If you don't have Android Studio:**
```bash
# Start the EAS build (10-15 min)
npx eas build --profile development --platform android

# While it builds, keep the dev server ready
npx expo start --dev-client

# When build completes, download and install the APK
# Then the app connects to your dev server
```

---

## 🔧 Troubleshooting

### "Unable to find local SDK"
Install Android Studio and set up the Android SDK.

### "No devices found"
- For physical device: Enable USB debugging
- For emulator: Start an emulator in Android Studio

### "Pod install failed"
```bash
cd Appathon/ios
rm -rf Pods Podfile.lock
pod install --insecure
```

### "EAS CLI not found"
```bash
npm install -g eas-cli
eas login
```

---

## 📦 What You Get

With the development build:
- ✅ Full push notification support
- ✅ All native features work
- ✅ Fast refresh still works
- ✅ Can update JS code without rebuilding
- ✅ Production-ready testing environment

The only time you need to rebuild is when:
- You add new native dependencies
- You change native configuration
- You want to update the app version

---

## 🚀 Next Steps

1. **Build for Android** (easiest)
2. **Test push notifications** end-to-end
3. **If needed**, build for iOS later

Ready to build? Choose your path:
- Have Android Studio? → `npx expo run:android`
- No Android Studio? → `npx eas build --profile development --platform android`

Let's get those notifications working! 🔔
