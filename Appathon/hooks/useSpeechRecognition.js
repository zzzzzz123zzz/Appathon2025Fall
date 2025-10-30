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
      console.log('🎤 Requesting microphone permissions...');
      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new Error("Microphone permission required");
      }
      console.log('✅ Microphone permission granted');

      // Configure audio mode
      console.log('⚙️ Configuring audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Start recording
      console.log('🎙️ Starting recording with HIGH_QUALITY preset...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);

      console.log('✅ Recording started successfully');
      return recording;
    } catch (error) {
      console.error("❌ Failed to start recording:", error);
      throw error;
    }
  };

  /**
   * Stop recording and get the audio URI
   */
  const stopRecording = async () => {
    try {
      if (!recordingRef.current) {
        console.log('⚠️ No recording found');
        return null;
      }

      console.log('🎙️ Stopping recording...');
      setIsRecording(false);

      await recordingRef.current.stopAndUnloadAsync();

      const uri = recordingRef.current.getURI();

      // Get recording status for logging
      const status = await recordingRef.current.getStatusAsync();
      console.log('📊 Recording Status:', {
        uri: uri,
        duration: status.durationMillis ? `${(status.durationMillis / 1000).toFixed(2)}s` : 'unknown',
        isDoneRecording: status.isDoneRecording,
        canRecord: status.canRecord,
      });

      recordingRef.current = null;

      return uri;
    } catch (error) {
      console.error("❌ Failed to stop recording:", error);
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
      console.log('🔄 Starting transcription...');
      console.log('📁 Audio URI:', audioUri);

      // Check if file exists and get info
      try {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        console.log('📦 Audio file info:', {
          size: `${(blob.size / 1024).toFixed(2)} KB`,
          type: blob.type,
        });
      } catch (e) {
        console.warn('⚠️ Could not read audio file info:', e.message);
      }

      // ============================================================
      // OPTION 1: OpenAI Whisper API (RECOMMENDED - Uncomment to use)
      // ============================================================
      //
      // SETUP:
      // 1. Get API key from: https://platform.openai.com/api-keys
      // 2. Create config/apiKeys.js with: export const OPENAI_API_KEY = 'your-key-here';
      // 3. Uncomment the code below
      //
      // const OPENAI_API_KEY = require('../config/apiKeys').OPENAI_API_KEY;
      //
      // const formData = new FormData();
      // formData.append('file', {
      //   uri: audioUri,
      //   type: 'audio/m4a',
      //   name: 'recording.m4a',
      // });
      // formData.append('model', 'whisper-1');
      //
      // console.log('🚀 Sending to OpenAI Whisper API...');
      // const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${OPENAI_API_KEY}`,
      //   },
      //   body: formData,
      // });
      //
      // if (!response.ok) {
      //   const errorText = await response.text();
      //   console.error('❌ Whisper API error:', errorText);
      //   throw new Error(`Whisper API error: ${response.status}`);
      // }
      //
      // const data = await response.json();
      // console.log('✅ Transcription successful:', data.text);
      // return data.text;

      // ============================================================
      // OPTION 2: Mock Transcription (CURRENT - For testing)
      // ============================================================
      console.log('⚠️ Using MOCK transcription (no real API configured)');
      console.log('💡 To enable real transcription, see comments in useSpeechRecognition.js');

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

      const mockTranscriptions = [
        "I've been feeling a bit anxious lately.",
        "I had a really good day today.",
        "Can you help me understand these feelings?",
        "I'm worried about my upcoming presentation.",
        "I feel much better after talking about it.",
        "Today was challenging but I made it through.",
        "I'm grateful for the support I've been receiving.",
      ];

      const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
      const mockResult = mockTranscriptions[randomIndex];
      console.log('📝 Mock transcription:', mockResult);
      return mockResult;

    } catch (error) {
      console.error("❌ Transcription error:", error);
      console.error("Error details:", error.message);
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
