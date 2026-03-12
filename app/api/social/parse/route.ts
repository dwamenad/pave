import { NextRequest, NextResponse } from "next/server";
import { parseSocialIntent } from "@/lib/social-parse";
import { rateLimit } from "@/lib/server/rate-limit";
import { fetchMetadataForLinks } from "@/lib/server/link-metadata";

function toClientError(code?: string) {
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
    const limited = await rateLimit(request);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests", code: "rate_limited", retryAfterMs: limited.retryAfterMs },
        { status: 429 }
      );
    }

    const body = await request.json();
    const input = String(body.input || "").slice(0, 3000);
    const links = Array.isArray(body.links) ? body.links.map((link: unknown) => String(link)) : [];
    const metadata = await fetchMetadataForLinks(links);
    const metadataTexts = metadata
      .flatMap((item) => [item.title, item.description, ...item.parsedHints])
      .filter(Boolean) as string[];
    const parsed = await parseSocialIntent(input, metadataTexts);
    if (parsed.resolution === "degraded") {
      return NextResponse.json(
        {
          error: toClientError(parsed.code),
          code: parsed.code,
          hints: parsed.hints,
          ambiguous: [],
          metadata,
          resolution: parsed.resolution,
          mockMode: parsed.mockMode
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ ...parsed, metadata });
  } catch {
    return NextResponse.json(
      {
        error: toClientError("provider_unavailable"),
        code: "provider_unavailable",
        hints: [],
        ambiguous: [],
        metadata: [],
        resolution: "degraded",
        mockMode: false
      },
      { status: 500 }
    );
  }
}
