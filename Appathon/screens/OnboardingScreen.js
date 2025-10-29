import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function OnboardingScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
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
});
