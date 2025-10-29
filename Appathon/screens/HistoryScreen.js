import { StyleSheet, Text, View, TextInput } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

const colors = {
  caramelBrown: "#c1a57d",
  accentGrey: "#f4f4f4",
  white: "#ffffff",
  textGrey: "#444444",
};

export default function HistoryScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.caramelBrown}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder=""
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textGrey}
        />
        {searchQuery.length > 0 && (
          <Ionicons
            name="close-circle"
            size={20}
            color={colors.textGrey}
            style={styles.clearIcon}
            onPress={() => setSearchQuery("")}
          />
        )}
      </View>

      <Text style={styles.description}>
        Your journal entries will appear here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 40,
    fontWeight: "600",
    color: colors.caramelBrown,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentGrey,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.accentGrey,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textGrey,
  },
  clearIcon: {
    marginLeft: 8,
  },
  description: {
    fontSize: 18,
    color: colors.textGrey,
    lineHeight: 28,
    opacity: 0.7,
  },
});
