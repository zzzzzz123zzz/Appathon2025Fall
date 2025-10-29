import { StyleSheet, View, Text } from "react-native";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function SuccessScreen({ onComplete }) {
  const { theme } = useTheme();

  useEffect(() => {
    // Auto-navigate to home after 2.5 seconds
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
          <Ionicons name="checkmark-circle" size={80} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Entry Saved!</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Your thoughts have been recorded
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 28,
  },
});
