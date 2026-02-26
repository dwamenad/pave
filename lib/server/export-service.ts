import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "@/lib/db";

export async function buildTripPdfBytes(tripId: string) {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: {
      days: {
        include: {
          items: {
            orderBy: { orderIndex: "asc" }
          }
        },
        orderBy: { dayIndex: "asc" }
      }
    }
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([700, 900]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 860;
  page.drawText(trip.title, { x: 40, y, size: 20, font: bold, color: rgb(0.1, 0.2, 0.3) });
  y -= 28;
  page.drawText(`Center: ${trip.centerLat.toFixed(4)}, ${trip.centerLng.toFixed(4)}`, { x: 40, y, size: 11, font });

  for (const day of trip.days) {
    y -= 28;
    if (y < 80) {
      y = 860;
      pdf.addPage([700, 900]);
    }
    const activePage = pdf.getPages()[pdf.getPages().length - 1];
    activePage.drawText(`Day ${day.dayIndex}`, { x: 40, y, size: 14, font: bold });
    y -= 18;

    for (const item of day.items) {
      if (y < 60) {
        y = 860;
        pdf.addPage([700, 900]);
      }
      const currentPage = pdf.getPages()[pdf.getPages().length - 1];
      currentPage.drawText(`- ${item.name} (${item.category})`, { x: 52, y, size: 11, font });
      y -= 14;
      if (item.notes) {
        currentPage.drawText(`  ${item.notes}`, { x: 62, y, size: 9, font, color: rgb(0.35, 0.35, 0.35) });
        y -= 12;
      }
    }
  }

  return pdf.save();
}

export async function createExportRecord(input: {
  tripId: string;
  requestedById?: string;
}) {
  return db.tripExport.create({
    data: {
      tripId: input.tripId,
      requestedById: input.requestedById,
      format: "PDF",
      status: "PENDING"
    }
  });
}

export async function markExportSuccess(exportId: string) {
  await db.tripExport.update({
    where: { id: exportId },
    data: {
      status: "SUCCESS"
    }
  });
}

export async function markExportFailed(exportId: string, error: string) {
  await db.tripExport.update({
    where: { id: exportId },
    data: {
      status: "FAILED",
      error: error.slice(0, 500)
    }
  });
}
