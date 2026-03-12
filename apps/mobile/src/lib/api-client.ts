import type { MobileRefreshRequest, MobileRefreshResponse } from "@pave/contracts";
import type { StoredMobileTokens } from "./secure-token-store";

type TokenBridge = {
  getTokens: () => StoredMobileTokens | null;
  setTokens: (tokens: StoredMobileTokens) => Promise<void>;
  clearTokens: () => Promise<void>;
};

type RequestOptions = {
  timeoutMs?: number;
  retries?: number;
};

type ApiErrorPayload = {
  error?: string;
  code?: string;
};

export class MobileApiError extends Error {
  retryable: boolean;
  code?: string;
  status?: number;

  constructor(message: string, retryable: boolean, options?: { code?: string; status?: number }) {
    super(message);
    this.retryable = retryable;
    this.code = options?.code;
    this.status = options?.status;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resolveApiBaseUrl() {
  return (process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

function shouldRetry(status: number) {
  return status === 429 || status >= 500;
}

function parseJson<T>(text: string): T | ApiErrorPayload {
  if (!text) return {} as T;
  return JSON.parse(text) as T | { error?: string };
}

export function createMobileApiClient(tokens: TokenBridge) {
  const apiBaseUrl = resolveApiBaseUrl();
  let refreshInFlight: Promise<StoredMobileTokens | null> | null = null;

  async function refreshTokens(): Promise<StoredMobileTokens | null> {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
      const current = tokens.getTokens();
      if (!current?.refreshToken) return null;

      const body: MobileRefreshRequest = { refreshToken: current.refreshToken };
      try {
        const response = await fetch(`${apiBaseUrl}/api/mobile/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        const text = await response.text();
        const payload = parseJson<MobileRefreshResponse>(text);
        if (!response.ok) {
          await tokens.clearTokens();
          return null;
        }

        const next = {
          accessToken: (payload as MobileRefreshResponse).accessToken,
          refreshToken: (payload as MobileRefreshResponse).refreshToken
        };
        await tokens.setTokens(next);
        return next;
      } catch {
        await tokens.clearTokens();
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  }

  async function request<T>(
    path: string,
    init?: RequestInit,
    requestOptions?: RequestOptions,
    hasRetriedAuth = false
  ): Promise<T> {
    const timeoutMs = requestOptions?.timeoutMs ?? 12000;
    const retries = requestOptions?.retries ?? 1;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const current = tokens.getTokens();
        const headers = new Headers(init?.headers || {});
        if (current?.accessToken) {
          headers.set("Authorization", `Bearer ${current.accessToken}`);
        }

        const response = await fetch(`${apiBaseUrl}${path}`, {
          ...init,
          headers,
          signal: controller.signal
        });

        const text = await response.text();
        const payload = parseJson<T>(text);

        if (response.status === 401 && !hasRetriedAuth && current?.refreshToken) {
          const next = await refreshTokens();
          if (!next) {
            throw new MobileApiError((payload as ApiErrorPayload).error || "Unauthorized", false, {
              code: (payload as ApiErrorPayload).code,
              status: response.status
            });
          }
          return request<T>(path, init, requestOptions, true);
        }

        if (!response.ok) {
          const message = (payload as ApiErrorPayload).error || `HTTP ${response.status}`;
          if (attempt < retries && shouldRetry(response.status)) {
            await sleep(300 * (attempt + 1));
            continue;
          }
          throw new MobileApiError(message, false, {
            code: (payload as ApiErrorPayload).code,
            status: response.status
          });
        }

        return payload as T;
      } catch (error) {
        if (attempt < retries && (!(error instanceof MobileApiError) || error.retryable)) {
          await sleep(300 * (attempt + 1));
          continue;
        }
        if (error instanceof Error) throw error;
        throw new Error("Network request failed");
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new Error("Network request failed");
  }

  return {
    get<T>(path: string, options?: RequestOptions) {
      return request<T>(path, { method: "GET" }, options);
    },
    post<T>(path: string, body?: unknown, options?: RequestOptions) {
      return request<T>(
        path,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: body ? JSON.stringify(body) : undefined
        },
        options
      );
    },
    delete<T>(path: string, options?: RequestOptions) {
      return request<T>(
        path,
        {
          method: "DELETE"
        },
        options
      );
    }
  };
}
