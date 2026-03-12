import { NextRequest } from "next/server";
import type { ExportFailureCode } from "@pave/contracts";
import { db } from "@/lib/db";
import { buildTripPdfBytes, createExportRecord, markExportFailed, markExportSuccess } from "@/lib/server/export-service";
import { captureServerException, jsonError } from "@/lib/server/observability";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireApiUser } from "@/lib/server/route-user";

function exportErrorCopy(code: ExportFailureCode) {
  if (code === "rate_limited") return "PDF export is being rate limited right now. Try again in a moment.";
  if (code === "trip_not_found") return "We couldn't find this trip for export.";
  if (code === "unauthorized") return "You need to sign in before exporting this trip.";
  return "PDF generation failed. Try again in a moment.";
}

export async function POST(request: NextRequest, { params }: { params: { tripId: string } }) {
  const auth = await requireApiUser(request);
  if (!auth.user) return auth.response!;
  const limited = await enforceRateLimit(request, { policy: "export", identifier: auth.user.id });
  if (limited) return limited;
  const trip = await db.trip.findUnique({
    where: { id: params.tripId },
    select: { id: true }
  });
  if (!trip) {
    return jsonError({
      error: exportErrorCopy("trip_not_found"),
      code: "trip_not_found",
      status: 404
    });
  }

  const exportRecord = await createExportRecord({
    tripId: params.tripId,
    requestedById: auth.user.id
  });

  try {
    const bytes = await buildTripPdfBytes(params.tripId);
    await markExportSuccess(exportRecord.id);

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="trip-${params.tripId}.pdf"`
      }
    });
  } catch (error) {
    const code: ExportFailureCode =
      error instanceof Error && error.message === "Trip not found" ? "trip_not_found" : "export_failed";
    await markExportFailed(exportRecord.id, error instanceof Error ? error.message : "PDF generation failed");
    await captureServerException(error, {
      route: "/api/trips/[tripId]/export/pdf",
      subsystem: "export",
      userId: auth.user.id,
      signedIn: true,
      code
    });
    return jsonError({
      error: exportErrorCopy(code),
      code,
      status: code === "trip_not_found" ? 404 : 500
    });
  }
}
