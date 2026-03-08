import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { MobileMeResponse } from "@pave/contracts";
import { useMobileAuth } from "@/src/auth/mobile-auth-context";
import { useMobileApiClient } from "@/src/lib/use-mobile-api-client";

export default function HomeScreen() {
  const auth = useMobileAuth();
  const api = useMobileApiClient();
  const [profile, setProfile] = useState<MobileMeResponse["user"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile() {
    setError(null);
    try {
      const data = await api.get<MobileMeResponse>("/api/mobile/me");
      setProfile(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    }
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
      <Text style={{ fontSize: 24, fontWeight: "700", color: "#0f172a" }}>Pave Mobile</Text>
      <Text style={{ marginTop: 8, color: "#475569" }}>Infrastructure foundation is ready.</Text>
      <Pressable
        onPress={loadProfile}
        style={{
          marginTop: 14,
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: "#2563eb"
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>Load /api/mobile/me</Text>
      </Pressable>
      {profile ? (
        <Text style={{ marginTop: 10, color: "#0f172a" }}>
          Signed in as {profile.username || profile.name || profile.email || profile.id}
        </Text>
      ) : null}
      {error ? <Text style={{ marginTop: 8, color: "#b91c1c" }}>{error}</Text> : null}
      <Pressable
        onPress={auth.clearTokens}
        style={{
          marginTop: 16,
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: "#e2e8f0"
        }}
      >
        <Text style={{ color: "#0f172a", fontWeight: "700" }}>Clear tokens</Text>
      </Pressable>
    </View>
  );
}
