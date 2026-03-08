import { useEffect } from "react";
import * as Sentry from "@sentry/react-native";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { MobileMeResponse } from "@pave/contracts";
import { MobileAuthProvider } from "@/src/auth/mobile-auth-context";
import { useMobileAuth } from "@/src/auth/mobile-auth-context";
import { useMobileApiClient } from "@/src/lib/use-mobile-api-client";
import { getOrCreateInstallationId } from "@/src/lib/secure-token-store";
import {
  initMobileTelemetry,
  setMobileTelemetryRoute,
  setMobileTelemetrySession,
  setMobileTelemetrySignedIn,
  setMobileTelemetryUser
} from "@/src/lib/mobile-telemetry";

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

initMobileTelemetry();

function TelemetryBindings() {
  const pathname = usePathname();
  const auth = useMobileAuth();
  const api = useMobileApiClient();

  useEffect(() => {
    setMobileTelemetryRoute(pathname || "/");
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    void getOrCreateInstallationId().then((installationId) => {
      if (!cancelled) {
        setMobileTelemetrySession(installationId);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMobileTelemetrySignedIn(auth.signedIn);

    if (!auth.ready || !auth.signedIn) {
      setMobileTelemetryUser(null);
      return;
    }

    let cancelled = false;

    void api
      .get<MobileMeResponse>("/api/mobile/me", { retries: 0 })
      .then((response) => {
        if (!cancelled) {
          setMobileTelemetryUser(response.user);
        }
      })
      .catch(() => null);

    return () => {
      cancelled = true;
    };
  }, [api, auth.ready, auth.signedIn, auth.tokens?.accessToken]);

  return null;
}

function RootLayoutInner() {
  return (
    <QueryClientProvider client={queryClient}>
      <MobileAuthProvider>
        <TelemetryBindings />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </MobileAuthProvider>
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayoutInner);
