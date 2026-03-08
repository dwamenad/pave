import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import type { MobileAuthResponse } from "@pave/contracts";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useMobileAuth } from "@/src/auth/mobile-auth-context";
import { resolveApiBaseUrl } from "@/src/lib/api-client";
import { setMobileTelemetryUser } from "@/src/lib/mobile-telemetry";

WebBrowser.maybeCompleteAuthSession();

function readIdToken(response: unknown) {
  if (!response || typeof response !== "object") return null;
  if (!("type" in response) || response.type !== "success") return null;

  const direct =
    "authentication" in response &&
    response.authentication &&
    typeof response.authentication === "object" &&
    "idToken" in response.authentication &&
    typeof response.authentication.idToken === "string"
      ? response.authentication.idToken
      : null;
  if (direct) return direct;

  const params = "params" in response ? (response.params as { id_token?: unknown }) : undefined;
  const fromParams = typeof params?.id_token === "string" ? params.id_token : null;
  return fromParams;
}

export default function SignInScreen() {
  const auth = useMobileAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const canAuth = useMemo(() => Boolean(iosClientId || androidClientId), [androidClientId, iosClientId]);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId,
    androidClientId,
    scopes: ["openid", "profile", "email"]
  });

  useEffect(() => {
    const idToken = readIdToken(response);
    if (!idToken) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetch(`${resolveApiBaseUrl()}/api/mobile/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            platform: Platform.OS === "ios" ? "ios" : "android"
          })
        });

        const text = await result.text();
        const payload = text ? (JSON.parse(text) as MobileAuthResponse | { error?: string }) : {};
        if (!result.ok) {
          throw new Error((payload as { error?: string }).error || "Sign-in failed");
        }

        const parsed = payload as MobileAuthResponse;
        if (!cancelled) {
          await auth.setTokens({
            accessToken: parsed.accessToken,
            refreshToken: parsed.refreshToken
          });
          setMobileTelemetryUser(parsed.user);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Sign-in failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth, response]);

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f8fafc" }}>
      <Text style={{ fontSize: 30, fontWeight: "800", color: "#0f172a" }}>Pave</Text>
      <Text style={{ marginTop: 6, color: "#475569" }}>Sign in to browse, remix, and publish on mobile.</Text>

      <Pressable
        disabled={!request || loading || !canAuth}
        onPress={() => {
          setError(null);
          void promptAsync();
        }}
        style={{
          marginTop: 18,
          borderRadius: 12,
          backgroundColor: !request || loading || !canAuth ? "#93c5fd" : "#2563eb",
          paddingVertical: 13,
          alignItems: "center"
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          {loading ? "Signing in..." : "Continue with Google"}
        </Text>
      </Pressable>

      {!canAuth ? (
        <Text style={{ marginTop: 10, color: "#9a3412" }}>
          Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID / EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in apps/mobile/.env
        </Text>
      ) : null}

      {error ? <Text style={{ marginTop: 10, color: "#b91c1c" }}>{error}</Text> : null}
    </View>
  );
}
