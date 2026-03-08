import { View, Text } from "react-native";

export default function FeedPlaceholderScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", color: "#0f172a" }}>Feed</Text>
      <Text style={{ marginTop: 8, color: "#64748b" }}>Read-only feed integration comes in the next phase.</Text>
    </View>
  );
}
