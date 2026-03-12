import { NextResponse } from "next/server";
import { getRuntimeReadiness } from "@/lib/server/runtime-readiness";

export async function GET() {
  const report = await getRuntimeReadiness();
  return NextResponse.json(report, { status: report.ok ? 200 : 503 });
}
