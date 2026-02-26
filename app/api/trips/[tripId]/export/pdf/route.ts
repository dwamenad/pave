import { NextRequest } from "next/server";
import { buildTripPdfBytes, createExportRecord, markExportFailed, markExportSuccess } from "@/lib/server/export-service";
import { requireApiUser } from "@/lib/server/route-user";

export async function POST(_: NextRequest, { params }: { params: { tripId: string } }) {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response!;

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
    await markExportFailed(exportRecord.id, error instanceof Error ? error.message : "PDF generation failed");
    return new Response("Failed to generate PDF", { status: 500 });
  }
}
