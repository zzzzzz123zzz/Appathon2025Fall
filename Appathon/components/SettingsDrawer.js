import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Switch,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from "../context/ThemeContext";
import { getUserProfile, saveUserProfile } from "../services/firestoreService";
import { logOut } from "../services/authService";

export default function SettingsDrawer({ visible, onClose, onEditProfile, currentUser, onSignOut }) {
  const { theme, isDarkMode, themeMode, setThemeMode } = useTheme();
  const slideAnim = useRef(new Animated.Value(-320)).current;
  const [reminderFrequency, setReminderFrequency] = useState(2); // times per day
  const [userName, setUserName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (visible && currentUser) {
      loadUserData();
    }
  }, [visible, currentUser]);

  const loadUserData = async () => {
    if (!currentUser) return;

    try {
      const result = await getUserProfile(currentUser.uid);
      if (result.success) {
        if (result.data.name) {
          setUserName(result.data.name);
        }
        if (result.data.profileImage) {
          setProfileImage(result.data.profileImage);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleChangeProfilePicture = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to change your profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const imageUri = result.assets[0].uri;

        await saveUserProfile(currentUser.uid, {
          profileImage: imageUri,
        });

        setProfileImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            const result = await logOut();
            if (result.success) {
              onClose();
              if (onSignOut) {
                onSignOut();
              }
            } else {
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -320,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const SettingRow = ({ icon, title, onPress, rightComponent }) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: theme.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={theme.primary} />
        <Text style={[styles.settingTitle, { color: theme.text }]}>
          {title}
        </Text>
      </View>
      {rightComponent}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: theme.background,
              transform: [{ translateX: slideAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View
            style={[styles.header, { borderBottomColor: theme.background }]}
          >
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Settings
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Profile Section */}
            <View style={[styles.section]}>
              <View style={styles.profileContainer}>
                <TouchableOpacity
                  style={[
                    styles.avatarContainer,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={handleChangeProfilePicture}
                  disabled={uploadingImage}
                >
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Ionicons name="person" size={40} color="#ffffff" />
                  )}
                  {uploadingImage && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  )}
                  <View style={[styles.cameraIconBadge, { backgroundColor: theme.primary }]}>
                    <Ionicons name="camera" size={14} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                <View style={styles.profileInfo}>
                  {loadingUser ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <Text style={[styles.profileName, { color: theme.text }]}>
                      {userName || "User"}
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      if (onEditProfile) {
                        onEditProfile();
                      }
                    }}
                  >
                    <Text
                      style={[styles.editProfile, { color: theme.primary }]}
                    >
                      Edit Profile
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Quick Settings */}
            <View style={[styles.minimalSection]}>
              {/* Reminders */}
              {/* Notifications */}
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color={theme.textSecondary}
                  />
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    Daily Reminders
                  </Text>
                </View>
                <Switch
                  value={reminderFrequency > 0}
                  onValueChange={(value) => setReminderFrequency(value ? 2 : 0)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={theme.cardBackground}
                />
              </View>

              {/* Divider */}
              <View
                style={[styles.divider, { backgroundColor: theme.border }]}
              />

              {/* Theme */}
              <View style={[styles.settingRow, { marginTop: 10 }]}>
                <View style={styles.settingLeft}>
                  <Ionicons
                    name={themeMode === "dark" ? "moon" : "sunny-outline"}
                    size={22}
                    color={theme.textSecondary}
                  />
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    Dark Mode
                  </Text>
                </View>
                <Switch
                  value={themeMode === "dark"}
                  onValueChange={() =>
                    setThemeMode(themeMode === "dark" ? "light" : "dark")
                  }
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={theme.cardBackground}
                />
              </View>
            </View>

            {/* General */}
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                GENERAL
              </Text>
            </View>

            <View
              style={[
                styles.section,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <SettingRow
                icon="lock-closed-outline"
                title="Privacy & Security"
                rightComponent={
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                }
              />
              <SettingRow
                icon="document-text-outline"
                title="Terms & Conditions"
                rightComponent={
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                }
              />
              <SettingRow
                icon="help-circle-outline"
                title="Help & Support"
                rightComponent={
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                }
              />
              <SettingRow
                icon="information-circle-outline"
                title="About"
                rightComponent={
                  <Text
                    style={[styles.versionText, { color: theme.textSecondary }]}
                  >
                    v1.0.0
                  </Text>
                }
              />
            </View>

            {/* Sign Out Button */}
            <View style={[styles.section, { marginTop: 8 }]}>
              <TouchableOpacity
                style={[
                  styles.signOutButton,
                  { backgroundColor: theme.cardBackground, borderColor: '#FF6B6B' }
                ]}
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={22} color="#FF6B6B" />
                <Text style={[styles.signOutText, { color: '#FF6B6B' }]}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  drawer: {
    width: 320,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.4)", // translucent
    backdropFilter: "blur(10px)",
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  minimalSection: {
    marginHorizontal: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  minimalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: 64,
    height: 64,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  editProfile: {
    fontSize: 14,
    fontWeight: "500",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    marginLeft: 12,
  },
  themeInfo: {
    marginLeft: 12,
  },
  themeSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  frequencySelector: {
    flexDirection: "row",
    gap: 8,
  },
  frequencyButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  frequencyText: {
    fontSize: 16,
    fontWeight: "600",
  },
  themeToggleGroup: {
    flexDirection: "row",
    gap: 8,
  },
  themeToggleButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  versionText: {
    fontSize: 14,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 40,
  },
});
