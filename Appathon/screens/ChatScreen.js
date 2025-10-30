import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

export default function ChatScreen({ onBack, onFinish }) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm here to listen. How are you feeling today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  // Speech recognition hook
  const {
    isRecording,
    isTranscribing,
    startRecording,
    recordAndTranscribe,
  } = useSpeechRecognition();

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Fade in messages when they appear
  useEffect(() => {
    messageOpacity.setValue(0);
    Animated.timing(messageOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [messages.length]);

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error("Error starting recording:", error);
      Alert.alert(
        "Recording Error",
        "Could not start recording. Please check microphone permissions.",
        [{ text: "OK" }]
      );
    }
  };

  const handleStopRecording = async () => {
    try {
      // Stop recording and get transcription
      const transcription = await recordAndTranscribe();

      if (transcription) {
        // Add user message with transcription
        const newMessage = {
          id: messages.length + 1,
          text: transcription,
          sender: "user",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newMessage]);

        // Scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // Simulate AI response (replace with actual AI integration)
        setTimeout(() => {
          const aiResponses = [
            "I understand. Can you tell me more about that?",
            "Thank you for sharing. How does that make you feel?",
            "I hear you. What do you think is contributing to these feelings?",
            "That's important. Have you noticed any patterns?",
            "I appreciate you opening up. What would help you feel better?",
          ];

          const randomResponse =
            aiResponses[Math.floor(Math.random() * aiResponses.length)];

          const aiResponse = {
            id: messages.length + 2,
            text: randomResponse,
            sender: "ai",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiResponse]);

          // Scroll to bottom for AI response
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }, 1000);
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      Alert.alert(
        "Transcription Error",
        "Could not process your message. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleFinishSession = () => {
    // Convert conversation to note format
    const conversationText = messages
      .map((msg) => `${msg.sender === "user" ? "Me" : "Assistant"}: ${msg.text}`)
      .join("\n\n");

    if (onFinish) {
      onFinish(conversationText);
    }
  };

  // Get current date
  const getCurrentDate = () => {
    const date = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={32} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.dateText, { color: theme.text }]}>
          {getCurrentDate()}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.sender === "user"
                ? [styles.userMessage, { backgroundColor: theme.primary }]
                : [
                    styles.aiMessage,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.border,
                    },
                  ],
            ]}
          >
            <Text
              style={[
                styles.messageText,
                {
                  color: message.sender === "user" ? "#FFFFFF" : theme.text,
                },
              ]}
            >
              {message.text}
            </Text>
          </View>
        ))}

        {isTranscribing && (
          <View
            style={[
              styles.messageBubble,
              styles.aiMessage,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.messageText, { color: theme.textSecondary }]}>
              Transcribing...
            </Text>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomContainer,
          { backgroundColor: theme.background, borderTopColor: theme.border },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.micButton,
              {
                backgroundColor: isRecording ? "#EF4444" : theme.primary,
                opacity: isTranscribing ? 0.5 : 1,
              },
            ]}
            onPressIn={handleStartRecording}
            onPressOut={handleStopRecording}
            activeOpacity={0.8}
            disabled={isTranscribing}
          >
            <Ionicons
              name={isRecording ? "stop" : "mic"}
              size={56}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </Animated.View>

        <Text style={[styles.micLabel, { color: theme.textSecondary }]}>
          {isTranscribing
            ? "Processing..."
            : isRecording
            ? "Release to send"
            : "Hold to speak"}
        </Text>

        <TouchableOpacity
          style={[
            styles.finishButton,
            { backgroundColor: theme.cardBackground, borderColor: theme.primary },
          ]}
          onPress={handleFinishSession}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
          <Text style={[styles.finishButtonText, { color: theme.primary }]}>
            Finish Session
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 48,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 32,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  userMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
  },
  aiMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 6,
    borderWidth: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 0,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  micButton: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 16,
  },
  micLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 22,
    letterSpacing: 0.3,
  },
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2.5,
    gap: 10,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  finishButtonText: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
