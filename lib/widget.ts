import { Platform } from "react-native";
import { ExtensionStorage } from "@bacons/apple-targets";

import { API } from "@/lib/api";
import { startOfMonthISO, endOfMonthISO } from "@/lib/format";
import type { Pagination } from "@/models/api.model";
import type { StatisticsDashboard } from "@/store/statistic/model";
import type { TransactionViewModel } from "@/store/transaction/model";

// Must match targets/widget/index.swift + expo-target.config.js + app.json.
const APP_GROUP = "group.vn.vdcd.smartexpense";
const WIDGET_KIND = "SmartExpenseWidget";
const SUMMARY_KEY = "widgetSummary";
const RECENT_KEY = "widgetRecent";

const storage = new ExtensionStorage(APP_GROUP);

export interface WidgetRecentItem {
  name: string;
  amount: number;
  /** 0 = expense, 1 = income (matches TransactionType). */
  type: number;
}

export interface WidgetSummary {
  balance: number;
  income: number;
  expense: number;
  currency?: string;
  recent?: WidgetRecentItem[];
}

/**
 * Push the month summary into the App Group so the iOS home-screen widget can
 * read it, then nudge the widget to refresh. No-op on non-iOS and on builds
 * without the native module (Expo Go) — ExtensionStorage falls back to stubs.
 */
export function updateWidget(summary: WidgetSummary): void {
  if (Platform.OS !== "ios") return;
  try {
    storage.set(SUMMARY_KEY, {
      balance: Math.round(summary.balance || 0),
      income: Math.round(summary.income || 0),
      expense: Math.round(summary.expense || 0),
      currency: summary.currency || "VND",
      updatedAt: new Date().toISOString(),
    });

    const recent = (summary.recent ?? []).slice(0, 5).map((r) => ({
      name: r.name || "",
      amount: Math.round(r.amount || 0),
      type: r.type ?? 0,
    }));
    storage.set(RECENT_KEY, recent);

    ExtensionStorage.reloadWidget(WIDGET_KIND);
  } catch {
    // Native module unavailable (Expo Go / not built) — ignore.
  }
}

/**
 * Fetch the current month's summary + recent transactions from the API and push
 * them to the widget. Call after a transaction is created/updated/deleted so the
 * widget reflects the change immediately, regardless of the active screen.
 * iOS-only and best-effort (errors are swallowed).
 */
export async function refreshWidget(): Promise<void> {
  if (Platform.OS !== "ios") return;
  try {
    const [stat, txs] = await Promise.all([
      API.get<StatisticsDashboard>("/statistics/dashboard", {
        StartDate: startOfMonthISO(),
        EndDate: endOfMonthISO(),
      }),
      API.get<Pagination<TransactionViewModel>>("/transactions", {
        page: 1,
        size: 5,
        sort: "-transactionDate",
      }),
    ]);
    const d = stat.data;
    if (!d) return;
    updateWidget({
      balance: d.balance ?? 0,
      income: d.totalIncome ?? 0,
      expense: d.totalExpense ?? 0,
      currency: "VND",
      recent: (txs.data?.content ?? []).slice(0, 5).map((t) => ({
        name: t.category?.name || t.note || "",
        amount: t.amount ?? 0,
        type: t.type ?? 0,
      })),
    });
  } catch {
    // Best-effort — leave the last-known widget data in place.
  }
}
