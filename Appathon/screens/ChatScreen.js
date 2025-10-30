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
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef(null);

  // Speech recognition hook
  const {
    isRecording,
    isTranscribing,
    startRecording,
    recordAndTranscribe,
  } = useSpeechRecognition();

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const micButtonScale = useRef(new Animated.Value(1)).current;
  const recordingRipple = useRef(new Animated.Value(0)).current;

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Ripple effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingRipple, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingRipple, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      recordingRipple.setValue(0);
    }
  }, [isRecording]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  const handleStartRecording = async () => {
    try {
      // Start actual audio recording
      await startRecording();

      // Haptic feedback animation
      Animated.sequence([
        Animated.timing(micButtonScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(micButtonScale, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
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
        // Add user message with actual transcription
        const newMessage = {
          id: messages.length + 1,
          text: transcription,
          sender: "user",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);

        // Show typing indicator after a delay
        setTimeout(() => {
          setIsTyping(true);
        }, 800);

        // Simulate AI response (replace with actual AI call later)
        setTimeout(() => {
          setIsTyping(false);

          const aiResponses = [
            "I hear you. Can you tell me more about what's been weighing on you most?",
            "Thank you for sharing that. How does that make you feel?",
            "That sounds challenging. What do you think would help you feel better?",
            "I understand. Have you noticed any patterns in when these feelings come up?",
            "That's important to acknowledge. What support do you have right now?",
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
        }, 2500);
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
    const conversationText = messages
      .map((msg) => `${msg.sender === "user" ? "Me" : "Assistant"}: ${msg.text}`)
      .join("\n\n");

    if (onFinish) {
      onFinish(conversationText);
    }
  };

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
      {/* Header with gradient effect */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          onPress={onBack} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.dateText, { color: theme.text }]}>
            {getCurrentDate()}
          </Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: "#34D399" }]} />
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              Listening
            </Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            theme={theme}
            index={index}
          />
        ))}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator theme={theme} />}
      </ScrollView>

      <View
        style={[
          styles.bottomContainer,
          { 
            backgroundColor: theme.background, 
            borderTopColor: theme.border 
          },
        ]}
      >
        {/* Recording ripple effects */}
        {isRecording && (
          <>
            <Animated.View
              style={[
                styles.ripple,
                {
                  backgroundColor: theme.primary,
                  opacity: recordingRipple.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0],
                  }),
                  transform: [
                    {
                      scale: recordingRipple.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.5],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.ripple,
                styles.ripple2,
                {
                  backgroundColor: theme.primary,
                  opacity: recordingRipple.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 0],
                  }),
                  transform: [
                    {
                      scale: recordingRipple.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.8],
                      }),
                    },
                  ],
                },
              ]}
            />
          </>
        )}

        {/* Mic button */}
        <Animated.View 
          style={{ 
            transform: [
              { scale: pulseAnim },
              { scale: micButtonScale }
            ] 
          }}
        >
          <TouchableOpacity
            style={[
              styles.micButton,
              {
                backgroundColor: isRecording ? "#EF4444" : theme.primary,
                shadowColor: isRecording ? "#EF4444" : theme.primary,
                opacity: isTranscribing ? 0.5 : 1,
              },
            ]}
            onPressIn={handleStartRecording}
            onPressOut={handleStopRecording}
            activeOpacity={0.9}
            disabled={isTranscribing}
          >
            <Ionicons
              name={isRecording ? "stop" : "mic"}
              size={40}
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

        {messages.length > 2 && (
          <TouchableOpacity
            style={[
              styles.finishButton,
              { 
                backgroundColor: theme.cardBackground, 
                borderColor: theme.primary 
              },
            ]}
            onPress={handleFinishSession}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
            <Text style={[styles.finishButtonText, { color: theme.primary }]}>
              Finish Session
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// Animated message bubble component
function MessageBubble({ message, theme, index }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
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
        <Text
          style={[
            styles.messageTime,
            {
              color: message.sender === "user" 
                ? "rgba(255,255,255,0.7)" 
                : theme.textSecondary,
            },
          ]}
        >
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    </Animated.View>
  );
}

// Typing indicator component
function TypingIndicator({ theme }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: -10,
            duration: 400,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateDot(dot1, 0);
    animateDot(dot2, 150);
    animateDot(dot3, 300);
  }, []);

  return (
    <View
      style={[
        styles.typingContainer,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.typingDot,
          { 
            backgroundColor: theme.primary,
            transform: [{ translateY: dot1 }] 
          },
        ]}
      />
      <Animated.View
        style={[
          styles.typingDot,
          { 
            backgroundColor: theme.primary,
            transform: [{ translateY: dot2 }] 
          },
        ]}
      />
      <Animated.View
        style={[
          styles.typingDot,
          { 
            backgroundColor: theme.primary,
            transform: [{ translateY: dot3 }] 
          },
        ]}
      />
    </View>
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
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
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
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
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
    lineHeight: 22,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    alignSelf: "flex-end",
  },
  typingContainer: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    padding: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    marginBottom: 12,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    alignItems: "center",
    position: "relative",
  },
  ripple: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    top: 20,
  },
  ripple2: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
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
    fontWeight: "500",
    marginBottom: 16,
  },
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
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
    fontSize: 16,
    fontWeight: "600",
  },
});
