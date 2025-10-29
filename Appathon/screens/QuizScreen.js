import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function QuizScreen() {
  const { theme } = useTheme();
  const [selectedOptions, setSelectedOptions] = useState({});

  const questions = [
    {
      id: 1,
      question: "What's your main goal?",
      options: ["Track my mood", "Journal daily", "Talk to someone", "All of the above"]
    },
    {
      id: 2,
      question: "How often do you want to journal?",
      options: ["Daily", "Few times a week", "Weekly", "When I feel like it"]
    },
    {
      id: 3,
      question: "What time works best for you?",
      options: ["Morning", "Afternoon", "Evening", "Night"]
    }
  ];

  const handleSelect = (questionId, option) => {
    setSelectedOptions({
      ...selectedOptions,
      [questionId]: option
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          Let's personalize your experience
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Answer a few questions to get started
        </Text>

        {questions.map((q) => (
          <View key={q.id} style={styles.questionContainer}>
            <Text style={[styles.questionText, { color: theme.text }]}>
              {q.question}
            </Text>
            {q.options.map((option) => {
              const isSelected = selectedOptions[q.id] === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.cardBackground,
                      borderColor: theme.border
                    }
                  ]}
                  onPress={() => handleSelect(q.id, option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: isSelected ? '#FFFFFF' : theme.text }
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
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
  questionContainer: {
    marginBottom: 32,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
