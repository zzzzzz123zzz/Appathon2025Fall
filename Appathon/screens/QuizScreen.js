import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";

const QuizScreen = ({ setScreen }) => {
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Quiz Step 2</Text>

      <Text style={styles.label}>Question 1</Text>
      <TextInput
        value={answer1}
        onChangeText={setAnswer1}
        placeholder="Type your answer"
        placeholderTextColor="rgba(62,62,62,0.25)"
        style={styles.input}
      />

      <Text style={styles.label}>Question 2</Text>
      <TextInput
        value={answer2}
        onChangeText={setAnswer2}
        placeholder="Type your answer"
        placeholderTextColor="rgba(62,62,62,0.25)"
        style={styles.input}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={() => setScreen("home")}>
        <Text style={styles.submitText}>Finish</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 80, backgroundColor: "#005591" },
  header: { fontSize: 24, fontFamily: "Nunito-Bold", color: "#fff", marginBottom: 40 },
  label: { alignSelf: "flex-start", marginLeft: 40, color: "#d9d9d9", fontSize: 20, fontFamily: "Nunito-Bold", marginBottom: 10 },
  input: { width: 282, height: 40, backgroundColor: "#f4f4f4", borderRadius: 30, paddingHorizontal: 20, marginBottom: 20, fontFamily: "Nunito-Medium" },
  submitBtn: { width: 282, height: 40, backgroundColor: "#fff", borderRadius: 30, justifyContent: "center", alignItems: "center", marginTop: 20 },
  submitText: { color: "#005591", fontFamily: "Nunito-Bold", fontSize: 16 },
});

export default QuizScreen;
