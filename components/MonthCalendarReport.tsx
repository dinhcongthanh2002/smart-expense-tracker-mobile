import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { GlassCard } from "@/components/ui/GlassCard";
import { formatCurrency } from "@/lib/format";
import { StatisticFacade } from "@/store/statistic";
import { colors } from "@/theme/colors";

const MASK = "******";

/** Monday-first weekday index (0 = Monday .. 6 = Sunday). */
function mondayIndex(d: Date) {
  return (d.getDay() + 6) % 7;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

interface Props {
  hidden?: boolean;
}

/** A monthly calendar that reports daily income/expense on the dashboard. */
export function MonthCalendarReport({ hidden }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const stat = StatisticFacade();
  const weekdays = t("dashboard.weekdays", { returnObjects: true }) as string[];
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [year, setYear] = useState(today.getFullYear());
  const isCurrentMonth =
    month === today.getMonth() + 1 && year === today.getFullYear();
  const [selectedDay, setSelectedDay] = useState<number | null>(
    isCurrentMonth ? today.getDate() : null,
  );

  useFocusEffect(
    useCallback(() => {
      stat.getDailyBreakdown({ month, year });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month, year]),
  );

  // Map day-of-month -> { income, expense } for the visible month.
  const byDay = useMemo(() => {
    const m = new Map<number, { income: number; expense: number }>();
    const prefix = `${year}-${pad2(month)}-`;
    stat.dailyBreakdown.forEach((d) => {
      if (d.date.startsWith(prefix)) {
        const day = Number(d.date.slice(8, 10));
        m.set(day, { income: d.income, expense: d.expense });
      }
    });
    return m;
  }, [stat.dailyBreakdown, month, year]);

  const monthTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    byDay.forEach((v) => {
      income += v.income;
      expense += v.expense;
    });
    return { income, expense };
  }, [byDay]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlanks = mondayIndex(new Date(year, month - 1, 1));
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const shift = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
    const nowCurrent = m === today.getMonth() + 1 && y === today.getFullYear();
    setSelectedDay(nowCurrent ? today.getDate() : null);
  };

  const money = (v: number) => (hidden ? MASK : formatCurrency(v));
  const selected = selectedDay ? byDay.get(selectedDay) : undefined;

  return (
    <GlassCard className="p-5" style={{ marginTop: 20 }}>
      {/* header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-ink">{t("dashboard.calendarTitle")}</Text>
        <View className="flex-row items-center gap-1">
          <Pressable onPress={() => shift(-1)} hitSlop={8} className="items-center justify-center w-8 h-8">
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          <Text className="text-sm font-semibold text-center w-28 text-ink">
            {t("common.monthYear", { month, year })}
          </Text>
          <Pressable onPress={() => shift(1)} hitSlop={8} className="items-center justify-center w-8 h-8">
            <Ionicons name="chevron-forward" size={20} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      {/* month totals */}
      <View className="flex-row gap-3 mt-3">
        <View className="flex-1 flex-row items-center gap-1.5 rounded-xl bg-income/10 px-3 py-2">
          <Ionicons name="arrow-down" size={14} color={colors.income} />
          <Text className="text-sm font-semibold text-income" numberOfLines={1}>
            {money(monthTotals.income)}
          </Text>
        </View>
        <View className="flex-1 flex-row items-center gap-1.5 rounded-xl bg-expense/10 px-3 py-2">
          <Ionicons name="arrow-up" size={14} color={colors.expense} />
          <Text className="text-sm font-semibold text-expense" numberOfLines={1}>
            {money(monthTotals.expense)}
          </Text>
        </View>
      </View>

      {/* weekday header */}
      <View className="flex-row mt-4">
        {weekdays.map((w, i) => (
          <View key={w} className="items-center flex-1">
            <Text
              className={`text-xs font-medium ${i >= 5 ? "text-expense" : "text-muted"}`}
              style={i >= 5 ? { opacity: 0.7 } : undefined}
            >
              {w}
            </Text>
          </View>
        ))}
      </View>

      {/* day grid — one flex-row per week so 7 cells always divide evenly */}
      <View className="mt-1">
        {weeks.map((week, wi) => (
          <View key={wi} className="flex-row">
            {week.map((day, di) => {
              if (day === null) {
                return <View key={`b${wi}-${di}`} className="flex-1 h-12" />;
              }
              const data = byDay.get(day);
              const isSelected = day === selectedDay;
              const isToday = isCurrentMonth && day === today.getDate();
              const isWeekend = di >= 5; // Saturday (5) & Sunday (6), Monday-first
              return (
                <Pressable
                  key={day}
                  onPress={() => {
                    setSelectedDay(day);
                    router.push({
                      pathname: "/day-transactions",
                      params: { date: `${year}-${pad2(month)}-${pad2(day)}` },
                    });
                  }}
                  className="items-center justify-center flex-1 h-12 active:opacity-60"
                >
                  <View
                    className={`h-8 w-8 items-center justify-center rounded-full ${
                      isSelected ? "bg-primary" : isToday ? "border border-primary" : ""
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        isSelected ? "font-bold text-white" : isWeekend ? "text-expense" : "text-ink"
                      }`}
                    >
                      {day}
                    </Text>
                  </View>
                  <View className="mt-0.5 h-1 flex-row items-center gap-0.5">
                    {data && data.income > 0 ? (
                      <View className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.income }} />
                    ) : null}
                    {data && data.expense > 0 ? (
                      <View className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.expense }} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* selected day detail */}
      {selectedDay ? (
        <View className="p-4 mt-3 rounded-2xl bg-glass-light">
          <Text className="text-sm font-semibold text-ink">
            {t("dashboard.dayTitle", {
              day: pad2(selectedDay),
              month: pad2(month),
              year,
            })}
          </Text>
          {selected ? (
            <View className="flex-row mt-2">
              <View className="flex-1">
                <Text className="text-xs text-muted">{t("common.income")}</Text>
                <Text className="mt-0.5 text-base font-bold text-income">
                  {money(selected.income)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted">{t("common.expense")}</Text>
                <Text className="mt-0.5 text-base font-bold text-expense">
                  {money(selected.expense)}
                </Text>
              </View>
            </View>
          ) : (
            <Text className="mt-2 text-sm text-muted">{t("dashboard.noTransactionsDay")}</Text>
          )}
        </View>
      ) : null}
    </GlassCard>
  );
}
