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
  TextInput,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { getAIChatResponse, getRecentDiaryEntries } from "../services/diaryService";

export default function ChatScreen({ currentUser, onBack, onFinish }) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [textInput, setTextInput] = useState("");
  const scrollViewRef = useRef(null);
  const textInputRef = useRef(null);
  const recordingStartTime = useRef(null);
  const [initialGreetingSet, setInitialGreetingSet] = useState(false);

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

  // Generate personalized greeting based on history
  useEffect(() => {
    if (!initialGreetingSet && currentUser?.uid) {
      const generateGreeting = async () => {
        try {
          const entriesResult = await getRecentDiaryEntries(currentUser.uid, 10);
          let greetingText = "Hello! I'm here to listen. How are you feeling today?";

          if (entriesResult.success && entriesResult.data.length > 0) {
            const entries = entriesResult.data;
            const latestEntry = entries[0];
            const data = latestEntry.extractedData;

            // Create personalized greeting based on last entry
            if (data) {
              const userName = currentUser.displayName || currentUser.email?.split('@')[0] || '';
              const greeting = userName ? `Hi ${userName}! ` : "Hello! ";

              if (data.symptoms && data.symptoms.length > 0) {
                greetingText = `${greeting}Last time you mentioned ${data.symptoms[0].name}. How are you feeling now?`;
              } else if (data.moods && data.moods.score <= 4) {
                greetingText = `${greeting}I remember you were having a tough time. How are things today?`;
              } else if (data.moods && data.moods.score >= 7) {
                greetingText = `${greeting}You were feeling great last time. How's your day going?`;
              } else {
                greetingText = `${greeting}Good to see you again. How are you feeling today?`;
              }
            }
          }

          setMessages([{
            id: "ai-initial",
            text: greetingText,
            sender: "ai",
            timestamp: new Date(),
          }]);
          setInitialGreetingSet(true);
        } catch (error) {
          console.error('Error generating greeting:', error);
          // Fallback to default greeting
          setMessages([{
            id: "ai-initial",
            text: "Hello! I'm here to listen. How are you feeling today?",
            sender: "ai",
            timestamp: new Date(),
          }]);
          setInitialGreetingSet(true);
        }
      };

      generateGreeting();
    }
  }, [currentUser, initialGreetingSet]);

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

  const handleToggleRecording = async () => {
    // If currently recording, stop it
    if (isRecording) {
      try {
        console.log('🎙️ Stopping recording...');

        // Stop recording and get transcription
        const transcription = await recordAndTranscribe();
        recordingStartTime.current = null;

        if (transcription) {
          handleSendMessage(transcription);
        }
      } catch (error) {
        console.error("Error stopping recording:", error);
        recordingStartTime.current = null;

        // Provide more specific error messages
        let errorMessage = "Could not process your message. Please try again.";

        if (error.message.includes("No audio recorded")) {
          errorMessage = "No audio was recorded. Please try speaking for at least 1 second.";
        } else if (error.message.includes("permission")) {
          errorMessage = "Microphone permission is required. Please enable it in your device settings.";
        }

        Alert.alert(
          "Recording Error",
          errorMessage,
          [{ text: "OK" }]
        );
      }
    } else {
      // Start recording
      try {
        console.log('🎙️ Starting recording...');

        // Record start time
        recordingStartTime.current = Date.now();

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
        recordingStartTime.current = null;
        Alert.alert(
          "Recording Error",
          "Could not start recording. Please check microphone permissions.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const handleSendMessage = (messageText) => {
    if (!messageText.trim()) return;

    // Add user message with unique ID using timestamp
    const userMessageId = `user-${Date.now()}`;
    const newMessage = {
      id: userMessageId,
      text: messageText.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setTextInput("");

    // Show typing indicator after a delay
    setTimeout(() => {
      setIsTyping(true);
    }, 800);

    // Get AI response with health advice
    setTimeout(async () => {
      try {
        // Call AI service to get contextual response with advice
        const result = await getAIChatResponse(
          messageText.trim(),
          currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
          messages,
          currentUser?.uid
        );

        setIsTyping(false);

        const aiMessageId = `ai-${Date.now()}`;
        const aiResponse = {
          id: aiMessageId,
          text: result.success ? result.response : "I'm here to listen. Can you tell me more about how you're feeling?",
          sender: "ai",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      } catch (error) {
        console.error('Error getting AI response:', error);
        setIsTyping(false);

        // Fallback response in case of error
        const aiMessageId = `ai-${Date.now()}`;
        const aiResponse = {
          id: aiMessageId,
          text: "I'm here to listen. Can you tell me more about how you're feeling?",
          sender: "ai",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      }
    }, 1500);
  };

  const handleSendTextMessage = () => {
    handleSendMessage(textInput);
  };

  const handleFinishSession = () => {
    console.log("🟢 ChatScreen: handleFinishSession called");
    console.log("🟢 Messages array:", messages);

    const conversationText = messages
      .map((msg) => `${msg.sender === "user" ? "Me" : "Assistant"}: ${msg.text}`)
      .join("\n\n");

    console.log("🟢 Conversation text:", conversationText);

    if (onFinish) {
      console.log("🟢 Calling onFinish with", messages.length, "messages");
      onFinish(conversationText, messages);
    } else {
      console.error("❌ onFinish callback is not defined!");
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
        {/* Text input and send button */}
        <View style={styles.inputRow}>
          <View style={[styles.inputContainer, {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border
          }]}>
            <TextInput
              ref={textInputRef}
              style={[styles.textInput, { color: theme.text }]}
              placeholder="Type a message..."
              placeholderTextColor={theme.textSecondary}
              value={textInput}
              onChangeText={setTextInput}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSendTextMessage}
            />
          </View>

          {/* Send button or Mic button */}
          {textInput.trim() ? (
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: theme.primary }]}
              onPress={handleSendTextMessage}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <>
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
                  onPress={handleToggleRecording}
                  activeOpacity={0.7}
                  disabled={isTranscribing}
                >
                  <Ionicons
                    name={isRecording ? "stop" : "mic"}
                    size={28}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </View>

        {!textInput.trim() && (
          <Text style={[styles.micLabel, { color: theme.textSecondary }]}>
            {isTranscribing
              ? "Processing..."
              : isRecording
              ? "Release to send"
              : "Hold to speak"}
          </Text>
        )}

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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    alignItems: "center",
    position: "relative",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
    marginBottom: 12,
  },
  inputContainer: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minHeight: 48,
    maxHeight: 120,
    justifyContent: "center",
  },
  textInput: {
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  ripple: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    right: 6,
  },
  ripple2: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  micLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 12,
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
