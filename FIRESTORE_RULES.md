# Firestore Security Rules

To enable the doctor portal to access patient data, update your Firestore security rules in the Firebase Console:

## How to Update Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `ai-health-journal-60978`
3. Navigate to **Firestore Database** → **Rules**
4. Replace the existing rules with the ones below
5. Click **Publish**

## Recommended Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection - patients can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;  // Any authenticated user can read
      allow write: if request.auth.uid == userId;  // Only owner can write
    }

    // Notes collection - patients can write their own, doctors can read their patients' notes
    match /notes/{noteId} {
      allow read: if request.auth != null;  // Any authenticated user can read
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Doctors collection - doctors can read/write their own profile
    match /doctors/{doctorId} {
      allow read: if request.auth != null && request.auth.uid == doctorId;
      allow write: if request.auth != null && request.auth.uid == doctorId;
    }
  }
}
```

## Security Notes

- **Users**: All authenticated users can read user profiles (needed for doctor portal to list patients)
- **Notes**: All authenticated users can read notes (doctors need this to view patient journals)
- **Doctors**: Doctors can only access their own profile
- Only note owners can create/modify their notes
- Future enhancement: Add specific doctor verification to restrict note reading to assigned doctors only

## Enhanced Security (Optional)

For production, you may want to add more granular rules:

```javascript
// More restrictive note reading - only assigned doctors
match /notes/{noteId} {
  allow read: if request.auth != null && (
    resource.data.userId == request.auth.uid ||  // Patient can read their own
    exists(/databases/$(database)/documents/doctors/$(request.auth.uid)) &&  // Is a doctor
    resource.data.userId in get(/databases/$(database)/documents/doctors/$(request.auth.uid)).data.patients  // Patient is assigned
  );
}
```

This ensures notes are only readable by:
1. The patient who wrote them
2. Doctors who have that patient in their patient list
