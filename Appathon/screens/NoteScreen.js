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
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function NoteScreen({ onBack, onFinish }) {
  const { theme } = useTheme();
  const [noteText, setNoteText] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  const handleGoDeeper = () => {
    // Add prompts to help user go deeper
    const deeperPrompts = [
      "\n\nTell me more about that...",
      "\n\nHow did that make you feel?",
      "\n\nWhat else comes to mind?",
    ];
    const randomPrompt =
      deeperPrompts[Math.floor(Math.random() * deeperPrompts.length)];
    setNoteText(noteText + randomPrompt);
  };

  const handleFinishEntry = () => {
    if (onFinish) {
      onFinish(noteText);
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
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Write your thoughts here..."
          placeholderTextColor={theme.textSecondary}
          multiline={true}
          textAlignVertical="top"
          value={noteText}
          onChangeText={setNoteText}
          autoFocus={true}
        />
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
            },
          ]}
          onPress={handleGoDeeper}
          activeOpacity={0.7}
        >
          <Ionicons name="star" size={22} color={theme.primary} />
          <Text style={[styles.buttonText, { color: theme.primary }]}>
            Go Deeper
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.finishButton,
            { backgroundColor: theme.primary },
          ]}
          onPress={handleFinishEntry}
          disabled={noteText.trim().length === 0}
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
  input: {
    minHeight: 400,
    padding: 24,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "400",
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
