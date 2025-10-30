import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function QuizScreen5({ onNext, onBack }) {
  const { theme } = useTheme();
  const [selectedOptions, setSelectedOptions] = useState([]);

  const options = [
    "Anxiety",
    "Depression",
    "Stress",
    "Sleep issues",
    "ADHD",
    "PTSD",
    "Eating disorders",
    "Bipolar disorder",
    "Social anxiety",
    "None of these",
    "Prefer not to say"
  ];

  const toggleOption = (option) => {
    // If "None of these" or "Prefer not to say" is selected, clear all others
    if (option === "None of these" || option === "Prefer not to say") {
      setSelectedOptions([option]);
    } else {
      // Remove "None of these" and "Prefer not to say" if selecting other options
      const filteredOptions = selectedOptions.filter(
        o => o !== "None of these" && o !== "Prefer not to say"
      );

      if (filteredOptions.includes(option)) {
        setSelectedOptions(filteredOptions.filter(o => o !== option));
      } else {
        setSelectedOptions([...filteredOptions, option]);
      }
    }
  };

  const handleNext = () => {
    if (selectedOptions.length > 0) {
      onNext({ conditions: selectedOptions });
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={[styles.backText, { color: theme.primary }]}>← Back</Text>
          </TouchableOpacity>
        )}

        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, { backgroundColor: theme.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: theme.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: theme.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: theme.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: theme.primary }]} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          Are you experiencing any of these?
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          This helps us provide better personalized support. Your information is private and secure.
        </Text>

        <View style={styles.optionsContainer}>
          {options.map((option) => {
            const isSelected = selectedOptions.includes(option);
            const isSpecialOption = option === "None of these" || option === "Prefer not to say";

            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.cardBackground,
                    borderColor: theme.border,
                    borderWidth: isSpecialOption ? 2 : 1,
                  }
                ]}
                onPress={() => toggleOption(option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.text,
                      fontWeight: isSpecialOption ? '600' : 'normal'
                    }
                  ]}
                >
                  {option}
                </Text>
                {isSelected && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: selectedOptions.length > 0 ? theme.primary : theme.border,
              opacity: selectedOptions.length > 0 ? 1 : 0.5
            }
          ]}
          onPress={handleNext}
          disabled={selectedOptions.length === 0}
        >
          <Text style={styles.nextButtonText}>Complete →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    paddingBottom: 60,
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  optionsContainer: {
    marginBottom: 32,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
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
