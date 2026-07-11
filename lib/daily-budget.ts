import dayjs from "dayjs";

import { API } from "@/lib/api";
import type { Pagination } from "@/models/api.model";
import type { BudgetViewModel } from "@/store/budget/model";
import type { DailyBreakdown } from "@/store/statistic/model";

export interface DailyBudget {
  /** This month's total budget ÷ days in month. 0 when no budget is set. */
  dailyLimit: number;
  /** Amount spent so far today. */
  spentToday: number;
}

/**
 * Fetch today's budget picture: daily limit (monthly budget ÷ days) and today's
 * spend. Shared by the widget sync and the Live Activity. Best-effort → returns
 * zeros on failure.
 */
export async function computeDailyBudget(): Promise<DailyBudget> {
  const now = dayjs();
  const month = now.month() + 1;
  const year = now.year();
  try {
    const [budgets, daily] = await Promise.all([
      API.get<Pagination<BudgetViewModel>>("/budgets", { page: 1, size: 200 }),
      API.get<DailyBreakdown[]>("/statistics/daily-breakdown", { Month: month, Year: year }),
    ]);
    const monthlyBudget = (budgets.data?.content ?? [])
      .filter((b) => b.month === month && b.year === year)
      .reduce((sum, b) => sum + (b.limitAmount || 0), 0);
    const dailyLimit = monthlyBudget / now.daysInMonth();

    const today = (daily.data ?? []).find((x) => dayjs(x.date).isSame(now, "day"));
    return { dailyLimit, spentToday: today?.expense ?? 0 };
  } catch {
    return { dailyLimit: 0, spentToday: 0 };
  }
}
