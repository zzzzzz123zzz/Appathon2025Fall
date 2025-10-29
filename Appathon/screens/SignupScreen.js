import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const colors = {
  caramelBrown: "#c1a57d",
  accentGrey: "#f4f4f4",
  white: "#ffffff",
  textGrey: "#444444",
};

export default function SignupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Signup Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.caramelBrown,
  },
});
