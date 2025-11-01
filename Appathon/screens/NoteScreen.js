import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { generateEmpatheticPrompt } from "../services/aiPromptService";

export default function NoteScreen({ onBack, onFinish }) {
  const { theme } = useTheme();
  const [noteText, setNoteText] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [noteSegments, setNoteSegments] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const textInputRef = useRef(null);

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

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleGoDeeper = async () => {
    // Don't generate if there's no text or already generating
    if (!currentInput.trim() || isGeneratingPrompt) return;

    setIsGeneratingPrompt(true);

    try {
      // Generate AI-powered empathetic prompt based on user's text
      const aiPrompt = await generateEmpatheticPrompt(currentInput, noteSegments);

      // Add user's current text and AI prompt to segments
      setNoteSegments([
        ...noteSegments,
        { type: 'user', text: currentInput },
        { type: 'ai', text: aiPrompt }
      ]);

      setCurrentInput("");

      // Focus back on input
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);

    } catch (error) {
      console.error('Error generating prompt:', error);

      // Fallback to simple prompt on error
      setNoteSegments([
        ...noteSegments,
        { type: 'user', text: currentInput },
        { type: 'ai', text: "Tell me more about that..." }
      ]);

      setCurrentInput("");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleFinishEntry = () => {
    // Combine all segments and current input into final text
    const allSegments = [
      ...noteSegments,
      ...(currentInput.trim() ? [{ type: 'user', text: currentInput }] : [])
    ];

    const finalText = allSegments
      .map(segment => {
        if (segment.type === 'ai') {
          return `[AI Prompt]: ${segment.text}`;
        }
        return segment.text;
      })
      .join('\n\n');

    console.log("📝 NoteScreen: handleFinishEntry called");
    console.log("📝 Note text length:", finalText.length);
    console.log("📝 This will be saved as a diary entry with AI extraction");

    if (onFinish) {
      onFinish(finalText);
    }
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
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentContainer}>
          {/* Display previous segments */}
          {noteSegments.map((segment, index) => (
            <View key={index}>
              {segment.type === 'user' ? (
                <Text style={[styles.userText, { color: theme.text }]}>
                  {segment.text}
                </Text>
              ) : (
                <View style={styles.aiPromptContainer}>
                  <View style={[styles.aiPromptContent, {
                    backgroundColor: 'rgba(193, 165, 125, 0.08)',
                    borderLeftColor: '#c1a57d'
                  }]}>
                    <Ionicons name="sparkles" size={16} color="#c1a57d" style={styles.aiIcon} />
                    <Text style={[styles.aiPromptText, { color: '#c1a57d' }]}>
                      {segment.text}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))}

          {/* Current input area */}
          <TextInput
            ref={textInputRef}
            style={[styles.input, { color: theme.text }]}
            placeholder={noteSegments.length === 0 ? "Write your thoughts here..." : "Continue writing..."}
            placeholderTextColor={theme.textSecondary}
            multiline={true}
            textAlignVertical="top"
            value={currentInput}
            onChangeText={setCurrentInput}
            autoFocus={true}
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.buttonContainer,
          { backgroundColor: theme.background, borderTopColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            styles.goDeeperButton,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.primary,
              opacity: (isGeneratingPrompt || !currentInput.trim()) ? 0.5 : 1
            },
          ]}
          onPress={handleGoDeeper}
          disabled={isGeneratingPrompt || !currentInput.trim()}
          activeOpacity={0.7}
        >
          {isGeneratingPrompt ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Ionicons name="star" size={22} color={theme.primary} />
          )}
          <Text style={[styles.buttonText, { color: theme.primary }]}>
            {isGeneratingPrompt ? "Thinking..." : "Go Deeper"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.finishButton,
            {
              backgroundColor: theme.primary,
              opacity: (noteSegments.length === 0 && currentInput.trim().length === 0) ? 0.5 : 1
            },
          ]}
          onPress={handleFinishEntry}
          disabled={noteSegments.length === 0 && currentInput.trim().length === 0}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
          <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
            Finish Entry
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 8,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  userText: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "400",
    marginBottom: 20,
  },
  aiPromptContainer: {
    marginVertical: 16,
    marginLeft: 8,
  },
  aiPromptContent: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#c1a57d',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aiIcon: {
    marginRight: 10,
  },
  aiPromptText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    fontStyle: 'italic',
  },
  input: {
    minHeight: 200,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "400",
    paddingVertical: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
    minHeight: 44,
  },
  goDeeperButton: {
    borderWidth: 2.5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  finishButton: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
