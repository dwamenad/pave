import * as Sentry from "@sentry/react-native";

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
let telemetryInitialized = false;

function telemetryEnabled() {
  return Boolean(sentryDsn);
}

function normalizeContext(context?: Record<string, unknown>) {
  if (!context) return undefined;

  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return [key, value];
      }

      try {
        return [key, JSON.stringify(value)];
      } catch {
        return [key, String(value)];
      }
    })
  );
}

export function initMobileTelemetry() {
  if (telemetryInitialized || !telemetryEnabled()) return;

  Sentry.init({
    dsn: sentryDsn,
    enabled: true,
    environment: __DEV__ ? "development" : "production",
    tracesSampleRate: __DEV__ ? 1 : 0.2
  });

  Sentry.setTag("client", "mobile");
  telemetryInitialized = true;
}

export function setMobileTelemetryRoute(route: string) {
  if (!telemetryEnabled()) return;
  initMobileTelemetry();
  Sentry.setTag("route", route);
}

export function setMobileTelemetrySession(installationId: string) {
  if (!telemetryEnabled()) return;
  initMobileTelemetry();
  Sentry.setTag("installation_id", installationId);
}

export function setMobileTelemetrySignedIn(signedIn: boolean) {
  if (!telemetryEnabled()) return;
  initMobileTelemetry();
  Sentry.setTag("signed_in", signedIn ? "true" : "false");
}

export function setMobileTelemetryUser(
  user: {
    id?: string;
    email?: string | null;
    username?: string | null;
  } | null
) {
  if (!telemetryEnabled()) return;
  initMobileTelemetry();

  if (!user?.id) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email ?? undefined,
    username: user.username ?? undefined
  });
}

export function captureMobileException(
  error: unknown,
  context?: Record<string, unknown>
) {
  if (!telemetryEnabled()) return;
  initMobileTelemetry();

  const normalizedContext = normalizeContext(context);
  const exception =
    error instanceof Error ? error : new Error(String(error || "Unknown mobile error"));

  Sentry.withScope((scope) => {
    if (normalizedContext) {
      scope.setContext("mobile", normalizedContext);
    }
    scope.setLevel("error");
    Sentry.captureException(exception);
  });
}
