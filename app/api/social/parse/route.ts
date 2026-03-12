import { NextRequest, NextResponse } from "next/server";
import type { SocialParseFailureCode } from "@pave/contracts";
import { parseSocialIntent } from "@/lib/social-parse";
import { captureServerException, jsonError } from "@/lib/server/observability";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { fetchMetadataForLinks } from "@/lib/server/link-metadata";

function toClientError(code?: SocialParseFailureCode | string) {
  if (code === "provider_misconfigured") {
    return "Google Places server key is missing.";
  }
  if (code === "invalid_request") {
    return "The location lookup request was invalid.";
  }
  if (code === "rate_limited") {
    return "Location parsing is rate limited right now.";
  }
  return "Unable to parse location hints right now.";
}

export async function POST(request: NextRequest) {
  try {
    const limited = await enforceRateLimit(request, { policy: "provider_lookup" });
    if (limited) return limited;

    const body = await request.json();
    const input = String(body.input || "").slice(0, 3000);
    const links = Array.isArray(body.links) ? body.links.map((link: unknown) => String(link)) : [];
    if (!input.trim() && !links.length) {
      return jsonError({
        error: "Input text or at least one link is required.",
        code: "invalid_input",
        status: 400,
        extras: {
          hints: [],
          ambiguous: [],
          metadata: [],
          resolution: "unresolved",
          mockMode: false
        }
      });
    }
    const metadata = await fetchMetadataForLinks(links);
    const metadataTexts = metadata
      .flatMap((item) => [item.title, item.description, ...item.parsedHints])
      .filter(Boolean) as string[];
    const parsed = await parseSocialIntent(input, metadataTexts);
    if (parsed.resolution === "degraded") {
      return jsonError({
        error: toClientError(parsed.code),
        code: parsed.code,
        status: 503,
        extras: {
          hints: parsed.hints,
          ambiguous: [],
          metadata,
          resolution: parsed.resolution,
          mockMode: parsed.mockMode
        }
      });
    }

    return NextResponse.json({ ...parsed, metadata });
  } catch (error) {
    await captureServerException(error, {
      route: "/api/social/parse",
      subsystem: "social_parse",
      provider: "google_places"
    });
    return jsonError({
      error: toClientError("provider_unavailable"),
      code: "provider_unavailable",
      status: 500,
      extras: {
        hints: [],
        ambiguous: [],
        metadata: [],
        resolution: "degraded",
        mockMode: false
      }
    });
  }
}
