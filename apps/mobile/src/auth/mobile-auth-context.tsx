import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import type { MobileDeviceRegisterRequest } from "@pave/contracts";
import { resolveApiBaseUrl } from "@/src/lib/api-client";
import {
  clearMobileTokens,
  getOrCreateInstallationId,
  loadMobileTokens,
  saveMobileTokens,
  type StoredMobileTokens
} from "@/src/lib/secure-token-store";

type MobileAuthState = {
  ready: boolean;
  signedIn: boolean;
  tokens: StoredMobileTokens | null;
  setTokens: (tokens: StoredMobileTokens) => Promise<void>;
  clearTokens: () => Promise<void>;
  signOut: () => Promise<void>;
};

const MobileAuthContext = createContext<MobileAuthState | null>(null);

async function registerCurrentDevice(tokens: StoredMobileTokens) {
  const installationId = await getOrCreateInstallationId();
  const payload: MobileDeviceRegisterRequest = {
    installationId,
    platform: Platform.OS === "ios" ? "ios" : "android"
  };

  await fetch(`${resolveApiBaseUrl()}/api/mobile/devices/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`
    },
    body: JSON.stringify(payload)
  }).catch(() => null);
}

export function MobileAuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [tokens, setTokensState] = useState<StoredMobileTokens | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const existing = await loadMobileTokens();
      if (!mounted) return;
      setTokensState(existing);
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !tokens) return;
    void registerCurrentDevice(tokens);
  }, [ready, tokens]);

  const setTokens = useCallback(async (nextTokens: StoredMobileTokens) => {
    await saveMobileTokens(nextTokens);
    setTokensState(nextTokens);
  }, []);

  const clearTokens = useCallback(async () => {
    await clearMobileTokens();
    setTokensState(null);
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = tokens?.refreshToken;
    if (refreshToken) {
      await fetch(`${resolveApiBaseUrl()}/api/mobile/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken })
      }).catch(() => null);
    }

    await clearTokens();
  }, [clearTokens, tokens?.refreshToken]);

  const value = useMemo<MobileAuthState>(
    () => ({
      ready,
      signedIn: !!tokens,
      tokens,
      setTokens,
      clearTokens,
      signOut
    }),
    [clearTokens, ready, setTokens, signOut, tokens]
  );

  return <MobileAuthContext.Provider value={value}>{children}</MobileAuthContext.Provider>;
}

export function useMobileAuth() {
  const context = useContext(MobileAuthContext);
  if (!context) {
    throw new Error("useMobileAuth must be used inside MobileAuthProvider");
  }
  return context;
}
