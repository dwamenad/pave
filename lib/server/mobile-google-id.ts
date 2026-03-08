import { env } from "@/lib/env";

export type VerifiedGoogleIdentity = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  audience: string;
};

type TokenInfoResponse = {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  aud?: string;
  email_verified?: string;
};

function expectedAudience(platform: "ios" | "android") {
  return platform === "ios" ? env.GOOGLE_IOS_CLIENT_ID : env.GOOGLE_ANDROID_CLIENT_ID;
}

export async function verifyGoogleIdTokenForMobile(input: {
  idToken: string;
  platform: "ios" | "android";
}): Promise<VerifiedGoogleIdentity> {
  const expectedAud = expectedAudience(input.platform);
  if (!expectedAud) {
    throw new Error(`Missing Google client id for ${input.platform}`);
  }

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(input.idToken)}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Invalid Google ID token");
  }

  const data = (await response.json()) as TokenInfoResponse;
  if (!data.sub) {
    throw new Error("Google token missing subject");
  }
  if (!data.aud || data.aud !== expectedAud) {
    throw new Error("Google token audience mismatch");
  }
  if (data.email && data.email_verified !== "true") {
    throw new Error("Google account email is not verified");
  }

  return {
    sub: data.sub,
    email: data.email,
    name: data.name,
    picture: data.picture,
    audience: data.aud
  };
}
