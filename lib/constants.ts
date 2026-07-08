export const linkApi =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:5200/api/v1";

/** Static file host derived from the API base (uploads served at /files/...). */
export const fileHost = linkApi.replace(/\/api\/v\d+\/?$/, "");

export const STORAGE_KEYS = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  user: "user",
  language: "i18nextLng",
  biometric: "biometricEnabled",
  themeMode: "themeMode",
  notificationSound: "notificationSoundEnabled",
} as const;

export const DEFAULT_LANGUAGE = "vi";
