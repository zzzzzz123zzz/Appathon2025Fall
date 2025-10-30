# Firebase Storage Security Rules Setup

## ⚠️ CRITICAL: Set Up Storage Rules for Image Uploads

If image uploads are failing, you need to configure Firebase Storage security rules.

## Quick Fix

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **ai-health-journal-60978**
3. Click **Storage** in the left menu
4. Click the **Rules** tab
5. Replace existing rules with the code below
6. Click **Publish**

## Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Profile images - users can upload/read their own, doctors can read all
    match /profileImages/{imageId} {
      allow read: if request.auth != null;  // Any authenticated user can read
      allow write: if request.auth != null; // Any authenticated user can write
    }

    // Note images - users can upload/read their own
    match /noteImages/{userId}/{noteId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Testing the Fix

After updating the rules:

1. Restart your mobile app (close completely and reopen)
2. Go to Profile screen
3. Tap the camera icon
4. Select an image
5. Should now upload successfully!

## Common Errors

### Error: "storage/unauthorized"
**Solution**: Rules aren't set up yet. Follow steps above.

### Error: "Failed to fetch image from URI"
**Solution**: Make sure you granted photo library permissions.

### Error: "storage/object-not-found"
**Solution**: This happens when trying to read an image that doesn't exist. This is normal if no image has been uploaded yet.

## Production Rules (Enhanced Security)

For production, use these more restrictive rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Helper function to check file size (5MB limit)
    function isValidSize() {
      return request.resource.size < 5 * 1024 * 1024;
    }

    // Helper function to check if file is an image
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }

    // Profile images
    match /profileImages/{imageId} {
      // Anyone authenticated can read
      allow read: if request.auth != null;

      // Only authenticated users can upload images under 5MB
      allow write: if request.auth != null
                   && isImage()
                   && isValidSize();
    }

    // Note images - restricted to owner
    match /noteImages/{userId}/{noteId} {
      allow read: if request.auth != null
                   && request.auth.uid == userId;

      allow write: if request.auth != null
                    && request.auth.uid == userId
                    && isImage()
                    && isValidSize();
    }
  }
}
```

## Debugging

To see detailed error logs:

1. Check the console in your terminal running the app
2. Look for lines starting with "Error uploading image:"
3. The error code will tell you what's wrong:
   - `storage/unauthorized` = Rules issue
   - `storage/unauthenticated` = User not logged in
   - `storage/retry-limit-exceeded` = Network issue
   - `storage/invalid-format` = File format issue

## Need Help?

If images still won't upload:
1. Check Firebase Console → Storage → Files to see if any images are there
2. Check Firebase Console → Authentication to confirm user is signed in
3. Try with a different image
4. Check your internet connection
