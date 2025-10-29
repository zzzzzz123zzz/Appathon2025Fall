import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function ProfileScreen({ onBack }) {
  const { theme } = useTheme();
  const [profileName, setProfileName] = useState("Theodore");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState(2); // times per day

  const handleChangeProfilePicture = () => {
    // TODO: Implement image picker
    Alert.alert(
      "Change Profile Picture",
      "Image picker will be implemented here",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Edit Profile
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
            <Ionicons name="person" size={60} color="#FFFFFF" />
          </View>

          <TouchableOpacity
            style={[
              styles.changePhotoButton,
              { backgroundColor: theme.cardBackground },
            ]}
            onPress={handleChangeProfilePicture}
            activeOpacity={0.7}
          >
            <Ionicons name="camera" size={20} color={theme.primary} />
            <Text style={[styles.changePhotoText, { color: theme.primary }]}>
              Change Profile Picture
            </Text>
          </TouchableOpacity>
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
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {profileName}
              </Text>
            </View>
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    width: 44,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 44,
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
    marginBottom: 20,
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: "600",
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
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
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
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  frequencyText: {
    fontSize: 18,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 40,
  },
});
