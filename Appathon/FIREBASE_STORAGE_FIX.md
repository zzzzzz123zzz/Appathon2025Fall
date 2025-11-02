# 🔧 Fix: Firebase Storage Unknown Error

## The Problem

You're seeing this error:
```
ERROR  Error code: storage/unknown
ERROR  Error message: Firebase Storage: An unknown error occurred
```

This means **Firebase Storage is not properly initialized** in your Firebase project.

---

## ✅ SOLUTION: Initialize Firebase Storage (2 Minutes)

### Step 1: Go to Firebase Console Storage

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **ai-health-journal-60978**
3. Click **Storage** in the left sidebar
4. You'll likely see a message: **"Get started"** or **"Cloud Storage is not enabled"**

### Step 2: Initialize Storage

Click the **"Get started"** button (or **"Enable Storage"**)

You'll see a dialog asking about security rules:

1. **First Dialog - Rules**: Choose **"Start in test mode"** (we'll secure it later)
   - Click **Next**

2. **Second Dialog - Location**: Choose your Cloud Storage location
   - Select the closest region to your users (e.g., `us-central1` for US)
   - ⚠️ **Important**: This cannot be changed later!
   - Click **Done**

3. Wait for Storage to initialize (takes ~30 seconds)

### Step 3: Set Up Security Rules

After Storage initializes:

1. Click the **Rules** tab at the top
2. Replace the existing rules with this code:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Profile images - any authenticated user can upload/read
    match /profileImages/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024  // Max 5MB
                   && request.resource.contentType.matches('image/.*');  // Images only
    }

    // Note images - users can only access their own
    match /noteImages/{userId}/{noteId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null
                    && request.auth.uid == userId
                    && request.resource.size < 5 * 1024 * 1024  // Max 5MB
                    && request.resource.contentType.matches('image/.*');  // Images only
    }
  }
}
```

3. Click **Publish**
4. Confirm by clicking **Publish** again in the warning dialog

---

## 🧪 Test It Works

### Method 1: Visual Verification
1. In Firebase Console → Storage
2. You should now see the **Files** tab
3. The bucket should be empty but accessible

### Method 2: Test Upload
1. **Completely close and restart your mobile app**
2. Go to Profile screen
3. Tap the camera icon
4. Select a photo
5. Should upload successfully! ✅

---

## 📊 Check the Enhanced Logs

I've added detailed logging. After restarting the app, try uploading again and check the console for:

```
✅ Good signs:
- "Starting image upload for user: ..."
- "Blob created, size: ..."
- "Storage ref created: ..."
- "Upload complete"

❌ Bad signs - If you still see errors, look for:
- "Full error object: {...}"
- "Server response: ..."
- "Custom data: ..."
```

Share these logs with me if it still doesn't work!

---

## 🚨 Still Not Working?

### Check List:

1. ✅ Did you click "Get started" in Firebase Console → Storage?
2. ✅ Did you wait for Storage to fully initialize (~30 seconds)?
3. ✅ Did you publish the security rules?
4. ✅ Did you **completely restart** your app (not just reload)?
5. ✅ Is the user signed in? (Check Firebase Console → Authentication)
6. ✅ Do you have internet connection?

### Common Issues:

**Issue: "Storage is not enabled for this project"**
- Solution: You skipped Step 2 - Go back and click "Get started"

**Issue: "storage/unauthorized" instead of "storage/unknown"**
- Solution: Rules aren't set up - Go back to Step 3

**Issue: "Failed to fetch image from URI"**
- Solution: Grant photo library permissions on your device
  - iOS: Settings → Your App → Photos → "All Photos"
  - Android: Settings → Apps → Your App → Permissions → Storage

---

## 🔐 Production Rules (Use After Testing)

Once uploads work, upgrade to these more secure rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isValidImage() {
      return request.resource.contentType.matches('image/.*');
    }

    function isUnderSizeLimit() {
      return request.resource.size < 5 * 1024 * 1024;  // 5MB
    }

    // Profile images
    match /profileImages/{imageId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated()
                   && isValidImage()
                   && isUnderSizeLimit();
    }

    // Note images - user-specific
    match /noteImages/{userId}/{noteId} {
      allow read: if isAuthenticated()
                   && request.auth.uid == userId;
      allow write: if isAuthenticated()
                    && request.auth.uid == userId
                    && isValidImage()
                    && isUnderSizeLimit();
    }
  }
}
```

---

## 📞 Need More Help?

1. Share the **Full error object** from your console
2. Screenshot your Firebase Console → Storage page
3. Confirm which step you're stuck on

The `storage/unknown` error is **always** because Storage isn't initialized. Following these steps will fix it! 💪
