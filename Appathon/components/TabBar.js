import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../context/ThemeContext";

export default function TabBar({ activeTab, onTabChange }) {
  const { theme } = useTheme();

  const tabs = [
    { id: "home", label: "Notes", icon: "document-text" },
    { id: "chat", label: "Chat", icon: "chatbubbles" },
  ];

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{
        backgroundColor: theme.cardBackground,
      }}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.cardBackground,
            borderTopColor: theme.border,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                isActive && {
                  backgroundColor: theme.primary + '10',
                  borderRadius: 16,
                  marginHorizontal: 8,
                }
              ]}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.6}
            >
              <View style={[
                styles.iconContainer,
                isActive && {
                  transform: [{ scale: 1.05 }],
                }
              ]}>
                <Ionicons
                  name={isActive ? tab.icon : `${tab.icon}-outline`}
                  size={26}
                  color={isActive ? theme.primary : theme.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? theme.primary : theme.textSecondary,
                    fontWeight: isActive ? "700" : "500",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: 0,
    paddingBottom: 20,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
