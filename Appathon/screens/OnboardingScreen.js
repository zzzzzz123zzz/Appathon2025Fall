import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

const FEATURES = [
  "Track your daily thoughts",
  "Chat with AI support",
  "Review your weekly progress",
  "Voice journaling",
  "Mood tracking",
  "Smart reminders",
  "Personalized insights",
  "Wellness companion",
];

export default function OnboardingScreen({ onGetStarted, onSignIn }) {
  const { theme } = useTheme();
  const scrollViewRef = useRef(null);
  const scrollPosition = useRef(0);

  useEffect(() => {
    // Auto-scroll animation for features
    const autoScroll = setInterval(() => {
      scrollPosition.current += 0.3;

      // Calculate when to reset (after scrolling through original features)
      const featureWidth = 180; // approximate width per feature
      const totalWidth = featureWidth * FEATURES.length;

      if (scrollPosition.current >= totalWidth) {
        scrollPosition.current = 0;
      }

      scrollViewRef.current?.scrollTo({
        x: scrollPosition.current,
        animated: false,
      });
    }, 16); // ~60fps

    return () => clearInterval(autoScroll);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Image
          source={require("../assets/snowLeopard5.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: theme.text }]}>
          Welcome to Theohealth
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Your personal journal and wellness companion
        </Text>

        {/* Scrolling Features */}
        <View style={styles.featuresWrapper}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            contentContainerStyle={styles.featuresContainer}
          >
            {/* Triple the features for seamless infinite loop */}
            {[...FEATURES, ...FEATURES, ...FEATURES].map((feature, index) => (
              <Text key={index} style={[styles.feature, { color: theme.text }]}>
                {feature}
              </Text>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.getStartedButton, { backgroundColor: theme.primary }]}
          onPress={onGetStarted}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signInButton, { borderColor: theme.primary }]}
          onPress={onSignIn}
        >
          <Text style={[styles.signInText, { color: theme.primary }]}>
            Already have an account?
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
  },
  featuresWrapper: {
    width: width,
    height: 40,
    overflow: "hidden",
  },
  featuresContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    paddingHorizontal: 20,
  },
  feature: {
    fontSize: 17,
    opacity: 0.7,
    marginRight: 8,
    fontStyle: "italic",
  },
  buttonContainer: {
    paddingBottom: 40,
    gap: 12,
  },
  getStartedButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  getStartedText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  signInButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
  },
  signInText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
