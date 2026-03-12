import { NextRequest, NextResponse } from "next/server";
import { fetchMetadataForLinks } from "@/lib/server/link-metadata";
import { captureServerException, jsonError } from "@/lib/server/observability";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { policy: "provider_lookup" });
  if (limited) return limited;

  try {
    const body = await request.json();
    const links = Array.isArray(body.links) ? body.links.map((link: unknown) => String(link)) : [];
    const metadata = await fetchMetadataForLinks(links);
    return NextResponse.json({ metadata });
  } catch (error) {
    await captureServerException(error, {
      route: "/api/links/metadata",
      subsystem: "link_metadata",
      provider: "remote_metadata"
    });
    return jsonError({
      error: "Unable to fetch link metadata right now.",
      code: "provider_unavailable",
      status: 500
    });
  }
}
