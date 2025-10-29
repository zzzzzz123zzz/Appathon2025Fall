import { StyleSheet, View, Image, ActivityIndicator } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function LoadingScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Image
        source={require("../assets/snowLeopard5.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 280,
    height: 280,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});
