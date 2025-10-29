import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function WeekInReviewScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.primary }]}>Week in Review</Text>
      <Text style={[styles.description, { color: theme.text }]}>Your generated weekly summaries will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 40,
    fontWeight: "600",
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    lineHeight: 28,
    opacity: 0.7,
  },
});
