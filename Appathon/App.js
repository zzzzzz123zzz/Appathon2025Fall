import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import HistoryScreen from "./screens/HistoryScreen";
import NoteScreen from "./screens/NoteScreen";

export default function App() {
  const [activeTab, setActiveTab] = useState(1);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {activeTab === 1 ? <HistoryScreen /> : <NoteScreen />}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab(1)}
        >
          <Ionicons name="time-outline" size={24} color="#0f172a" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab(2)}
        >
          <Ionicons name="create-outline" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    paddingBottom: 20,
    backgroundColor: "#ffffff",
  },
  tab: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});
