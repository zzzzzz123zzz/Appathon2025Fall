<<<<<<< HEAD
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function OnboardingScreen({ setScreen }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>

      <TouchableOpacity style={styles.button} onPress={() => setScreen("signup")}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => setScreen("login")}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
=======
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function OnboardingScreen({ onGetStarted, onSignIn }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Image
          source={require("../assets/snowLeopard5.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: theme.text }]}>
          Welcome to Appathon
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Your personal journal and wellness companion
        </Text>
        <View style={styles.featuresContainer}>
          <Text style={[styles.feature, { color: theme.text }]}>
            📝 Track your daily thoughts
          </Text>
          <Text style={[styles.feature, { color: theme.text }]}>
            💬 Chat with AI support
          </Text>
          <Text style={[styles.feature, { color: theme.text }]}>
            📊 Review your weekly progress
          </Text>
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
            Already have an account? Sign In
          </Text>
        </TouchableOpacity>
      </View>
>>>>>>> origin/main
    </View>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#005591" },
  title: { color: "#fff", fontSize: 32, marginBottom: 50 },
  button: { marginVertical: 10, padding: 15, backgroundColor: "#fff", borderRadius: 10, width: 200, alignItems: "center" },
  buttonText: { color: "#005591", fontWeight: "700" },
=======
  container: {
    flex: 1,
    paddingHorizontal: 30,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  featuresContainer: {
    gap: 16,
  },
  feature: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingBottom: 40,
    gap: 12,
  },
  getStartedButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  signInButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  signInText: {
    fontSize: 16,
    fontWeight: '600',
  },
>>>>>>> origin/main
});
