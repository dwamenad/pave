import type { ExpoConfig } from "expo/config";

const deepLinkBaseUrl = process.env.EXPO_PUBLIC_DEEP_LINK_BASE_URL || "https://pave.app";
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
const sentryUrl = process.env.SENTRY_URL || "https://sentry.io/";
const deepLinkHost = (() => {
  try {
    const parsed = new URL(deepLinkBaseUrl);
    if (parsed.protocol !== "https:") return null;
    return parsed.hostname;
  } catch {
    return null;
  }
})();

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
    bundleIdentifier: "app.pave.mobile",
    ...(deepLinkHost
      ? {
          associatedDomains: [`applinks:${deepLinkHost}`]
        }
      : {})
  },
  android: {
    package: "app.pave.mobile",
    adaptiveIcon: {
      backgroundColor: "#ffffff"
    },
    ...(deepLinkHost
      ? {
          intentFilters: [
            {
              action: "VIEW",
              data: [{ scheme: "https", host: deepLinkHost, pathPrefix: "/" }],
              category: ["BROWSABLE", "DEFAULT"]
            }
          ]
        }
      : {})
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "@sentry/react-native/expo",
      {
        organization: sentryOrg,
        project: sentryProject,
        url: sentryUrl
      }
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Pave uses your location to show nearby places, coffee, and things to do."
      }
    ]
  ],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000",
    deepLinkBaseUrl,
    sentry: {
      orgConfigured: Boolean(sentryOrg),
      projectConfigured: Boolean(sentryProject)
    }
  }
};

export default config;
