import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Animated 
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function QuizScreenCondensed({ onNext, onBack }) {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [quizData, setQuizData] = useState({
    mainGoal: null,
    journalingFrequency: null,
    preferredTime: null,
    hobbies: [],
  });

  // Remove the jerky slide animation - just use fade
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const steps = [
    {
      key: 'mainGoal',
      title: "What brings you here?",
      subtitle: "Let's personalize your experience",
      options: [
        { value: "Track my mood", emoji: "😊" },
        { value: "Journal daily", emoji: "📝" },
        { value: "Talk to someone", emoji: "💬" },
        { value: "All of the above", emoji: "✨" },
      ],
      type: 'single',
    },
    {
      key: 'journalingFrequency',
      title: "How often do you want to journal?",
      subtitle: "We'll send gentle reminders",
      options: [
        { value: "Daily", emoji: "☀️" },
        { value: "Few times a week", emoji: "🌤️" },
        { value: "Weekly", emoji: "📅" },
        { value: "When I feel like it", emoji: "🎯" },
      ],
      type: 'single',
    },
    {
      key: 'preferredTime',
      title: "Best time to check in?",
      subtitle: "When are you most reflective?",
      options: [
        { value: "Morning", emoji: "🌅" },
        { value: "Afternoon", emoji: "☀️" },
        { value: "Evening", emoji: "🌆" },
        { value: "Night", emoji: "🌙" },
      ],
      type: 'single',
    },
    {
      key: 'hobbies',
      title: "What energizes you?",
      subtitle: "Select all that apply",
      options: [
        { value: "Reading", emoji: "📚" },
        { value: "Exercise", emoji: "🏃" },
        { value: "Music", emoji: "🎵" },
        { value: "Art", emoji: "🎨" },
        { value: "Nature", emoji: "🌿" },
        { value: "Meditation", emoji: "🧘" },
        { value: "Socializing", emoji: "👥" },
        { value: "Learning", emoji: "💡" },
      ],
      type: 'multiple',
    },
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleSelect = (value) => {
    const { key, type } = currentStepData;

    if (type === 'single') {
      setQuizData({ ...quizData, [key]: value });
    } else {
      const currentValues = quizData[key];
      if (currentValues.includes(value)) {
        setQuizData({
          ...quizData,
          [key]: currentValues.filter((v) => v !== value),
        });
      } else {
        setQuizData({
          ...quizData,
          [key]: [...currentValues, value],
        });
      }
    }
  };

  const canProceed = () => {
    const { key, type } = currentStepData;
    if (type === 'single') {
      return quizData[key] !== null;
    } else {
      return quizData[key].length > 0;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;

    if (currentStep < steps.length - 1) {
      // Smooth fade transition
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Change step after fade starts
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 150);
    } else {
      // Complete quiz
      onNext(quizData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setCurrentStep(currentStep - 1);
      }, 150);
    } else {
      onBack();
    }
  };

  const isSelected = (value) => {
    const { key, type } = currentStepData;
    if (type === 'single') {
      return quizData[key] === value;
    } else {
      return quizData[key].includes(value);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarBackground, { backgroundColor: theme.border }]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: theme.primary,
                width: `${progress}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {currentStep + 1} of {steps.length}
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.backText, { color: theme.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.questionContainer,
            { opacity: fadeAnim }, // Only fade, no jerky slide
          ]}
        >
          <Text style={[styles.title, { color: theme.text }]}>
            {currentStepData.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {currentStepData.subtitle}
          </Text>

          <View style={styles.optionsGrid}>
            {currentStepData.options.map((option) => {
              const selected = isSelected(option.value);
              return (
                <OptionCard
                  key={option.value}
                  option={option}
                  selected={selected}
                  onPress={() => handleSelect(option.value)}
                  theme={theme}
                  type={currentStepData.type}
                />
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: canProceed() ? theme.primary : theme.border,
              opacity: canProceed() ? 1 : 0.5,
            },
          ]}
          onPress={handleNext}
          disabled={!canProceed()}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? "Complete ✨" : "Continue →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function OptionCard({ option, selected, onPress, theme, type }) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
    onPress();
  };

  return (
    <Animated.View
      style={[
        styles.optionCard,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.option,
          {
            backgroundColor: selected ? theme.primary : theme.cardBackground,
            borderColor: selected ? theme.primary : theme.border,
            shadowColor: selected ? theme.primary : "#000",
            shadowOpacity: selected ? 0.3 : 0.05,
          },
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Text style={styles.emoji}>{option.emoji}</Text>
        <Text
          style={[
            styles.optionText,
            {
              color: selected ? "#FFFFFF" : theme.text,
              fontWeight: selected ? "600" : "500",
            },
          ]}
        >
          {option.value}
        </Text>
        {type === 'multiple' && selected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBarContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  questionContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 22,
  },
  optionsGrid: {
    gap: 12,
  },
  optionCard: {
    width: '100%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    gap: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 8,
    elevation: 2,
  },
  emoji: {
    fontSize: 28,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 32,
  },
  nextButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});