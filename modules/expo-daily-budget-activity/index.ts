// JS handle for the native module. Consumers should use lib/live-activity.ts,
// which guards against the module being absent (Android / Expo Go / older build).
import { requireNativeModule } from "expo";

export default requireNativeModule("DailyBudgetActivity");
