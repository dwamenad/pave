import { useMemo } from "react";
import { createMobileApiClient } from "@/src/lib/api-client";
import { useMobileAuth } from "@/src/auth/mobile-auth-context";

export function useMobileApiClient() {
  const auth = useMobileAuth();

  return useMemo(
    () =>
      createMobileApiClient({
        getTokens: () => auth.tokens,
        setTokens: auth.setTokens,
        clearTokens: auth.clearTokens
      }),
    [auth.tokens, auth.setTokens, auth.clearTokens]
  );
}
