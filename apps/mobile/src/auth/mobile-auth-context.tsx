import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearMobileTokens, loadMobileTokens, saveMobileTokens, type StoredMobileTokens } from "@/src/lib/secure-token-store";

type MobileAuthState = {
  ready: boolean;
  signedIn: boolean;
  tokens: StoredMobileTokens | null;
  setTokens: (tokens: StoredMobileTokens) => Promise<void>;
  clearTokens: () => Promise<void>;
};

const MobileAuthContext = createContext<MobileAuthState | null>(null);

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

  const setTokens = useCallback(async (nextTokens: StoredMobileTokens) => {
    await saveMobileTokens(nextTokens);
    setTokensState(nextTokens);
  }, []);

  const clearTokens = useCallback(async () => {
    await clearMobileTokens();
    setTokensState(null);
  }, []);

  const value = useMemo<MobileAuthState>(
    () => ({
      ready,
      signedIn: !!tokens,
      tokens,
      setTokens,
      clearTokens
    }),
    [clearTokens, ready, setTokens, tokens]
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
