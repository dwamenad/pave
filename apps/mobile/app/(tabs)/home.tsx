import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
      <Text style={{ fontSize: 24, fontWeight: "700", color: "#0f172a" }}>Pave Mobile</Text>
      <Text style={{ marginTop: 8, color: "#475569" }}>Infrastructure foundation is ready.</Text>
    </View>
  );
}
