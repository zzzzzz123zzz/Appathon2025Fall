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
        console.log('⚠️ No recording found in stopRecording');
        return null;
      }

      console.log('🎙️ Stopping recording...');

      // Get status BEFORE stopping to check duration
      const statusBefore = await recordingRef.current.getStatusAsync();
      console.log('📊 Recording Status BEFORE stop:', {
        isRecording: statusBefore.isRecording,
        duration: statusBefore.durationMillis ? `${(statusBefore.durationMillis / 1000).toFixed(2)}s` : 'unknown',
        canRecord: statusBefore.canRecord,
      });

      // Check if recording duration is too short
      if (statusBefore.durationMillis < 100) {
        console.warn('⚠️ Recording is too short (less than 100ms)');
      }

      setIsRecording(false);

      await recordingRef.current.stopAndUnloadAsync();

      const uri = recordingRef.current.getURI();
      console.log('📁 Recording URI:', uri);

      // Clear the ref
      const tempRecording = recordingRef.current;
      recordingRef.current = null;

      // Validate URI exists
      if (!uri) {
        console.error('❌ No URI returned from recording');
        throw new Error("Recording failed to produce audio file");
      }

      return uri;
    } catch (error) {
      console.error("❌ Failed to stop recording:", error);
      setIsRecording(false);
      recordingRef.current = null;
      throw error;
    }
  };

  /**
   * Transcribe audio to text using AssemblyAI (FREE - 5 hours/month)
   *
   * AssemblyAI offers a generous free tier with high-quality transcription.
   * Process: 1) Upload audio 2) Create transcript 3) Poll for results
   */
  const transcribeAudio = async (audioUri) => {
    setIsTranscribing(true);

    try {
      console.log('🔄 Starting transcription...');
      console.log('📁 Audio URI:', audioUri);

      // Import API key
      let ASSEMBLYAI_API_KEY;
      try {
        const apiKeys = require('../config/apiKeys');
        ASSEMBLYAI_API_KEY = apiKeys.ASSEMBLYAI_API_KEY;
      } catch (error) {
        console.error('❌ Could not load API keys:', error);
        throw new Error('API configuration missing. Please set up your AssemblyAI API key in config/apiKeys.js');
      }

      // Validate API key
      if (!ASSEMBLYAI_API_KEY || ASSEMBLYAI_API_KEY === 'your-assemblyai-api-key-here') {
        console.error('❌ AssemblyAI API key not configured');
        throw new Error('Please add your FREE AssemblyAI API key to config/apiKeys.js. Get one at https://www.assemblyai.com/');
      }

      // Step 1: Upload the audio file to AssemblyAI
      console.log('📤 Step 1: Uploading audio to AssemblyAI...');

      const audioResponse = await fetch(audioUri);
      const audioBlob = await audioResponse.blob();
      console.log('📦 Audio file size:', `${(audioBlob.size / 1024).toFixed(2)} KB`);

      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLYAI_API_KEY,
        },
        body: audioBlob,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ Upload error:', errorText);
        throw new Error(`Failed to upload audio: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      const audioUrl = uploadData.upload_url;
      console.log('✅ Audio uploaded successfully');

      // Step 2: Create a transcript
      console.log('📝 Step 2: Creating transcript...');

      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLYAI_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_code: 'en_us',
        }),
      });

      if (!transcriptResponse.ok) {
        const errorText = await transcriptResponse.text();
        console.error('❌ Transcript creation error:', errorText);
        throw new Error(`Failed to create transcript: ${transcriptResponse.status}`);
      }

      const transcriptData = await transcriptResponse.json();
      const transcriptId = transcriptData.id;
      console.log('📋 Transcript ID:', transcriptId);

      // Step 3: Poll for the transcript result
      console.log('⏳ Step 3: Waiting for transcription to complete...');

      let transcript = null;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max wait

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

        const pollingResponse = await fetch(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          {
            headers: {
              'authorization': ASSEMBLYAI_API_KEY,
            },
          }
        );

        const pollingData = await pollingResponse.json();

        if (pollingData.status === 'completed') {
          transcript = pollingData.text;
          console.log('✅ Transcription completed!');
          break;
        } else if (pollingData.status === 'error') {
          console.error('❌ Transcription failed:', pollingData.error);
          throw new Error(`Transcription failed: ${pollingData.error}`);
        }

        console.log(`⏳ Status: ${pollingData.status} (attempt ${attempts + 1}/${maxAttempts})`);
        attempts++;
      }

      if (!transcript) {
        throw new Error('Transcription timed out. Please try again.');
      }

      if (!transcript.trim()) {
        console.warn('⚠️ Empty transcription received');
        throw new Error('Could not understand audio. Please speak more clearly.');
      }

      console.log('📝 Transcription:', transcript);
      return transcript;

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
