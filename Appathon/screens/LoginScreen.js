import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function LoginScreen({ setScreen }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log In</Text>
      <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={styles.input} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <TouchableOpacity style={styles.button} onPress={() => setScreen("home")}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setScreen("signup")}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#005591" },
  title: { fontSize: 32, color: "#fff", marginBottom: 30 },
  input: { width: "80%", height: 50, backgroundColor: "#fff", marginVertical: 10, paddingHorizontal: 15, borderRadius: 10 },
  button: { width: "80%", height: 50, backgroundColor: "#f4f4f4", justifyContent: "center", alignItems: "center", borderRadius: 10, marginVertical: 10 },
  buttonText: { color: "#005591", fontWeight: "700" },
  linkText: { color: "#fff", textDecorationLine: "underline", marginTop: 20 },
});
