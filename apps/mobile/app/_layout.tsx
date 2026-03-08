import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MobileAuthProvider } from "@/src/auth/mobile-auth-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1
    },
    mutations: {
      retry: 0
    }
  }
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <MobileAuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </MobileAuthProvider>
    </QueryClientProvider>
  );
}
