import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { CategoryBadge } from "@/components/CategoryBadge";
import { BudgetFacade } from "@/store/budget";
import { formatCurrency } from "@/lib/format";
import { colors } from "@/theme/colors";

function progressColor(percent: number) {
  if (percent >= 100) return colors.expense;
  if (percent >= 80) return colors.warning;
  return colors.income;
}

export default function BudgetsScreen() {
  const router = useRouter();
  const budget = BudgetFacade();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const load = useCallback(
    (m: number, y: number) => {
      budget.get({ filter: { month: m, year: y } });
      budget.getProgress({ month: m, year: y });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      load(month, year);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month, year]),
  );

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
  };

  const budgets = budget.pagination?.content ?? [];
  const items = useMemo(
    () =>
      budgets.map((b) => {
        const p = budget.progress.find((x) => x.categoryId === b.categoryId);
        const spent = p?.currentSpent ?? 0;
        const limit = b.limitAmount ?? 0;
        const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        return { b, spent, limit, percent, remaining: limit - spent };
      }),
    [budgets, budget.progress],
  );
  const totalLimit = items.reduce((s, i) => s + i.limit, 0);
  const totalSpent = items.reduce((s, i) => s + i.spent, 0);

  return (
    <Screen className="px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-28">
        <View className="mb-4 mt-2 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-ink">Ngân sách</Text>
          <Pressable
            onPress={() => router.push({ pathname: "/budget-form", params: { month: String(month), year: String(year) } })}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary/20 active:opacity-70"
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </Pressable>
        </View>

        {/* month selector */}
        <View className="mb-4 flex-row items-center justify-between rounded-2xl bg-white/[0.06] px-2 py-2">
          <Pressable onPress={() => shift(-1)} hitSlop={8} className="h-9 w-9 items-center justify-center">
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          <Text className="text-base font-semibold text-ink">
            Tháng {month}/{year}
          </Text>
          <Pressable onPress={() => shift(1)} hitSlop={8} className="h-9 w-9 items-center justify-center">
            <Ionicons name="chevron-forward" size={22} color={colors.ink} />
          </Pressable>
        </View>

        {/* summary */}
        <GlassSurface radius={22} className="flex-row p-5" style={{ marginBottom: 20 }}>
          <View className="flex-1">
            <Text className="text-xs text-muted">Đã chi</Text>
            <Text className="mt-1 text-lg font-bold text-expense">
              {formatCurrency(totalSpent)}
            </Text>
          </View>
          <View className="flex-1 items-end">
            <Text className="text-xs text-muted">Ngân sách</Text>
            <Text className="mt-1 text-lg font-bold text-ink">
              {formatCurrency(totalLimit)}
            </Text>
          </View>
        </GlassSurface>

        {items.length === 0 && !budget.isLoading ? (
          <GlassSurface radius={24} className="items-center p-10">
            <Ionicons name="pie-chart-outline" size={40} color={colors.muted} />
            <Text className="mt-3 text-muted">Chưa có ngân sách tháng này</Text>
            <Pressable
              onPress={() => router.push({ pathname: "/budget-form", params: { month: String(month), year: String(year) } })}
              className="mt-4 rounded-full bg-primary px-5 py-2.5 active:opacity-80"
            >
              <Text className="font-semibold text-white">Đặt ngân sách</Text>
            </Pressable>
          </GlassSurface>
        ) : (
          items.map(({ b, spent, limit, percent, remaining }) => {
            const barColor = progressColor(percent);
            const over = remaining < 0;
            return (
              <Pressable
                key={b.id}
                onPress={() => router.push({ pathname: "/budget-form", params: { id: b.id! } })}
                className="active:opacity-70"
              >
                <GlassSurface radius={20} className="p-4" style={{ marginBottom: 12 }}>
                  <View className="flex-row items-center gap-3">
                    <CategoryBadge
                      icon={b.category?.icon}
                      color={b.category?.color || colors.primary}
                      size={42}
                    />
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                        {b.category?.name ?? "Danh mục"}
                      </Text>
                      <Text className="mt-0.5 text-xs text-muted">
                        {formatCurrency(spent)} / {formatCurrency(limit)}
                      </Text>
                    </View>
                    <Text className="text-sm font-bold" style={{ color: barColor }}>
                      {percent}%
                    </Text>
                  </View>

                  {/* progress bar */}
                  <View className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
                    <View
                      style={{
                        width: `${Math.min(percent, 100)}%`,
                        height: "100%",
                        borderRadius: 999,
                        backgroundColor: barColor,
                      }}
                    />
                  </View>
                  <Text className="mt-2 text-xs" style={{ color: over ? colors.expense : colors.muted }}>
                    {over
                      ? `Vượt ${formatCurrency(-remaining)}`
                      : `Còn lại ${formatCurrency(remaining)}`}
                  </Text>
                </GlassSurface>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
