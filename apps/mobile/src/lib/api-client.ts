import type { MobileRefreshRequest } from "@pave/contracts";
import type { StoredMobileTokens } from "@/src/lib/secure-token-store";

type TokenBridge = {
  getTokens: () => StoredMobileTokens | null;
  setTokens: (tokens: StoredMobileTokens) => Promise<void>;
  clearTokens: () => Promise<void>;
};

export function resolveApiBaseUrl() {
  return (process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  const json = text ? (JSON.parse(text) as T | { error?: string }) : ({} as T);
  if (!response.ok) {
    const errorText = (json as { error?: string })?.error || `HTTP ${response.status}`;
    throw new Error(errorText);
  }
  return json as T;
}

export function createMobileApiClient(tokens: TokenBridge) {
  const apiBaseUrl = resolveApiBaseUrl();

  async function refresh(): Promise<StoredMobileTokens | null> {
    const current = tokens.getTokens();
    if (!current?.refreshToken) return null;
    const body: MobileRefreshRequest = { refreshToken: current.refreshToken };
    try {
      const data = await requestJson<{
        accessToken: string;
        refreshToken: string;
      }>(`${apiBaseUrl}/api/mobile/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const nextTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };
      await tokens.setTokens(nextTokens);
      return nextTokens;
    } catch {
      await tokens.clearTokens();
      return null;
    }
  }

  async function fetchWithAuth(path: string, init?: RequestInit, hasRetried = false): Promise<Response> {
    const current = tokens.getTokens();
    const headers = new Headers(init?.headers || {});
    if (current?.accessToken) {
      headers.set("Authorization", `Bearer ${current.accessToken}`);
    }
    const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });

    if (response.status !== 401 || hasRetried || !current?.refreshToken) {
      return response;
    }

    const next = await refresh();
    if (!next) return response;
    const retryHeaders = new Headers(init?.headers || {});
    retryHeaders.set("Authorization", `Bearer ${next.accessToken}`);
    return fetch(`${apiBaseUrl}${path}`, { ...init, headers: retryHeaders });
  }

  return {
    async get<T>(path: string): Promise<T> {
      const response = await fetchWithAuth(path, { method: "GET" });
      const text = await response.text();
      const json = text ? (JSON.parse(text) as T | { error?: string }) : ({} as T);
      if (!response.ok) {
        const message = (json as { error?: string })?.error || `HTTP ${response.status}`;
        throw new Error(message);
      }
      return json as T;
    },
    async post<T>(path: string, body?: unknown): Promise<T> {
      const response = await fetchWithAuth(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const text = await response.text();
      const json = text ? (JSON.parse(text) as T | { error?: string }) : ({} as T);
      if (!response.ok) {
        const message = (json as { error?: string })?.error || `HTTP ${response.status}`;
        throw new Error(message);
      }
      return json as T;
    }
  };
}
