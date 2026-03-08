import { useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import type { MobileAuthResponse } from "@pave/contracts";
import { useMobileAuth } from "@/src/auth/mobile-auth-context";
import { resolveApiBaseUrl } from "@/src/lib/api-client";

export default function SignInScreen() {
  const auth = useMobileAuth();
  const [idToken, setIdToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWithGoogleToken() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${resolveApiBaseUrl()}/api/mobile/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          platform: Platform.OS === "ios" ? "ios" : "android"
        })
      });

      const text = await response.text();
      const data = text ? (JSON.parse(text) as MobileAuthResponse | { error?: string }) : {};
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Sign-in failed");
      }

      const parsed = data as MobileAuthResponse;
      await auth.setTokens({
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f8fafc" }}>
      <Text style={{ fontSize: 30, fontWeight: "800", color: "#0f172a" }}>Pave Mobile</Text>
      <Text style={{ marginTop: 6, color: "#475569" }}>Base infrastructure auth shell</Text>
      <TextInput
        value={idToken}
        onChangeText={setIdToken}
        placeholder="Paste native Google ID token"
        autoCapitalize="none"
        style={{
          marginTop: 16,
          borderWidth: 1,
          borderColor: "#cbd5e1",
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: "#fff"
        }}
      />
      <Pressable
        disabled={!idToken || loading}
        onPress={signInWithGoogleToken}
        style={{
          marginTop: 12,
          borderRadius: 10,
          backgroundColor: !idToken || loading ? "#93c5fd" : "#2563eb",
          paddingVertical: 12,
          alignItems: "center"
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>{loading ? "Signing in..." : "Sign in"}</Text>
      </Pressable>
      {error ? <Text style={{ marginTop: 10, color: "#b91c1c" }}>{error}</Text> : null}
    </View>
  );
}
