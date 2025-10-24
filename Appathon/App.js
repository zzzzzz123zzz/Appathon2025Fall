import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
} from "react-native";

export default function App() {
  const handlePress = () => {
    Linking.openURL(
      "https://open.spotify.com/user/27pvuzsj2e0tnjn0a5bbz0us4?si=4bb091fe602f417e"
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <Text style={styles.title}>Kuldeep was here</Text>

        <Text style={styles.description}>have a good weekend!</Text>

        <TouchableOpacity style={styles.link} onPress={handlePress}>
          <Text style={styles.linkText}>Learn more →</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    alignItems: "flex-start",
  },
  title: {
    fontSize: 40,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 16,
    fontFamily: "System",
  },
  description: {
    fontSize: 16,
    color: "#64748b",
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: "System",
  },
  link: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 15,
    color: "#475569",
    fontFamily: "System",
  },
});
