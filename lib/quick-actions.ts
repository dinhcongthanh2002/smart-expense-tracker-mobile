import * as QuickActions from "expo-quick-actions";

/** Stable ids for the home-screen quick actions (long-press the app icon). */
export const QUICK_ACTION = {
  add: "add-transaction",
  voice: "voice-quick-add",
  budgets: "budgets",
} as const;

/**
 * Register the app-icon quick actions. Called on the dashboard so they stay
 * localized; the OS persists them after the first launch. No-op / best-effort
 * where unsupported (Expo Go, web).
 */
export function registerQuickActions(t: (key: string) => string): void {
  QuickActions.setItems([
    {
      id: QUICK_ACTION.add,
      title: t("quickActions.addTransaction"),
      icon: "symbol:plus.circle.fill",
      params: { href: "/transaction-form" },
    },
    {
      id: QUICK_ACTION.voice,
      title: t("quickActions.voiceAdd"),
      icon: "symbol:mic.fill",
      // href is a fallback target; the dashboard opens the quick-add sheet directly.
      params: { href: "/(tabs)" },
    },
    {
      id: QUICK_ACTION.budgets,
      title: t("quickActions.budgets"),
      icon: "symbol:chart.pie.fill",
      params: { href: "/budgets" },
    },
  ]).catch(() => {
    // Unsupported platform / not built — ignore.
  });
}
