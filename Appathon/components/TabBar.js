import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

export default function TabBar({ activeTab, onTabChange }) {
  const { theme } = useTheme();

  const tabs = [
    { id: "home", label: "Notes", icon: "document-text" },
    { id: "chat", label: "Chat", icon: "chatbubbles" },
  ];

  return (
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
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={isActive}
            onPress={() => onTabChange(tab.id)}
            theme={theme}
          />
        );
      })}
    </View>
  );
}

function TabButton({ tab, isActive, onPress, theme }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const indicatorAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(colorAnim, {
        toValue: isActive ? 1 : 0,
        tension: 80,
        friction: 8,
        useNativeDriver: false,
      }),
      Animated.spring(indicatorAnim, {
        toValue: isActive ? 1 : 0,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const iconColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.textSecondary, theme.primary],
  });

  const labelColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.textSecondary, theme.primary],
  });

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.tabContent,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Active indicator bar */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              backgroundColor: theme.primary,
              opacity: indicatorAnim,
              transform: [
                {
                  scaleX: indicatorAnim,
                },
              ],
            },
          ]}
        />

        {/* Background circle for active state */}
        <Animated.View
          style={[
            styles.activeBackground,
            {
              backgroundColor: theme.primary + "15",
              opacity: indicatorAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              transform: [
                {
                  scale: indicatorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        />

        <Animated.Text style={{ color: iconColor }}>
          <Ionicons
            name={isActive ? tab.icon : `${tab.icon}-outline`}
            size={26}
            color={isActive ? theme.primary : theme.textSecondary}
          />
        </Animated.Text>

        <Animated.Text
          style={[
            styles.tabLabel,
            {
              color: labelColor,
              fontWeight: isActive ? "600" : "500",
            },
          ]}
        >
          {tab.label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: -8,
    height: 3,
    width: 40,
    borderRadius: 2,
  },
  activeBackground: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});
