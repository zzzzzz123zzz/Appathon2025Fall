import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function OnboardingScreen({ setScreen }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>

      <TouchableOpacity style={styles.button} onPress={() => setScreen("signup")}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => setScreen("login")}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#005591" },
  title: { color: "#fff", fontSize: 32, marginBottom: 50 },
  button: { marginVertical: 10, padding: 15, backgroundColor: "#fff", borderRadius: 10, width: 200, alignItems: "center" },
  buttonText: { color: "#005591", fontWeight: "700" },
});
