import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireMobileUser } from "@/lib/server/mobile-route-user";

export async function DELETE(request: NextRequest, { params }: { params: { deviceId: string } }) {
  const auth = await requireMobileUser(request);
  if (!auth.user) return auth.response!;

  const deleted = await db.device.deleteMany({
    where: {
      id: params.deviceId,
      userId: auth.user.id
    }
  });

  if (!deleted.count) {
    return NextResponse.json({ error: "Device not found" }, { status: 404 });
  }

  await db.mobileSession.updateMany({
    where: {
      userId: auth.user.id,
      deviceId: params.deviceId
    },
    data: {
      deviceId: null
    }
  });

  return NextResponse.json({ ok: true });
}
