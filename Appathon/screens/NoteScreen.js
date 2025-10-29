import { StyleSheet, TextInput, View, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

const colors = {
  caramelBrown: "#c1a57d",
  accentGrey: "#f4f4f4",
  white: "#ffffff",
  textGrey: "#444444",
};

const prompts = [
  "How was your day?",
  "What's on your mind?",
  "How are you feeling?",
  "What made you smile today?",
  "What's weighing on you?",
  "What are you grateful for?",
];

export default function NoteScreen() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [placeholder, setPlaceholder] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const currentPrompt = prompts[promptIndex];

    const typingSpeed = isDeleting ? 30 : 80;
    const pauseTime = isDeleting ? 500 : 2000;

    const timeout = setTimeout(() => {
      if (!isDeleting && charIndex < currentPrompt.length) {
        // Typing
        setPlaceholder(currentPrompt.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      } else if (!isDeleting && charIndex === currentPrompt.length) {
        // Pause before deleting
        setTimeout(() => setIsDeleting(true), pauseTime);
      } else if (isDeleting && charIndex > 0) {
        // Deleting
        setPlaceholder(currentPrompt.substring(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      } else if (isDeleting && charIndex === 0) {
        // Move to next prompt
        setIsDeleting(false);
        setPromptIndex((promptIndex + 1) % prompts.length);
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, promptIndex]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          multiline={true}
          textAlignVertical="top"
        />
      </ScrollView>
      {keyboardVisible && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => Keyboard.dismiss()}
        >
          <Ionicons name="chevron-down-circle" size={44} color={colors.caramelBrown} />
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
  },
  input: {
    minHeight: 500,
    padding: 24,
    fontSize: 18,
    lineHeight: 28,
    color: colors.textGrey,
  },
  dismissButton: {
    position: "absolute",
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    backgroundColor: colors.accentGrey,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
