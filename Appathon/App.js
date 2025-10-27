import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import SignupScreen from "./screens/SignupScreen";
import HistoryScreen from "./screens/HistoryScreen";
import NoteScreen from "./screens/NoteScreen";
import WeekInReviewScreen from "./screens/WeekInReviewScreen";

// Placeholder for screens not implemented yet
const Placeholder = ({ title }) => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>{title}</Text>
  </View>
);

export default function App() {
  // stack navigation state
  const [screen, setScreen] = useState("onboarding");

  // tab navigation state
  const [activeTab, setActiveTab] = useState("dashboard");

  const goNext = () => {
    if (screen === "onboarding") setScreen("signup");
    else if (screen === "signup") setScreen("quiz");
    else if (screen === "quiz") setScreen("home");
  };

  // Home screen with tab navigation
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

  // Stack navigation screens
  return (
    <View style={styles.container}>
      {screen === "signup" ? <SignupScreen /> : <Placeholder title={screen === "onboarding" ? "Onboarding" : "Quiz"} />}
      <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
        <Text style={styles.nextText}>Next →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  placeholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  placeholderText: { fontSize: 24, color: "#0f172a" },
  nextBtn: { backgroundColor: "#0f172a", padding: 10, borderRadius: 8, margin: 20, alignSelf: "center" },
  nextText: { color: "white", fontSize: 18 },
  tabBar: { flexDirection: "row", backgroundColor: "#ffffff", paddingVertical: 10 },
  tab: { flex: 1, alignItems: "center" },
  tabText: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  activeTabText: { fontSize: 12, color: "#0f172a", marginTop: 4 },
});
