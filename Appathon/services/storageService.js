import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../config/firebase';

// Upload image to Firebase Storage
export const uploadProfileImage = async (userId, imageUri) => {
  try {
    console.log('Starting image upload for user:', userId);
    console.log('Image URI:', imageUri);

    // Fetch the image from local URI
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error('Failed to fetch image from URI');
    }

    const blob = await response.blob();
    console.log('Blob created, size:', blob.size, 'type:', blob.type);

    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}.jpg`;

    // Create a reference to the storage location
    const storageRef = ref(storage, `profileImages/${filename}`);
    console.log('Storage ref created:', storageRef.fullPath);

    // Upload the image with metadata
    const metadata = {
      contentType: blob.type || 'image/jpeg',
    };

    await uploadBytes(storageRef, blob, metadata);
    console.log('Upload complete');

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL obtained:', downloadURL);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error uploading image:', error);
    console.error('Error details:', error.code, error.message);
    return { success: false, error: error.message };
  }
};

// Upload note image to Firebase Storage
export const uploadNoteImage = async (userId, noteId, imageUri) => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const storageRef = ref(storage, `noteImages/${userId}/${noteId}`);
    await uploadBytes(storageRef, blob);

    const downloadURL = await getDownloadURL(storageRef);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error uploading note image:', error);
    return { success: false, error: error.message };
  }
};
