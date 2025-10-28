import { StyleSheet, TextInput, View, TouchableOpacity, Keyboard } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function NoteScreen() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Start writing..."
        multiline={true}
        textAlignVertical="top"
      />
      {keyboardVisible && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => Keyboard.dismiss()}
        >
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 60,
  },
  input: {
    flex: 1,
    padding: 24,
    fontSize: 16,
  },
  dismissButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 36,
    height: 36,
    backgroundColor: "#f1f5f9",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
