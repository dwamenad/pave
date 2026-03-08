import { addDays, addMinutes } from "@/lib/server/time";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { generateOpaqueToken, hashRefreshToken, signAccessToken } from "@/lib/server/mobile-auth-tokens";

function now() {
  return new Date();
}

type IssueMobileSessionInput = {
  userId: string;
  deviceId?: string;
};

export type MobileSessionIssueResult = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  sessionId: string;
};

export async function issueMobileSession(input: IssueMobileSessionInput): Promise<MobileSessionIssueResult> {
  const issuedAt = now();
  const accessExpiresAt = addMinutes(issuedAt, env.MOBILE_ACCESS_TOKEN_TTL_MINUTES);
  const refreshExpiresAt = addDays(issuedAt, env.MOBILE_REFRESH_TOKEN_TTL_DAYS);
  const jti = generateOpaqueToken(24);

  const session = await db.mobileSession.create({
    data: {
      userId: input.userId,
      deviceId: input.deviceId,
      accessTokenJti: jti,
      expiresAt: accessExpiresAt,
      lastSeenAt: issuedAt
    }
  });

  const refreshToken = generateOpaqueToken(48);
  await db.mobileRefreshToken.create({
    data: {
      sessionId: session.id,
      userId: input.userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshExpiresAt
    }
  });

  const accessToken = signAccessToken({
    userId: input.userId,
    sessionId: session.id,
    jti,
    refreshTokenVersion: session.refreshTokenVersion
  });

  return {
    accessToken,
    refreshToken,
    expiresInSeconds: env.MOBILE_ACCESS_TOKEN_TTL_MINUTES * 60,
    sessionId: session.id
  };
}

export async function rotateMobileRefreshToken(refreshToken: string) {
  const refreshHash = hashRefreshToken(refreshToken);
  const existing = await db.mobileRefreshToken.findUnique({
    where: { tokenHash: refreshHash },
    include: { session: true }
  });

  if (!existing) return null;
  if (existing.revokedAt) return null;
  if (existing.expiresAt <= now()) return null;
  if (existing.session.revokedAt) return null;

  const issuedAt = now();
  const accessExpiresAt = addMinutes(issuedAt, env.MOBILE_ACCESS_TOKEN_TTL_MINUTES);
  const refreshExpiresAt = addDays(issuedAt, env.MOBILE_REFRESH_TOKEN_TTL_DAYS);
  const nextJti = generateOpaqueToken(24);
  const nextRefresh = generateOpaqueToken(48);
  const nextRefreshHash = hashRefreshToken(nextRefresh);
  const nextVersion = existing.session.refreshTokenVersion + 1;

  await db.$transaction([
    db.mobileRefreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: issuedAt }
    }),
    db.mobileSession.update({
      where: { id: existing.session.id },
      data: {
        accessTokenJti: nextJti,
        refreshTokenVersion: nextVersion,
        expiresAt: accessExpiresAt,
        lastSeenAt: issuedAt
      }
    }),
    db.mobileRefreshToken.create({
      data: {
        sessionId: existing.session.id,
        userId: existing.userId,
        tokenHash: nextRefreshHash,
        expiresAt: refreshExpiresAt,
        rotatedFromId: existing.id
      }
    })
  ]);

  const accessToken = signAccessToken({
    userId: existing.userId,
    sessionId: existing.session.id,
    jti: nextJti,
    refreshTokenVersion: nextVersion
  });

  return {
    accessToken,
    refreshToken: nextRefresh,
    expiresInSeconds: env.MOBILE_ACCESS_TOKEN_TTL_MINUTES * 60
  };
}

export async function revokeMobileSessionByRefreshToken(refreshToken: string) {
  const refreshHash = hashRefreshToken(refreshToken);
  const existing = await db.mobileRefreshToken.findUnique({
    where: { tokenHash: refreshHash },
    include: { session: true }
  });
  if (!existing) return false;

  const revokedAt = now();
  await db.$transaction([
    db.mobileSession.update({
      where: { id: existing.session.id },
      data: { revokedAt }
    }),
    db.mobileRefreshToken.updateMany({
      where: {
        sessionId: existing.session.id,
        revokedAt: null
      },
      data: { revokedAt }
    })
  ]);

  return true;
}
