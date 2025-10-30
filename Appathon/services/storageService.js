import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../config/firebase';

// Upload image to Firebase Storage
export const uploadProfileImage = async (userId, imageUri) => {
  try {
    // Validate inputs
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!imageUri) {
      throw new Error('Image URI is required');
    }

    console.log('Starting image upload for user:', userId);
    console.log('Image URI:', imageUri);

    // Fetch the image from local URI
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URI: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log('Blob created, size:', blob.size, 'type:', blob.type);

    // Validate blob
    if (blob.size === 0) {
      throw new Error('Image file is empty');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (blob.size > maxSize) {
      throw new Error('Image size exceeds 5MB limit');
    }

    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}.jpg`;

    // Create a reference to the storage location
    const storageRef = ref(storage, `profileImages/${filename}`);
    console.log('Storage ref created:', storageRef.fullPath);

    // Upload the image with metadata
    const metadata = {
      contentType: blob.type || 'image/jpeg',
      customMetadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      }
    };

    console.log('Starting upload...');
    await uploadBytes(storageRef, blob, metadata);
    console.log('Upload complete');

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL obtained:', downloadURL);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

    // Try to get more details from the error
    if (error.serverResponse) {
      console.error('Server response:', error.serverResponse);
    }
    if (error.customData) {
      console.error('Custom data:', error.customData);
    }

    // Provide user-friendly error messages
    let userMessage = error.message;

    if (error.code === 'storage/unknown') {
      userMessage = 'Firebase Storage is not properly set up. Please check the setup guide.';
    } else if (error.code === 'storage/unauthorized') {
      userMessage = 'Permission denied. Storage rules need to be configured.';
    } else if (error.code === 'storage/unauthenticated') {
      userMessage = 'You must be signed in to upload images.';
    } else if (error.code === 'storage/retry-limit-exceeded') {
      userMessage = 'Network error. Please check your connection and try again.';
    } else if (error.code === 'storage/invalid-format') {
      userMessage = 'Invalid image format. Please select a different image.';
    } else if (error.message.includes('fetch')) {
      userMessage = 'Could not read the image file. Please try a different image.';
    }

    return { success: false, error: userMessage, originalError: error };
  }
};

// Upload note image to Firebase Storage
export const uploadNoteImage = async (userId, noteId, imageUri) => {
  try {
    // Validate inputs
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!noteId) {
      throw new Error('Note ID is required');
    }
    if (!imageUri) {
      throw new Error('Image URI is required');
    }

    console.log('Starting note image upload for user:', userId, 'note:', noteId);
    console.log('Image URI:', imageUri);

    // Fetch the image from local URI
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URI: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log('Blob created, size:', blob.size, 'type:', blob.type);

    // Validate blob
    if (blob.size === 0) {
      throw new Error('Image file is empty');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (blob.size > maxSize) {
      throw new Error('Image size exceeds 5MB limit');
    }

    // Create a reference to the storage location
    const storageRef = ref(storage, `noteImages/${userId}/${noteId}`);
    console.log('Storage ref created:', storageRef.fullPath);

    // Upload the image with metadata
    const metadata = {
      contentType: blob.type || 'image/jpeg',
      customMetadata: {
        uploadedBy: userId,
        noteId: noteId,
        uploadedAt: new Date().toISOString(),
      }
    };

    console.log('Starting upload...');
    await uploadBytes(storageRef, blob, metadata);
    console.log('Upload complete');

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL obtained:', downloadURL);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('❌ Error uploading note image:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

    // Try to get more details from the error
    if (error.serverResponse) {
      console.error('Server response:', error.serverResponse);
    }
    if (error.customData) {
      console.error('Custom data:', error.customData);
    }

    // Provide user-friendly error messages
    let userMessage = error.message;

    if (error.code === 'storage/unknown') {
      userMessage = 'Firebase Storage is not properly set up. Please check the setup guide.';
    } else if (error.code === 'storage/unauthorized') {
      userMessage = 'Permission denied. Storage rules need to be configured.';
    } else if (error.code === 'storage/unauthenticated') {
      userMessage = 'You must be signed in to upload images.';
    } else if (error.code === 'storage/retry-limit-exceeded') {
      userMessage = 'Network error. Please check your connection and try again.';
    } else if (error.code === 'storage/invalid-format') {
      userMessage = 'Invalid image format. Please select a different image.';
    } else if (error.message.includes('fetch')) {
      userMessage = 'Could not read the image file. Please try a different image.';
    }

    return { success: false, error: userMessage, originalError: error };
  }
};
