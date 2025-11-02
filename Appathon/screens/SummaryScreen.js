import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function SummaryScreen({ onBack }) {
  const { theme } = useTheme();
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Get current week range
  const getWeekRange = () => {
    const now = new Date();
    const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
    const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6));

    const options = { month: "short", day: "numeric" };
    return `${firstDay.toLocaleDateString(
      "en-US",
      options
    )} - ${lastDay.toLocaleDateString("en-US", options)}`;
  };

  // Placeholder data - will be replaced with Firebase data
  const summaryData = {
    symptoms: ["Headache (3 days)", "Fatigue (5 days)", "Anxiety (2 days)"],
    medications: ["Medication A - 2x daily", "Medication B - As needed"],
    mood: [
      { day: "Mon", mood: "Good", color: theme.primary },
      { day: "Tue", mood: "Fair", color: theme.textSecondary },
      { day: "Wed", mood: "Good", color: theme.primary },
      { day: "Thu", mood: "Excellent", color: theme.primary },
      { day: "Fri", mood: "Fair", color: theme.textSecondary },
      { day: "Sat", mood: "Good", color: theme.primary },
      { day: "Sun", mood: "Good", color: theme.primary },
    ],
    challenges: ["Sleep disruption", "Work stress", "Diet changes"],
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Summary
          </Text>
          <Text style={[styles.weekRange, { color: theme.textSecondary }]}>
            {getWeekRange()}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Symptoms Section */}
        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="medical-outline" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Symptoms
            </Text>
          </View>
          {summaryData.symptoms.length > 0 ? (
            summaryData.symptoms.map((symptom, index) => (
              <View
                key={index}
                style={[styles.item, { borderBottomColor: theme.border }]}
              >
                <Text style={[styles.itemText, { color: theme.text }]}>
                  {symptom}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No symptoms recorded
            </Text>
          )}
        </View>

        {/* Medications Section */}
        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="fitness-outline" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Medications
            </Text>
          </View>
          {summaryData.medications.length > 0 ? (
            summaryData.medications.map((med, index) => (
              <View
                key={index}
                style={[styles.item, { borderBottomColor: theme.border }]}
              >
                <Text style={[styles.itemText, { color: theme.text }]}>
                  {med}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No medications recorded
            </Text>
          )}
        </View>

        {/* Mood Over Week Section */}
        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="happy-outline" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Mood This Week
            </Text>
          </View>
          <View style={styles.moodContainer}>
            {summaryData.mood.map((item, index) => (
              <View key={index} style={styles.moodDay}>
                <Text style={[styles.dayText, { color: theme.textSecondary }]}>
                  {item.day}
                </Text>
                <View
                  style={[
                    styles.moodIndicator,
                    { backgroundColor: item.color },
                  ]}
                />
                <Text style={[styles.moodText, { color: theme.text }]}>
                  {item.mood}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Challenges Section */}
        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons
              name="alert-circle-outline"
              size={24}
              color={theme.primary}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Challenges
            </Text>
          </View>
          {summaryData.challenges.length > 0 ? (
            summaryData.challenges.map((challenge, index) => (
              <View
                key={index}
                style={[styles.item, { borderBottomColor: theme.border }]}
              >
                <Text style={[styles.itemText, { color: theme.text }]}>
                  {challenge}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No challenges recorded
            </Text>
          )}
        </View>

        {/* Additional Notes Section */}
        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Additional Notes
            </Text>
          </View>
          <TextInput
            style={[
              styles.notesInput,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.background,
              },
            ]}
            placeholder="Add any additional observations..."
            placeholderTextColor={theme.textSecondary}
            multiline={true}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  weekRange: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  placeholder: {
    width: 48,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 15,
    fontStyle: "italic",
    paddingVertical: 12,
  },
  moodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 4,
  },
  moodDay: {
    alignItems: "center",
    flex: 1,
  },
  dayText: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "600",
  },
  moodIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  moodText: {
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "600",
  },
  notesInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    fontSize: 16,
    marginTop: 12,
    lineHeight: 24,
  },
});
