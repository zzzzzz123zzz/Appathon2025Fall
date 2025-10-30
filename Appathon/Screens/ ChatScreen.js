// screens/ChatScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: "1", text: "Hi! How are you feeling today?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(true);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = { id: Date.now().toString(), text: input, sender: "user" };
    setMessages(prev => [...prev, newMsg]);
    setInput("");

    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString() + "-bot", text: "Got it! Tell me more.", sender: "bot" },
      ]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingVertical: 8 }}>
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf: item.sender === "user" ? "flex-end" : "flex-start",
              backgroundColor: item.sender === "user" ? "#DCF8C6" : "#EAEAEA",
              padding: 10,
              borderRadius: 12,
              marginVertical: 6,
              maxWidth: "78%",
            }}
          >
            <Text>{item.text}</Text>
          </View>
        )}
      />

      {isTyping && (
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, marginBottom: 6 }}>
          <ActivityIndicator size="small" />
          <Text style={{ marginLeft: 8, color: "gray" }}>Bot is typing...</Text>
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 8,
          borderTopWidth: 1,
          borderColor: "#eee",
          backgroundColor: "#fff",
        }}
      >
        <TouchableOpacity onPress={() => setIsVoiceMode(v => !v)} style={{ paddingHorizontal: 8 }}>
          <Ionicons name={isVoiceMode ? "mic" : "chatbubble-ellipses"} size={26} color="gray" />
        </TouchableOpacity>

        {isVoiceMode ? (
          <TouchableOpacity
            onPress={() => alert("Voice record trigger — Hook up Whisper here.")}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Ionicons name="mic-circle" size={48} color="#4B9CD3" />
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              placeholder="Type a message..."
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginRight: 8,
              }}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={sendMessage} style={{ paddingHorizontal: 6 }}>
              <Ionicons name="send" size={26} color="#4B9CD3" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}