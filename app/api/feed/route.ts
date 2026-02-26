import { NextRequest, NextResponse } from "next/server";
import { getFeed } from "@/lib/server/social-service";

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
  const feed = await getFeed(cursor);
  return NextResponse.json(feed);
}
