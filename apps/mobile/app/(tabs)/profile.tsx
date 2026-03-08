import { View, Text } from "react-native";

export default function ProfilePlaceholderScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", color: "#0f172a" }}>Profile</Text>
      <Text style={{ marginTop: 8, color: "#64748b" }}>Authenticated profile bootstrap will land in this phase.</Text>
    </View>
  );
}
