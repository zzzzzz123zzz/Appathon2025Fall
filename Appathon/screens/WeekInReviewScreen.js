import { StyleSheet, Text, View } from "react-native";

export default function WeekInReviewScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Week in Review</Text>
      <Text style={styles.description}>Your generated weekly summaries will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 40,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    color: "#64748b",
    lineHeight: 28,
  },
});
