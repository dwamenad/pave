import { NextRequest, NextResponse } from "next/server";
import type { MobileDeviceRegisterRequest, MobileDeviceRegisterResponse } from "@pave/contracts";
import { db } from "@/lib/db";
import { requireMobileUser } from "@/lib/server/mobile-route-user";

export async function POST(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if (!auth.user) return auth.response!;

  const body = (await request.json().catch(() => null)) as MobileDeviceRegisterRequest | null;
  if (!body?.installationId || !body?.platform) {
    return NextResponse.json({ error: "installationId and platform are required" }, { status: 400 });
  }

  const device = await db.device.upsert({
    where: {
      userId_installationId: {
        userId: auth.user.id,
        installationId: body.installationId
      }
    },
    update: {
      platform: body.platform,
      appVersion: body.appVersion,
      deviceName: body.deviceName,
      pushToken: body.pushToken,
      lastSeenAt: new Date()
    },
    create: {
      userId: auth.user.id,
      installationId: body.installationId,
      platform: body.platform,
      appVersion: body.appVersion,
      deviceName: body.deviceName,
      pushToken: body.pushToken
    }
  });

  if (auth.session.deviceId !== device.id) {
    await db.mobileSession.update({
      where: { id: auth.session.id },
      data: { deviceId: device.id }
    });
  }

  const payload: MobileDeviceRegisterResponse = { deviceId: device.id };
  return NextResponse.json(payload);
}
