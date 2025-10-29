import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import SettingsDrawer from "../components/SettingsDrawer";

export default function HistoryScreen({ onCreateNote, onViewSummary }) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            {greeting},
          </Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.username, { color: theme.primary }]}
          >
            Theodore 👋
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setSettingsVisible(true)}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={28} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={theme.primary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search your notes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.textSecondary}
        />
        {searchQuery.length > 0 && (
          <Ionicons
            name="close-circle"
            size={20}
            color={theme.text}
            style={styles.clearIcon}
            onPress={() => setSearchQuery("")}
          />
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.primary }]}
          onPress={onCreateNote}
        >
          <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
          <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
            Create Note
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.primary }]}
          onPress={onViewSummary}
        >
          <Ionicons name="bar-chart-outline" size={22} color={theme.primary} />
          <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
            Summary
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.description, { color: theme.text }]}>
        Your journal entries will appear here
      </Text>

      <SettingsDrawer
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  settingsButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearIcon: {
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  description: {
    fontSize: 18,
    lineHeight: 28,
    opacity: 0.7,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "400",
  },
  username: {
    fontSize: 32,
    fontWeight: "700",
  },
});
