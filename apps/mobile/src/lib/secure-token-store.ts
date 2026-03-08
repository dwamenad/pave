import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "pave.mobile.access_token";
const REFRESH_TOKEN_KEY = "pave.mobile.refresh_token";
const INSTALLATION_ID_KEY = "pave.mobile.installation_id";

export type StoredMobileTokens = {
  accessToken: string;
  refreshToken: string;
};

export async function loadMobileTokens(): Promise<StoredMobileTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
  ]);

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function saveMobileTokens(tokens: StoredMobileTokens) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken)
  ]);
}

export async function clearMobileTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
  ]);
}

function generateInstallationId() {
  return `inst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export async function getOrCreateInstallationId() {
  const existing = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  if (existing) return existing;

  const next = generateInstallationId();
  await SecureStore.setItemAsync(INSTALLATION_ID_KEY, next);
  return next;
}
