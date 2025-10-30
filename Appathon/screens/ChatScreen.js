import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

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
  const [isRecording, setIsRecording] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;

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

  const handleStartRecording = () => {
    setIsRecording(true);
    // TODO: Start actual voice recording
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // TODO: Stop recording and process speech
    // For now, add a dummy user message
    const newMessage = {
      id: messages.length + 1,
      text: "This is where your voice message will appear...",
      sender: "user",
      timestamp: new Date(),
    };
    setMessages([...messages, newMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        text: "I understand. Can you tell me more about that?",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
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
              },
            ]}
            onPressIn={handleStartRecording}
            onPressOut={handleStopRecording}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isRecording ? "stop" : "mic"}
              size={56}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </Animated.View>

        <Text style={[styles.micLabel, { color: theme.textSecondary }]}>
          {isRecording ? "Release to send" : "Hold to speak"}
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
