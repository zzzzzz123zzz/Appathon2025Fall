import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function TabBar({ activeTab, onTabChange }) {
  const { theme } = useTheme();

  const tabs = [
    { id: 'home', label: 'Notes', icon: 'document-text' },
    { id: 'chat', label: 'Chat', icon: 'chatbubbles' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.icon : `${tab.icon}-outline`}
              size={28}
              color={isActive ? theme.primary : theme.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? theme.primary : theme.textSecondary,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 24,
    paddingTop: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tabLabel: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
});
