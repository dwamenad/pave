import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

const ALGO = "HS256";
const ISSUER = "pave.mobile";
const AUDIENCE = "pave.api";

export type MobileAccessClaims = {
  sub: string;
  sid: string;
  jti: string;
  ver: number;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
};

function getSigningSecret() {
  const secret = env.MOBILE_AUTH_JWT_SECRET || env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing MOBILE_AUTH_JWT_SECRET (or NEXTAUTH_SECRET fallback)");
  }
  return secret;
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function sign(input: string) {
  return base64UrlEncode(createHmac("sha256", getSigningSecret()).update(input).digest());
}

export function generateOpaqueToken(bytes = 48) {
  return base64UrlEncode(randomBytes(bytes));
}

export function hashRefreshToken(token: string) {
  return createHmac("sha256", getSigningSecret()).update(token).digest("hex");
}

export function signAccessToken(input: {
  userId: string;
  sessionId: string;
  jti: string;
  refreshTokenVersion: number;
  ttlMinutes?: number;
}) {
  const ttlMinutes = input.ttlMinutes ?? env.MOBILE_ACCESS_TOKEN_TTL_MINUTES;
  const now = Math.floor(Date.now() / 1000);
  const claims: MobileAccessClaims = {
    sub: input.userId,
    sid: input.sessionId,
    jti: input.jti,
    ver: input.refreshTokenVersion,
    iat: now,
    exp: now + ttlMinutes * 60,
    iss: ISSUER,
    aud: AUDIENCE
  };

  const header = { alg: ALGO, typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(message);
  return `${message}.${signature}`;
}

export function verifyAccessToken(token: string): MobileAccessClaims | null {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null;

  const message = `${encodedHeader}.${encodedPayload}`;
  const expected = sign(message);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(encodedSignature);
  if (expectedBuffer.length !== actualBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, actualBuffer)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as MobileAccessClaims;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return null;
    if (payload.iss !== ISSUER) return null;
    if (payload.aud !== AUDIENCE) return null;
    return payload;
  } catch {
    return null;
  }
}
