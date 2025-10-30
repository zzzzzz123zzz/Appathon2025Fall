import { StyleSheet, Text, View } from "react-native";

const colors = {
  caramelBrown: "#c1a57d",
  accentGrey: "#f4f4f4",
  white: "#ffffff",
  textGrey: "#444444",
};

export default function WeekInReviewScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Week in Review</Text>
      <Text style={styles.description}>
        Your generated weekly summaries will appear here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 40,
    fontWeight: "600",
    color: colors.caramelBrown,
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    color: colors.textGrey,
    lineHeight: 28,
    opacity: 0.7,
  },
});
