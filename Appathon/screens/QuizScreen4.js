import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function QuizScreen4({ onNext, onBack }) {
  const { theme } = useTheme();
  const [selectedOptions, setSelectedOptions] = useState([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const options = [
    "Reading",
    "Exercise/Sports",
    "Music",
    "Art/Crafts",
    "Gaming",
    "Cooking",
    "Outdoors/Nature",
    "Meditation/Yoga",
    "Socializing",
    "Learning new things"
  ];

  const toggleOption = (option) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter(o => o !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  const handleNext = () => {
    if (selectedOptions.length > 0) {
      onNext({ hobbies: selectedOptions });
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
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
          <View style={[styles.progressDot, { backgroundColor: theme.border }]} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          What are your interests?
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Select all that apply - this helps us provide better support
        </Text>

        <View style={styles.optionsContainer}>
          {options.map((option) => {
            const isSelected = selectedOptions.includes(option);
            return (
              <Animated.View key={option} style={{ transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }], opacity: fadeAnim }}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.cardBackground,
                      borderColor: theme.border
                    }
                  ]}
                  onPress={() => toggleOption(option)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: isSelected ? '#FFFFFF' : theme.text }
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
          <Text style={styles.nextButtonText}>
            Next → ({selectedOptions.length} selected)
          </Text>
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
    borderWidth: 1,
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
