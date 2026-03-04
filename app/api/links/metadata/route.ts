import { NextRequest, NextResponse } from "next/server";
import { fetchMetadataForLinks } from "@/lib/server/link-metadata";
import { rateLimit } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfterMs: limited.retryAfterMs },
      { status: 429 }
    );
  }

  const body = await request.json();
  const links = Array.isArray(body.links) ? body.links.map((link: unknown) => String(link)) : [];
  const metadata = await fetchMetadataForLinks(links);
  return NextResponse.json({ metadata });
}
