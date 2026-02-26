import { NextRequest, NextResponse } from "next/server";
import { parseSocialIntent } from "@/lib/social-parse";
import { rateLimit } from "@/lib/server/rate-limit";
import { fetchMetadataForLinks } from "@/lib/server/link-metadata";

function toClientError(error: unknown) {
  const message = error instanceof Error ? error.message : "Social parse failed";
  if (message.includes("Missing GOOGLE_MAPS_API_KEY_SERVER")) {
    return "Google Places server key is missing.";
  }
  if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
    return "Google Places server key is invalid.";
  }
  return "Unable to parse location hints right now.";
}

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request);
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const input = String(body.input || "").slice(0, 3000);
    const links = Array.isArray(body.links) ? body.links.map((link: unknown) => String(link)) : [];
    const metadata = await fetchMetadataForLinks(links);
    const metadataTexts = metadata
      .flatMap((item) => [item.title, item.description, ...item.parsedHints])
      .filter(Boolean) as string[];
    const parsed = await parseSocialIntent(input, metadataTexts);
    return NextResponse.json({ ...parsed, metadata });
  } catch (error) {
    return NextResponse.json(
      { error: toClientError(error), hints: [], ambiguous: [], metadata: [] },
      { status: 500 }
    );
  }
}
