import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import SignupScreen from "./screens/SignupScreen";
import HistoryScreen from "./screens/HistoryScreen";
import NoteScreen from "./screens/NoteScreen";
import WeekInReviewScreen from "./screens/WeekInReviewScreen";
import LoadingScreen from "./screens/LoadingScreen";

// Color scheme
const colors = {
  caramelBrown: "#c1a57d",
  accentGrey: "#f4f4f4",
  white: "#ffffff",
  textGrey: "#444444",
};

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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.content}>{content}</View>

          <View style={styles.tabBarContainer}>
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={styles.tab}
                onPress={() => setActiveTab("dashboard")}
              >
                <Ionicons
                  name="time-outline"
                  size={28}
                  color={activeTab === "dashboard" ? colors.caramelBrown : colors.textGrey}
                  style={{ opacity: activeTab === "dashboard" ? 1 : 0.5 }}
                />
                <Text
                  style={
                    activeTab === "dashboard"
                      ? styles.activeTabText
                      : styles.tabText
                  }
                >
                  Dashboard
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tab}
                onPress={() => setActiveTab("journal")}
              >
                <Ionicons
                  name="create-outline"
                  size={28}
                  color={activeTab === "journal" ? colors.caramelBrown : colors.textGrey}
                  style={{ opacity: activeTab === "journal" ? 1 : 0.5 }}
                />
                <Text
                  style={
                    activeTab === "journal" ? styles.activeTabText : styles.tabText
                  }
                >
                  Journal
                </Text>
              </TouchableOpacity>
              {/* <TouchableOpacity style={styles.tab} onPress={() => setActiveTab("week")}>
                <Ionicons name="calendar-outline" size={24} color={activeTab === "week" ? "#0f172a" : "#94a3b8"} />
                <Text style={activeTab === "week" ? styles.activeTabText : styles.tabText}>Week Review</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Stack navigation screens
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {screen === "signup" ? (
          <SignupScreen />
        ) : (
          <Placeholder title={screen === "onboarding" ? "Onboarding" : "Quiz"} />
        )}
        <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
          <Text style={styles.nextText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  placeholderText: {
    fontSize: 32,
    color: colors.textGrey,
    fontWeight: "600",
  },
  nextBtn: {
    backgroundColor: colors.caramelBrown,
    padding: 14,
    borderRadius: 12,
    margin: 20,
    alignSelf: "center",
  },
  nextText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "600",
  },
  tabBarContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.accentGrey,
    paddingBottom: Platform.OS === "ios" ? 20 : 12,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.white,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  tabText: {
    fontSize: 14,
    color: colors.textGrey,
    marginTop: 6,
    opacity: 0.5,
  },
  activeTabText: {
    fontSize: 14,
    color: colors.caramelBrown,
    marginTop: 6,
    fontWeight: "600",
  },
});
