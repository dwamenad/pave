import pkg from "@/package.json";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export type RuntimeSubsystemStatus = {
  ready: boolean;
  mode?: string;
  enabled?: boolean;
};

export type RuntimeReadinessReport = {
  ok: boolean;
  version: string;
  environment: string;
  checkedAt: string;
  database: {
    ready: boolean;
  };
  subsystems: {
    auth: RuntimeSubsystemStatus;
    maps: RuntimeSubsystemStatus;
    aiCreate: RuntimeSubsystemStatus;
    mobileTelemetry: RuntimeSubsystemStatus;
    rateLimiting: RuntimeSubsystemStatus;
  };
};

async function checkDatabase() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { ready: true };
  } catch {
    return { ready: false };
  }
}

function isNonEmpty(value?: string | null) {
  return Boolean(value && value.trim());
}

export async function getRuntimeReadiness(): Promise<RuntimeReadinessReport> {
  const database = await checkDatabase();
  const authReady =
    isNonEmpty(env.NEXTAUTH_SECRET) &&
    isNonEmpty(env.GOOGLE_CLIENT_ID) &&
    isNonEmpty(env.GOOGLE_CLIENT_SECRET) &&
    isNonEmpty(process.env.NEXTAUTH_URL || env.NEXT_PUBLIC_APP_URL);
  const mapsReady = isNonEmpty(env.GOOGLE_MAPS_API_KEY_PUBLIC) && isNonEmpty(env.GOOGLE_MAPS_API_KEY_SERVER);
  const aiCreateEnabled = env.ENABLE_AI_CREATE;
  const aiCreateReady = !aiCreateEnabled || (isNonEmpty(env.OPENAI_API_KEY) && isNonEmpty(env.OPENAI_RESPONSES_MODEL));
  const mobileTelemetryReady = isNonEmpty(process.env.EXPO_PUBLIC_SENTRY_DSN);
  const usingUpstash = isNonEmpty(env.UPSTASH_REDIS_REST_URL) && isNonEmpty(env.UPSTASH_REDIS_REST_TOKEN);

  const subsystems: RuntimeReadinessReport["subsystems"] = {
    auth: { ready: authReady },
    maps: { ready: mapsReady },
    aiCreate: { ready: aiCreateReady, enabled: aiCreateEnabled },
    mobileTelemetry: { ready: mobileTelemetryReady },
    rateLimiting: { ready: true, mode: usingUpstash ? "upstash" : "local" }
  };

  return {
    ok: database.ready && authReady,
    version: pkg.version,
    environment: process.env.NODE_ENV || "development",
    checkedAt: new Date().toISOString(),
    database,
    subsystems
  };
}
