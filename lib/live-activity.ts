import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { computeDailyBudget } from "@/lib/daily-budget";

// Lazy-require the native ActivityKit module — absent on Android / Expo Go /
// builds without the module → everything becomes a safe no-op.
let Native: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { requireNativeModule } = require("expo");
  Native = requireNativeModule("DailyBudgetActivity");
} catch {
  Native = null;
}

const ID_KEY = "dailyBudgetActivityId";

/** True when the Live Activity native module is present (iOS dev-client build). */
export function isLiveActivitySupported(): boolean {
  return Platform.OS === "ios" && !!Native;
}

/** Whether the user has Live Activities enabled in Settings for this app. */
export function areLiveActivitiesEnabled(): boolean {
  if (!isLiveActivitySupported()) return false;
  try {
    return !!Native.isEnabled();
  } catch {
    return false;
  }
}

/** Whether a daily-budget Live Activity is currently running. */
export async function isTrackingDailyBudget(): Promise<boolean> {
  return !!(await AsyncStorage.getItem(ID_KEY));
}

/** Start tracking today's budget as a Live Activity (fetches current numbers). */
export async function startDailyBudgetTracking(currency = "VND"): Promise<boolean> {
  if (!isLiveActivitySupported()) return false;
  const { dailyLimit, spentToday } = await computeDailyBudget();
  try {
    const id: string | null = Native.start(
      Math.round(spentToday),
      Math.round(dailyLimit),
      currency,
    );
    if (id) {
      await AsyncStorage.setItem(ID_KEY, id);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/** Push new numbers to the running activity (no-op when not tracking). */
export async function updateDailyBudgetActivity(
  spentToday: number,
  dailyLimit: number,
): Promise<void> {
  if (!isLiveActivitySupported()) return;
  const id = await AsyncStorage.getItem(ID_KEY);
  if (!id) return;
  try {
    await Native.update(id, Math.round(spentToday), Math.round(dailyLimit));
  } catch {
    // ignore
  }
}

/** End the running daily-budget activity. */
export async function stopDailyBudgetTracking(): Promise<void> {
  if (!isLiveActivitySupported()) {
    await AsyncStorage.removeItem(ID_KEY);
    return;
  }
  const id = await AsyncStorage.getItem(ID_KEY);
  try {
    if (id) await Native.end(id);
    else await Native.endAll();
  } catch {
    // ignore
  }
  await AsyncStorage.removeItem(ID_KEY);
}
