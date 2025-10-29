import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import SignupScreen from "./screens/SignupScreen";
import HistoryScreen from "./screens/HistoryScreen";
import NoteScreen from "./screens/NoteScreen";
import WeekInReviewScreen from "./screens/WeekInReviewScreen";
import LoadingScreen from "./screens/LoadingScreen";
import SummaryScreen from "./screens/SummaryScreen";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

function MainApp() {
  const { theme, isDarkMode } = useTheme();

  // stack navigation state
  const [screen, setScreen] = useState("onboarding");

  const goNext = () => {
    if (screen === "onboarding") setScreen("signup");
    else if (screen === "signup") setScreen("quiz");
    else if (screen === "quiz") setScreen("home");
  };

  const navigateToNote = () => {
    setScreen("createNote");
  };

  const navigateToSummary = () => {
    setScreen("summary");
  };

  const navigateToHome = () => {
    setScreen("home");
  };

  // Placeholder for screens not implemented yet
  const Placeholder = ({ title }) => (
    <View style={[styles.placeholder, { backgroundColor: theme.background }]}>
      <Text style={[styles.placeholderText, { color: theme.text }]}>{title}</Text>
    </View>
  );

  // Home screen (Dashboard)
  if (screen === "home") {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <HistoryScreen onCreateNote={navigateToNote} onViewSummary={navigateToSummary} />
      </SafeAreaView>
    );
  }

  // Create Note screen
  if (screen === "createNote") {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <NoteScreen onBack={navigateToHome} />
      </SafeAreaView>
    );
  }

  // Summary screen
  if (screen === "summary") {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <SummaryScreen onBack={navigateToHome} />
      </SafeAreaView>
    );
  }

  // Stack navigation screens
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {screen === "signup" ? (
          <SignupScreen />
        ) : (
          <Placeholder title={screen === "onboarding" ? "Onboarding" : "Quiz"} />
        )}
        <TouchableOpacity style={[styles.nextBtn, { backgroundColor: theme.primary }]} onPress={goNext}>
          <Text style={styles.nextText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: "600",
  },
  nextBtn: {
    padding: 14,
    borderRadius: 12,
    margin: 20,
    alignSelf: "center",
  },
  nextText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
  },
});
