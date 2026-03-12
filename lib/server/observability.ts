import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/server/events";

type ExceptionContext = {
  route: string;
  subsystem: string;
  userId?: string | null;
  signedIn?: boolean | null;
  provider?: string | null;
  degraded?: boolean;
  fallbackReason?: string | null;
  code?: string | null;
  status?: number;
};

function sanitizeMessage(value: unknown) {
  return String(value || "Unknown error").slice(0, 300);
}

function sanitizeStack(error: unknown) {
  if (!(error instanceof Error) || !error.stack) return undefined;
  return error.stack.split("\n").slice(0, 6).join("\n").slice(0, 1200);
}

export async function captureServerException(error: unknown, context: ExceptionContext) {
  const props = {
    route: context.route,
    subsystem: context.subsystem,
    provider: context.provider ?? null,
    signedIn: context.signedIn ?? null,
    degraded: context.degraded ?? false,
    fallbackReason: context.fallbackReason ?? null,
    code: context.code ?? null,
    status: context.status ?? null,
    errorName: error instanceof Error ? error.name : "Error",
    message: sanitizeMessage(error instanceof Error ? error.message : error),
    stack: sanitizeStack(error)
  };

  console.error("[pave:server_exception]", props);

  await trackEvent({
    name: "server_exception",
    userId: context.userId ?? null,
    props
  }).catch(() => null);
}

export function jsonError(input: {
  error: string;
  code?: string;
  status: number;
  retryAfterMs?: number;
  extras?: Record<string, unknown>;
}) {
  const headers = input.retryAfterMs
    ? {
        "Retry-After": String(Math.max(1, Math.ceil(input.retryAfterMs / 1000)))
      }
    : undefined;

  return NextResponse.json(
    {
      error: input.error,
      code: input.code,
      retryAfterMs: input.retryAfterMs,
      ...(input.extras ?? {})
    },
    {
      status: input.status,
      headers
    }
  );
}
