import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MobileAuthProvider } from "@/src/auth/mobile-auth-context";

export default function RootLayout() {
  return (
    <MobileAuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </MobileAuthProvider>
  );
}
