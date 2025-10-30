import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from "../context/ThemeContext";
import { getUserProfile, saveUserProfile } from "../services/firestoreService";
import { uploadProfileImage } from "../services/storageService";

export default function ProfileScreen({ onBack, currentUser }) {
  const { theme } = useTheme();
  const [profileName, setProfileName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState(2); // times per day

  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    if (!currentUser) return;

    try {
      const result = await getUserProfile(currentUser.uid);
      if (result.success) {
        if (result.data.name) {
          setProfileName(result.data.name);
        }
        if (result.data.profileImage) {
          setProfileImage(result.data.profileImage);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeProfilePicture = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to change your profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const imageUri = result.assets[0].uri;

        // Upload to Firebase Storage
        const uploadResult = await uploadProfileImage(currentUser.uid, imageUri);

        if (uploadResult.success) {
          // Save the download URL to Firestore
          await saveUserProfile(currentUser.uid, {
            profileImage: uploadResult.url,
          });

          setProfileImage(uploadResult.url);
          Alert.alert('Success', 'Profile picture updated!');
        } else {
          Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setUploadingImage(false);
    }
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
          <View style={styles.profilePictureWrapper}>
            <View
              style={[
                styles.profilePictureContainer,
                { backgroundColor: theme.primary },
              ]}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <Ionicons name="person" size={60} color="#FFFFFF" />
              )}
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.editIconButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={handleChangeProfilePicture}
              activeOpacity={0.7}
              disabled={uploadingImage}
            >
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            </TouchableOpacity>
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
  profilePictureWrapper: {
    position: "relative",
    marginBottom: 20,
  },
  profilePictureContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  profileImage: {
    width: 120,
    height: 120,
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
  editIconButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
});
