import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Animated, Keyboard } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function QuizScreen5({ onNext, onBack }) {
  const { theme } = useTheme();
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const customInputAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in and slide up animation on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Animate custom input field
    Animated.timing(customInputAnim, {
      toValue: showCustomInput ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showCustomInput]);

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
    "Something else",
    "None of these",
    "Prefer not to say"
  ];

  const toggleOption = (option) => {
    // If "None of these" or "Prefer not to say" is selected, clear all others
    if (option === "None of these" || option === "Prefer not to say") {
      setSelectedOptions([option]);
      setShowCustomInput(false);
      setCustomInput('');
    } else if (option === "Something else") {
      // Toggle "Something else" and show input field
      const filteredOptions = selectedOptions.filter(
        o => o !== "None of these" && o !== "Prefer not to say"
      );

      if (filteredOptions.includes(option)) {
        setSelectedOptions(filteredOptions.filter(o => o !== option));
        setShowCustomInput(false);
        setCustomInput('');
      } else {
        setSelectedOptions([...filteredOptions, option]);
        setShowCustomInput(true);
      }
    } else {
      // Remove "None of these", "Prefer not to say", and "Something else" if selecting other options
      const filteredOptions = selectedOptions.filter(
        o => o !== "None of these" && o !== "Prefer not to say" && o !== "Something else"
      );

      if (filteredOptions.includes(option)) {
        setSelectedOptions(filteredOptions.filter(o => o !== option));
      } else {
        setSelectedOptions([...filteredOptions, option]);
      }
      setShowCustomInput(false);
      setCustomInput('');
    }
  };

  const handleNext = () => {
    if (selectedOptions.length > 0) {
      const conditions = [...selectedOptions];

      // If "Something else" is selected and user entered custom text, include it
      if (selectedOptions.includes("Something else") && customInput.trim()) {
        const index = conditions.indexOf("Something else");
        conditions[index] = `Something else: ${customInput.trim()}`;
      }

      onNext({ conditions });
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
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
          {options.map((option, index) => {
            const isSelected = selectedOptions.includes(option);
            const isSpecialOption = option === "None of these" || option === "Prefer not to say";
            const isSomethingElse = option === "Something else";

            return (
              <Animated.View
                key={option}
                style={{
                  transform: [{
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    })
                  }],
                  opacity: fadeAnim,
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.cardBackground,
                      borderColor: theme.border,
                      borderWidth: isSpecialOption ? 2 : 1,
                    }
                  ]}
                  onPress={() => toggleOption(option)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: isSelected ? '#FFFFFF' : theme.text,
                        fontWeight: (isSpecialOption || isSomethingElse) ? '600' : 'normal'
                      }
                    ]}
                  >
                    {option}
                  </Text>
                  {isSelected && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Custom Input Field for "Something else" */}
        {showCustomInput && (
          <Animated.View
            style={[
              styles.customInputContainer,
              {
                maxHeight: customInputAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 120],
                }),
                opacity: customInputAnim,
              }
            ]}
          >
            <TextInput
              style={[
                styles.customInput,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                  color: theme.text,
                }
              ]}
              placeholder="Please describe..."
              placeholderTextColor={theme.textSecondary}
              value={customInput}
              onChangeText={setCustomInput}
              multiline
              numberOfLines={3}
              maxLength={200}
              autoFocus
            />
            <Text style={[styles.characterCount, { color: theme.textSecondary }]}>
              {customInput.length}/200
            </Text>
          </Animated.View>
        )}

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
      </Animated.View>
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
  customInputContainer: {
    marginBottom: 24,
    overflow: 'hidden',
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
    marginRight: 4,
  },
});
