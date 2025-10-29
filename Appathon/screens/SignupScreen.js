import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SignupScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 