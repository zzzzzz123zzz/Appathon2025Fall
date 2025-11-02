# Push Notifications Setup Guide

This guide explains how the push notification feature works and how to test it.

## Overview

Doctors can now send push notifications to patients directly from the Doctor Portal. The patient receives the notification on their mobile phone.

## Architecture

1. **Mobile App (Appathon)**: Registers for push notifications and stores the Expo push token in Firestore
2. **Doctor Portal**: Has a "Notify Patient" button that sends notifications via the API
3. **API Endpoint**: `/api/send-notification` sends push notifications using Expo's push service
4. **Expo Push Service**: Delivers notifications to patient devices

## Files Modified/Created

### Mobile App (Appathon/)
- `services/notificationService.js` - NEW: Handles push notification registration and listeners
- `App.js` - Updated: Registers for push notifications when user logs in
- `app.json` - Updated: Added notification configuration
- `package.json` - Updated: Added expo-notifications dependency

### Doctor Portal (doctor-portal/)
- `lib/types.ts` - Updated: Added pushToken fields to Patient interface
- `components/Dashboard.tsx` - Updated: Added notification button and modal
- `app/api/send-notification/route.ts` - NEW: API endpoint to send push notifications

## How It Works

### 1. Patient Side (Mobile App)
When a patient logs into the mobile app:
1. The app requests notification permissions
2. If granted, it gets an Expo Push Token
3. The token is saved to Firestore under `users/{userId}.pushToken`

### 2. Doctor Side (Web Portal)
When a doctor wants to notify a patient:
1. Click the "Notify Patient" button next to patient info
2. Fill in the notification title and message
3. Click "Send Notification"
4. The notification is sent via the API to Expo's push service
5. Expo delivers the notification to the patient's device

## Testing Instructions

### Prerequisites
1. Install dependencies:
   ```bash
   # Mobile app
   cd Appathon
   npm install

   # Doctor portal
   cd ../doctor-portal
   npm install
   ```

### Step 1: Start the Mobile App
```bash
cd Appathon
npx expo start
```

**Important**: You MUST test on a physical device (iOS or Android). Push notifications do NOT work in simulators/emulators.

To run on your device:
- iOS: Scan the QR code with the Camera app
- Android: Scan the QR code with the Expo Go app

### Step 2: Start the Doctor Portal
```bash
cd doctor-portal
npm run dev
```

Visit http://localhost:3000 and log in as a doctor.

### Step 3: Test the Notification Flow

#### On Mobile App:
1. Sign in or create a patient account
2. **Grant notification permissions** when prompted
3. Check the console - you should see:
   ```
   📱 Expo Push Token: ExponentPushToken[xxxxxx]
   ✅ Push token saved to Firestore
   ```
4. Keep the app open or in background

#### On Doctor Portal:
1. Select the patient from the sidebar
2. Look for the "Notify Patient" button with a bell icon
3. Click it to open the notification modal
4. Fill in:
   - **Title**: e.g., "Appointment Reminder"
   - **Message**: e.g., "Your appointment is tomorrow at 2 PM"
5. Click "Send Notification"
6. You should see: "Notification sent to [Patient Name]!"

#### On Mobile Device:
- If app is open: You'll see the notification banner at the top
- If app is in background: You'll get a system notification
- Tap the notification to open the app

## Troubleshooting

### "Patient has not enabled push notifications yet"
**Problem**: The patient hasn't granted notification permissions or their push token wasn't saved.

**Solution**:
1. On the mobile app, check console logs for errors
2. Make sure you granted notification permissions
3. Try logging out and back in
4. Check Firestore to see if the `pushToken` field exists under the patient's user document

### "Failed to send notification"
**Problem**: The API call failed.

**Solution**:
1. Check the browser console in the Doctor Portal
2. Check the terminal running the Next.js dev server
3. Make sure the Expo push token is valid (starts with `ExponentPushToken[`)
4. Verify the API endpoint is running at http://localhost:3000/api/send-notification

### Notifications not appearing on device
**Problem**: Notification sent successfully but not showing up.

**Solutions**:
1. **Check device notification settings**: Make sure notifications are enabled for Expo Go (or your standalone app)
2. **Physical device required**: Simulators/emulators don't support push notifications
3. **Network issues**: Make sure your device has internet connection
4. **Expo Go app**: Make sure you're using the latest version

### Push token not saving to Firestore
**Problem**: Console shows token but it's not in Firestore.

**Solution**:
1. Check Firebase console → Firestore → users collection
2. Verify the user document has a `pushToken` field
3. Check for Firebase permission errors in console
4. Make sure Firestore rules allow updates to the user document

## Testing on iOS vs Android

### iOS
- Requires physical device (simulator doesn't support notifications)
- Use the Camera app to scan QR code
- May need to enable notifications in iOS Settings > Expo Go

### Android
- Requires physical device (emulator doesn't support notifications)
- Install Expo Go from Play Store
- Use Expo Go app to scan QR code
- May need to enable notifications in Android Settings > Apps > Expo Go

## Production Deployment

For production, you'll need to:

1. **Build standalone apps** instead of using Expo Go
   ```bash
   eas build --platform android
   eas build --platform ios
   ```

2. **Configure push notification credentials**:
   - iOS: APNs key from Apple Developer account
   - Android: Firebase Cloud Messaging (FCM) credentials

3. **Update app.json** with your project ID:
   ```json
   {
     "expo": {
       "extra": {
         "eas": {
           "projectId": "your-actual-project-id"
         }
       }
     }
   }
   ```

## API Reference

### POST /api/send-notification

**Request Body**:
```json
{
  "pushToken": "ExponentPushToken[xxxxxx]",
  "title": "Notification title",
  "body": "Notification message",
  "data": {
    "type": "doctor_message",
    "patientId": "user123",
    "doctorId": "doctor456"
  }
}
```

**Response**:
```json
{
  "success": true,
  "result": {
    "data": {
      "status": "ok",
      "id": "notification-id"
    }
  }
}
```

## Firestore Schema Updates

The Patient document now includes:
```typescript
{
  id: string;
  name: string;
  email: string;
  createdAt: Timestamp;
  profileImage?: string;
  pushToken?: string;              // NEW
  pushTokenUpdatedAt?: string;     // NEW
}
```

## Next Steps

Potential enhancements:
1. **Notification history**: Store sent notifications in Firestore
2. **Scheduled notifications**: Allow doctors to schedule notifications for later
3. **Notification templates**: Pre-defined message templates for common scenarios
4. **Rich notifications**: Add images, action buttons, etc.
5. **Notification preferences**: Let patients customize what notifications they receive
6. **Read receipts**: Track when patients view notifications

## Support

For issues with:
- **Expo Push Notifications**: https://docs.expo.dev/push-notifications/overview/
- **Firebase**: https://firebase.google.com/docs
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
