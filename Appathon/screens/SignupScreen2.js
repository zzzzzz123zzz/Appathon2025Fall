import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SignupScreen2({ onNext, onBack }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');

  const isValidEmail = (email) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleNext = () => {
    if (email.trim() && isValidEmail(email)) {
      onNext({ email });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
            >
              <Text style={[styles.backText, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, { backgroundColor: theme.primary }]} />
            <View style={[styles.progressDot, { backgroundColor: theme.primary }]} />
            <View style={[styles.progressDot, { backgroundColor: theme.border }]} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            What's your email?
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            We'll use this to sign you in
          </Text>

          <View style={styles.formContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.cardBackground,
                  color: theme.text,
                  borderColor: theme.border
                }
              ]}
              placeholder="Enter your email"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />

            <TouchableOpacity
              style={[
                styles.nextButton,
                {
                  backgroundColor: (email.trim() && isValidEmail(email)) ? theme.primary : theme.border,
                  opacity: (email.trim() && isValidEmail(email)) ? 1 : 0.5
                }
              ]}
              onPress={handleNext}
              disabled={!(email.trim() && isValidEmail(email))}
            >
              <Text style={styles.nextButtonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  formContainer: {
    marginTop: 20,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 24,
    borderWidth: 1,
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
