import { useState, useRef } from "react";
import { Audio } from "expo-av"; // TODO: Migrate to expo-audio in SDK 54+
import { Platform } from "react-native";

/**
 * Custom hook for speech recognition using expo-av
 *
 * For production, integrate with a speech-to-text service:
 * - Google Cloud Speech-to-Text API
 * - Azure Speech Service
 * - AWS Transcribe
 * - OpenAI Whisper API
 * - Firebase AI (Gemini)
 */
export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef(null);

  /**
   * Request microphone permissions
   */
  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Microphone permission not granted");
      }
      return true;
    } catch (error) {
      console.error("Error requesting permissions:", error);
      return false;
    }
  };

  /**
   * Start recording audio
   */
  const startRecording = async () => {
    try {
      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new Error("Microphone permission required");
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);

      return recording;
    } catch (error) {
      console.error("Failed to start recording:", error);
      throw error;
    }
  };

  /**
   * Stop recording and get the audio URI
   */
  const stopRecording = async () => {
    try {
      if (!recordingRef.current) {
        return null;
      }

      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      return uri;
    } catch (error) {
      console.error("Failed to stop recording:", error);
      throw error;
    }
  };

  /**
   * Transcribe audio to text
   *
   * IMPLEMENTATION NOTE:
   * This is a placeholder that returns mock text.
   * Replace this with actual speech-to-text API integration.
   *
   * Example integration with OpenAI Whisper:
   *
   * ```javascript
   * const transcribeAudio = async (audioUri) => {
   *   const formData = new FormData();
   *   formData.append('file', {
   *     uri: audioUri,
   *     type: 'audio/m4a',
   *     name: 'recording.m4a',
   *   });
   *   formData.append('model', 'whisper-1');
   *
   *   const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
   *     method: 'POST',
   *     headers: {
   *       'Authorization': `Bearer ${OPENAI_API_KEY}`,
   *     },
   *     body: formData,
   *   });
   *
   *   const data = await response.json();
   *   return data.text;
   * };
   * ```
   *
   * Example integration with Google Cloud Speech-to-Text:
   *
   * ```javascript
   * import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
   * import { getFunctions, httpsCallable } from 'firebase/functions';
   *
   * const transcribeAudio = async (audioUri) => {
   *   // Upload audio to Firebase Storage
   *   const storage = getStorage();
   *   const audioRef = ref(storage, `audio/${Date.now()}.m4a`);
   *   const response = await fetch(audioUri);
   *   const blob = await response.blob();
   *   await uploadBytes(audioRef, blob);
   *   const downloadUrl = await getDownloadURL(audioRef);
   *
   *   // Call Cloud Function to transcribe
   *   const functions = getFunctions();
   *   const transcribe = httpsCallable(functions, 'transcribeAudio');
   *   const result = await transcribe({ audioUrl: downloadUrl });
   *   return result.data.transcript;
   * };
   * ```
   */
  const transcribeAudio = async (audioUri) => {
    setIsTranscribing(true);

    try {
      // TODO: Replace with actual speech-to-text API call
      // For now, return a placeholder message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // This is a mock response - replace with actual transcription
      const mockTranscriptions = [
        "I've been feeling a bit anxious lately.",
        "I had a really good day today.",
        "Can you help me understand these feelings?",
        "I'm worried about my upcoming presentation.",
        "I feel much better after talking about it.",
      ];

      const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
      return mockTranscriptions[randomIndex];

    } catch (error) {
      console.error("Transcription error:", error);
      throw error;
    } finally {
      setIsTranscribing(false);
    }
  };

  /**
   * Complete flow: record, stop, and transcribe
   */
  const recordAndTranscribe = async () => {
    try {
      const audioUri = await stopRecording();
      if (!audioUri) {
        throw new Error("No audio recorded");
      }

      const transcription = await transcribeAudio(audioUri);
      return transcription;
    } catch (error) {
      console.error("Error in recordAndTranscribe:", error);
      throw error;
    }
  };

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    transcribeAudio,
    recordAndTranscribe,
  };
}
