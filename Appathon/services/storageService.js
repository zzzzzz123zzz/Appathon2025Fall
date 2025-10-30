import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

// Upload image to Firebase Storage
export const uploadProfileImage = async (userId, imageUri) => {
  try {
    // Fetch the image from local URI
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create a reference to the storage location
    const storageRef = ref(storage, `profileImages/${userId}`);

    // Upload the image
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error uploading image:', error);
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
