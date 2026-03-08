export type MobileAuthGoogleRequest = {
  idToken: string;
  platform: "ios" | "android";
  deviceName?: string;
  appVersion?: string;
};

export type MobileAuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: {
    id: string;
    username?: string | null;
    name?: string | null;
    image?: string | null;
  };
};

export type MobileRefreshRequest = {
  refreshToken: string;
};

export type MobileRefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

export type MobileLogoutRequest = {
  refreshToken: string;
};

export type MobileLogoutResponse = {
  ok: true;
};

export type MobileMeResponse = {
  user: {
    id: string;
    email?: string | null;
    username?: string | null;
    name?: string | null;
    image?: string | null;
    bio?: string | null;
  };
};

export type MobileDeviceRegisterRequest = {
  installationId: string;
  platform: "ios" | "android";
  appVersion?: string;
  pushToken?: string;
  deviceName?: string;
};

export type MobileDeviceRegisterResponse = {
  deviceId: string;
};
