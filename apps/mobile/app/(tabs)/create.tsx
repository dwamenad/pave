import { View, Text } from "react-native";

export default function CreatePlaceholderScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", color: "#0f172a" }}>Create</Text>
      <Text style={{ marginTop: 8, color: "#64748b" }}>Trip creation flow is intentionally deferred.</Text>
    </View>
  );
}
