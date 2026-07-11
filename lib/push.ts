import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { API } from "@/lib/api";
import { DeviceType } from "@/models/enums";

// Show notifications while the app is in the foreground (banner + sound).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const ANDROID_CHANNEL_ID = "default";

function deviceTypeForPlatform(): DeviceType {
  if (Platform.OS === "ios") return DeviceType.iOS;
  if (Platform.OS === "android") return DeviceType.Android;
  return DeviceType.Web;
}

function resolveProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

/**
 * Ask for permission and return this device's Expo push token
 * (`ExponentPushToken[...]`). Returns null when unavailable (simulator, denied
 * permission, missing projectId, or the native module isn't in the build).
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push tokens are only issued on physical devices.
  if (!Device.isDevice) return null;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: "Thông báo",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1d9e75",
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== "granted") return null;

    const projectId = resolveProjectId();
    if (!projectId) {
      console.warn("[push] Missing EAS projectId — cannot fetch Expo push token");
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch (err) {
    console.warn("[push] registration failed", err);
    return null;
  }
}

/**
 * Register for push and upload the token to the backend
 * (`POST /notification-token`). Safe to call on every authenticated app start;
 * the backend upserts by (user, token). No-op when a token can't be obtained.
 */
export async function syncPushToken(): Promise<string | null> {
  const token = await registerForPushNotificationsAsync();
  if (!token) return null;
  try {
    await API.post("/notification-token", {
      token,
      deviceType: deviceTypeForPlatform(),
    });
  } catch {
    // Non-fatal — we'll try again on the next app launch.
  }
  return token;
}
