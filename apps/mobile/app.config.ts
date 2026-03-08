import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Pave",
  slug: "pave-mobile",
  scheme: "pave",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  runtimeVersion: {
    policy: "appVersion"
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "app.pave.mobile"
  },
  android: {
    package: "app.pave.mobile",
    adaptiveIcon: {
      backgroundColor: "#ffffff"
    }
  },
  plugins: ["expo-router", "expo-secure-store"],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000",
    deepLinkBaseUrl: process.env.EXPO_PUBLIC_DEEP_LINK_BASE_URL || "https://pave.app"
  }
};

export default config;
