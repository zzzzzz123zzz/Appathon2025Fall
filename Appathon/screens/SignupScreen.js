import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from "react-native";
import GoogleIcon from "../assets/8e4241399baefbe8f8feffab0fe67682e140e1b1.png";

const SignupScreen = ({ setScreen }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create your account</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Type your username"
        placeholderTextColor="rgba(62,62,62,0.25)"
        style={styles.input}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Type your password"
        placeholderTextColor="rgba(62,62,62,0.25)"
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.signupBtn} onPress={() => setScreen("quiz")}>
        <Text style={styles.signupText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.googleBtn}>
        <Image source={GoogleIcon} style={styles.googleIcon} />
        <Text style={styles.googleText}>Sign up with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setScreen("quiz")}>
        <Text style={styles.needAccount}>Need an account? <Text style={styles.clickHere}>Click here</Text></Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 80, backgroundColor: "#005591" },
  header: { fontSize: 24, fontFamily: "Nunito-Bold", color: "#fff", marginBottom: 40 },
  label: { alignSelf: "flex-start", marginLeft: 40, color: "#d9d9d9", fontSize: 20, fontFamily: "Nunito-Bold", marginBottom: 10 },
  input: { width: 282, height: 40, backgroundColor: "#f4f4f4", borderRadius: 30, paddingHorizontal: 20, marginBottom: 20, fontFamily: "Nunito-Medium" },
  signupBtn: { width: 282, height: 40, backgroundColor: "#fff", borderRadius: 30, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  signupText: { color: "#005591", fontFamily: "Nunito-Bold", fontSize: 16 },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", width: 282, height: 40, backgroundColor: "#e3e3e3", borderRadius: 4, marginBottom: 20 },
  googleIcon: { width: 20, height: 20, marginRight: 8 },
  googleText: { fontFamily: "Nunito-Regular", fontSize: 14 },
  needAccount: { color: "#fff", fontFamily: "Nunito-Regular" },
  clickHere: { textDecorationLine: "underline" },
});

export default SignupScreen;
