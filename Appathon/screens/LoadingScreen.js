import { StyleSheet, View, Image, ActivityIndicator } from "react-native";

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/snowLeopard5.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#c1a57d" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#c1a57d",
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
