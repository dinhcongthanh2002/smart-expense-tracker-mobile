import { Platform } from "react-native";
import { ExtensionStorage } from "@bacons/apple-targets";

import { linkApi } from "./constants";

// Shares the current session with the native iOS App Intent (Siri "Thêm giao
// dịch…") so the intent can call the backend on its own, in its own process.
//
// The App Intent runs OUTSIDE the JS runtime (it may even launch the app in the
// background), so it cannot use the in-memory token cache in secure-storage.ts.
// We therefore mirror the access token + API base URL into the shared App Group
// UserDefaults. The Swift side reads it exactly like the widget reads its
// summary: `UserDefaults(suiteName:).data(forKey:)` + JSONSerialization.
//
// Must match APP_GROUP + AUTH_KEY in plugins/ios/ExpenseSiriIntents.swift.
const APP_GROUP = "group.vn.vdcd.smartexpense";
const AUTH_KEY = "siriAuth";

const storage = new ExtensionStorage(APP_GROUP);

/**
 * Publish the session to the App Group so the Siri App Intent can authenticate.
 * iOS-only, best-effort (no-op on Android/web and on Expo Go where the native
 * module is a stub).
 */
export function publishSiriAuth(token: string | null | undefined): void {
  if (Platform.OS !== "ios") return;
  try {
    if (!token) {
      storage.remove(AUTH_KEY);
      return;
    }
    storage.set(AUTH_KEY, { token, baseUrl: linkApi });
  } catch {
    // Native module unavailable (Expo Go / not built) — ignore.
  }
}

/** Remove the shared session (call on logout). */
export function clearSiriAuth(): void {
  if (Platform.OS !== "ios") return;
  try {
    storage.remove(AUTH_KEY);
  } catch {
    // ignore
  }
}
