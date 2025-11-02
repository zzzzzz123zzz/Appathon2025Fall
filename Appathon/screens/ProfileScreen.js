import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { getUserProfile } from "../services/firestoreService";
import { registerForPushNotifications, savePushToken } from "../services/notificationService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export default function ProfileScreen({ onBack, currentUser }) {
  const { theme } = useTheme();
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState(2); // times per day
  const [pushToken, setPushToken] = useState(null);
  const [registeringToken, setRegisteringToken] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    if (!currentUser) return;

    try {
      const result = await getUserProfile(currentUser.uid);
      if (result.success && result.data.name) {
        setProfileName(result.data.name);
      }

      // Load push token from Firestore
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setPushToken(userData.pushToken || null);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPushNotifications = async () => {
    if (!currentUser) return;

    setRegisteringToken(true);
    try {
      const result = await registerForPushNotifications();

      if (result.success && result.token) {
        await savePushToken(currentUser.uid, result.token);
        setPushToken(result.token);
        Alert.alert(
          "Success!",
          `Push notifications registered!\n\nToken: ${result.token.substring(0, 30)}...`
        );
      } else {
        Alert.alert(
          "Error",
          result.error || "Could not register push notifications"
        );
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setRegisteringToken(false);
    }
  };

  // Get user's first initial
  const getInitial = () => {
    if (profileName && profileName.length > 0) {
      return profileName.charAt(0).toUpperCase();
    }
    if (currentUser && currentUser.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Profile
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <View
            style={[
              styles.profilePictureContainer,
              { backgroundColor: theme.primary },
            ]}
          >
            <Text style={styles.initialText}>{getInitial()}</Text>
          </View>
        </View>

        {/* Profile Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            PROFILE INFORMATION
          </Text>
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Name
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {profileName || "User"}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Push Token Debug Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            PUSH NOTIFICATIONS DEBUG
          </Text>
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Status
              </Text>
              <Text style={[styles.infoValue, { color: pushToken ? '#10b981' : '#ef4444' }]}>
                {pushToken ? "Enabled" : "Not Enabled"}
              </Text>
            </View>
            {pushToken && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                    Token
                  </Text>
                  <Text style={[styles.tokenValue, { color: theme.text }]} numberOfLines={1}>
                    {pushToken.substring(0, 20)}...
                  </Text>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.registerButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={handleRegisterPushNotifications}
            disabled={registeringToken}
          >
            {registeringToken ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
                <Text style={styles.registerButtonText}>
                  {pushToken ? "Re-register" : "Register"} Push Notifications
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            NOTIFICATIONS
          </Text>
          <View
            style={[
              styles.settingsCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            {/* Push Notifications */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={theme.primary}
                />
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    Push Notifications
                  </Text>
                  <Text
                    style={[styles.settingSubtitle, { color: theme.textSecondary }]}
                  >
                    Receive daily reminders
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.cardBackground}
              />
            </View>

            {/* Divider */}
            {notificationsEnabled && (
              <>
                <View
                  style={[styles.divider, { backgroundColor: theme.border }]}
                />

                {/* Reminder Frequency */}
                <View style={[styles.settingRow, { paddingTop: 16 }]}>
                  <View style={styles.settingLeft}>
                    <Ionicons
                      name="time-outline"
                      size={24}
                      color={theme.primary}
                    />
                    <View style={styles.settingInfo}>
                      <Text style={[styles.settingTitle, { color: theme.text }]}>
                        Daily Reminders
                      </Text>
                      <Text
                        style={[
                          styles.settingSubtitle,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {reminderFrequency} {reminderFrequency === 1 ? "time" : "times"} per day
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Frequency Selector */}
                <View style={styles.frequencyContainer}>
                  {[1, 2, 3].map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyButton,
                        {
                          backgroundColor:
                            reminderFrequency === freq
                              ? theme.primary
                              : theme.cardBackground,
                          borderColor:
                            reminderFrequency === freq
                              ? theme.primary
                              : theme.border,
                        },
                      ]}
                      onPress={() => setReminderFrequency(freq)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.frequencyText,
                          {
                            color:
                              reminderFrequency === freq
                                ? "#FFFFFF"
                                : theme.text,
                          },
                        ]}
                      >
                        {freq}x
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 48,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  profilePictureContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  initialText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 14,
    borderWidth: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  settingsCard: {
    borderRadius: 14,
    borderWidth: 0,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  frequencyContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 2.5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  frequencyText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  bottomPadding: {
    height: 40,
  },
  tokenValue: {
    fontSize: 14,
    fontWeight: "600",
    maxWidth: 180,
  },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
