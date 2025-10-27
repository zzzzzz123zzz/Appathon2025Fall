import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import OnboardingScreen from "./screens/OnboardingScreen";
import SignupScreen from "./screens/SignupScreen";
import QuizScreen from "./screens/QuizScreen";
import LoginScreen from "./screens/LoginScreen";

import HistoryScreen from "./screens/HistoryScreen";
import NoteScreen from "./screens/NoteScreen";
import WeekInReviewScreen from "./screens/WeekInReviewScreen";

export default function App() {
  const [screen, setScreen] = useState("onboarding");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Home tab content
  if (screen === "home") {
    let content;
    if (activeTab === "dashboard") content = <HistoryScreen />;
    else if (activeTab === "journal") content = <NoteScreen />;
    else if (activeTab === "week") content = <WeekInReviewScreen />;

    return (
      <View style={styles.container}>
        <View style={styles.content}>{content}</View>
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab("dashboard")}>
            <Ionicons name="time-outline" size={24} color={activeTab === "dashboard" ? "#0f172a" : "#94a3b8"} />
            <Text style={activeTab === "dashboard" ? styles.activeTabText : styles.tabText}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab("journal")}>
            <Ionicons name="create-outline" size={24} color={activeTab === "journal" ? "#0f172a" : "#94a3b8"} />
            <Text style={activeTab === "journal" ? styles.activeTabText : styles.tabText}>Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab("week")}>
            <Ionicons name="calendar-outline" size={24} color={activeTab === "week" ? "#0f172a" : "#94a3b8"} />
            <Text style={activeTab === "week" ? styles.activeTabText : styles.tabText}>Week Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Stack navigation
  return (
    <View style={styles.container}>
      {screen === "onboarding" && <OnboardingScreen setScreen={setScreen} />}
      {screen === "signup" && <SignupScreen setScreen={setScreen} />}
      {screen === "quiz" && <QuizScreen setScreen={setScreen} />}
      {screen === "login" && <LoginScreen setScreen={setScreen} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  tabBar: { flexDirection: "row", height: 70, borderTopWidth: 1, borderTopColor: "#e2e8f0", justifyContent: "space-around", alignItems: "center" },
  tab: { justifyContent: "center", alignItems: "center" },
  tabText: { fontSize: 12, color: "#94a3b8" },
  activeTabText: { fontSize: 12, color: "#0f172a", fontWeight: "700" },
});
