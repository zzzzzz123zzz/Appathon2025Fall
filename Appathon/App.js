import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import SignupScreen from "./screens/SignupScreen";
import HistoryScreen from "./screens/HistoryScreen";
import NoteScreen from "./screens/NoteScreen";
import ChatScreen from "./screens/ChatScreen";
import WeekInReviewScreen from "./screens/WeekInReviewScreen";
import LoadingScreen from "./screens/LoadingScreen";
import SummaryScreen from "./screens/SummaryScreen";
import SuccessScreen from "./screens/SuccessScreen";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

function MainApp() {
  const { theme, isDarkMode } = useTheme();

  // stack navigation state
  const [screen, setScreen] = useState("onboarding");
  const [previousScreen, setPreviousScreen] = useState("onboarding");

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Animated navigation function
  const navigateWithAnimation = (targetScreen, animationType = "fade") => {
    setPreviousScreen(screen);

    if (animationType === "modal") {
      // Slide from bottom for modal-like screens
      slideAnim.setValue(1000);
      setScreen(targetScreen);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    } else {
      // Fade transition for regular screens
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setScreen(targetScreen);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const goNext = () => {
    if (screen === "onboarding") navigateWithAnimation("signup");
    else if (screen === "signup") navigateWithAnimation("quiz");
    else if (screen === "quiz") navigateWithAnimation("home");
  };

  const navigateToNote = () => {
    navigateWithAnimation("createNote");
  };

  const navigateToChat = () => {
    navigateWithAnimation("chat", "modal");
  };

  const navigateToSummary = () => {
    navigateWithAnimation("summary");
  };

  const navigateToHome = () => {
    navigateWithAnimation("home");
  };

  const navigateToSuccess = (noteText) => {
    // TODO: Save noteText to storage or backend here
    console.log("Note saved:", noteText);
    navigateWithAnimation("success");
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
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <HistoryScreen
              onCreateNote={navigateToNote}
              onViewSummary={navigateToSummary}
              onStartChat={navigateToChat}
            />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Create Note screen
  if (screen === "createNote") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <NoteScreen onBack={navigateToHome} onFinish={navigateToSuccess} />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Chat screen (modal slide from bottom)
  if (screen === "chat") {
    return (
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
          <ChatScreen onBack={navigateToHome} onFinish={navigateToSuccess} />
        </SafeAreaView>
      </Animated.View>
    );
  }

  // Success screen
  if (screen === "success") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <SuccessScreen onComplete={navigateToHome} />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Summary screen
  if (screen === "summary") {
    return (
      <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <SummaryScreen onBack={navigateToHome} />
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  }

  // Stack navigation screens
  return (
    <View style={[styles.screenWrapper, { backgroundColor: "#FFFFFF" }]}>
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
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
      </Animated.View>
    </View>
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
  screenWrapper: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
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
