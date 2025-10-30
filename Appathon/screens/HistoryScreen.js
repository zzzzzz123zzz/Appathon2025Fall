import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import SettingsDrawer from "../components/SettingsDrawer";
import { getUserNotes } from "../services/firestoreService";
import { getUserProfile } from "../services/firestoreService";

export default function HistoryScreen({
  onCreateNote,
  onViewSummary,
  onStartChat,
  onEditProfile,
  currentUser,
}) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const micButtonScale = useRef(new Animated.Value(1)).current;

  // Fetch user profile and notes
  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser) return;

    try {
      // Get user profile
      const profileResult = await getUserProfile(currentUser.uid);
      if (profileResult.success && profileResult.data.name) {
        setUserName(profileResult.data.name);
      }

      // Get notes
      const notesResult = await getUserNotes(currentUser.uid);
      if (notesResult.success) {
        setNotes(notesResult.data);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const handleMicPress = () => {
    Animated.sequence([
      Animated.timing(micButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(micButtonScale, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onStartChat();
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerSection}>
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
              {userName} 👋
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setSettingsVisible(true)}
            style={styles.profilePictureButton}
          >
            <View
              style={[styles.profilePicture, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="person" size={24} color="#FFFFFF" />
            </View>
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
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search your notes..."
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
              New Entry
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
      </View>

      {/* Notes Section - Now takes up most of the screen */}
      <View style={styles.notesSection}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : notes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={80} color={theme.border} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No entries yet
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
              Start journaling by creating your first entry
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.notesScrollView}
            contentContainerStyle={styles.notesContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {filteredNotes.map((note) => (
              <TouchableOpacity
                key={note.id}
                style={[
                  styles.noteCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.noteContent, { color: theme.text }]} numberOfLines={4}>
                  {note.content}
                </Text>
                <View style={styles.noteFooter}>
                  <Text style={[styles.noteDate, { color: theme.textSecondary }]}>
                    {note.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                  </Text>
                  {note.mood && (
                    <View style={[styles.moodBadge, { backgroundColor: theme.primary + '20' }]}>
                      <Text style={[styles.moodText, { color: theme.primary }]}>
                        {note.mood}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Floating Action Button for Voice */}
      <TouchableOpacity
        style={[styles.fabButton, { backgroundColor: theme.primary }]}
        onPress={handleMicPress}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: micButtonScale }] }}>
          <Ionicons name="mic" size={28} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>

      <SettingsDrawer
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onEditProfile={() => {
          setSettingsVisible(false);
          if (onEditProfile) {
            onEditProfile();
          }
        }}
        currentUser={currentUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  profilePictureButton: {
    padding: 4,
  },
  profilePicture: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
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
  notesSection: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  notesScrollView: {
    flex: 1,
  },
  notesContentContainer: {
    paddingTop: 16,
    paddingBottom: 80,
  },
  noteCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noteContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteDate: {
    fontSize: 13,
    fontWeight: "500",
  },
  moodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  fabButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
