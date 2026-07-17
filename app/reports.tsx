import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";

import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { API } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { colorForIndex } from "@/lib/ui-helpers";
import { colors } from "@/theme/colors";
import type { StatisticsDashboard } from "@/store/statistic/model";

const FMT = "YYYY-MM-DDTHH:mm:ss";
type Mode = "month" | "lastMonth" | "year";

function ranges(mode: Mode) {
  const now = dayjs();
  if (mode === "lastMonth") {
    const m = now.subtract(1, "month");
    const p = now.subtract(2, "month");
    return { s: m.startOf("month"), e: m.endOf("month"), ps: p.startOf("month"), pe: p.endOf("month") };
  }
  if (mode === "year") {
    const p = now.subtract(1, "year");
    return { s: now.startOf("year"), e: now.endOf("year"), ps: p.startOf("year"), pe: p.endOf("year") };
  }
  const p = now.subtract(1, "month");
  return { s: now.startOf("month"), e: now.endOf("month"), ps: p.startOf("month"), pe: p.endOf("month") };
}

async function fetchStat(s: dayjs.Dayjs, e: dayjs.Dayjs) {
  const res = await API.get<StatisticsDashboard>("/statistics/dashboard", {
    StartDate: s.format(FMT),
    EndDate: e.format(FMT),
  });
  return res.data;
}

function DeltaBadge({
  current,
  prev,
  positiveWhenUp,
}: {
  current: number;
  prev: number;
  positiveWhenUp: boolean;
}) {
  const pct = prev > 0 ? ((current - prev) / prev) * 100 : current > 0 ? 100 : 0;
  const up = current >= prev;
  const good = up === positiveWhenUp;
  const color = good ? colors.primary : colors.expense;
  return (
    <View className="flex-row items-center gap-0.5">
      <Ionicons name={up ? "arrow-up" : "arrow-down"} size={12} color={color} />
      <Text className="text-[11px] font-semibold" style={{ color }}>
        {Math.abs(pct).toFixed(0)}%
      </Text>
    </View>
  );
}

export default function ReportsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("month");
  const [cur, setCur] = useState<StatisticsDashboard | undefined>();
  const [prev, setPrev] = useState<StatisticsDashboard | undefined>();

  useFocusEffect(
    useCallback(() => {
      const { s, e, ps, pe } = ranges(mode);
      fetchStat(s, e).then(setCur).catch(() => {});
      fetchStat(ps, pe).then(setPrev).catch(() => {});
    }, [mode]),
  );

  const income = cur?.totalIncome ?? 0;
  const expense = cur?.totalExpense ?? 0;
  const net = income - expense;
  const donut = cur?.donutChartCategoryExpense;
  const topCats =
    donut?.categoryNames?.slice(0, 5).map((name, i) => ({
      name,
      amount: donut.amounts?.[i] ?? 0,
      color: donut.colors?.[i] || colorForIndex(i),
    })) ?? [];
  const topMax = Math.max(1, ...topCats.map((c) => c.amount));

  const TABS: { value: Mode; label: string }[] = [
    { value: "month", label: t("reports.month") },
    { value: "lastMonth", label: t("reports.lastMonth") },
    { value: "year", label: t("reports.year") },
  ];

  return (
    <Screen className="px-5" orbs={false}>
      <View className="mb-3 mt-1 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t("reports.title")}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        {/* Period tabs */}
        <View className="mb-4 flex-row rounded-2xl bg-glass-light p-1">
          {TABS.map((tab) => {
            const active = mode === tab.value;
            return (
              <Pressable
                key={tab.value}
                onPress={() => setMode(tab.value)}
                className={`flex-1 items-center rounded-xl py-2.5 ${active ? "bg-primary" : ""}`}
              >
                <Text className={`text-sm font-semibold ${active ? "text-white" : "text-muted"}`}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Summary */}
        <GlassCard className="p-5">
          <View className="flex-row">
            <View className="flex-1">
              <Text className="text-xs text-muted">{t("reports.income")}</Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                <Text className="text-lg font-bold text-primary" numberOfLines={1}>
                  {formatCurrency(income)}
                </Text>
                <DeltaBadge current={income} prev={prev?.totalIncome ?? 0} positiveWhenUp />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted">{t("reports.expense")}</Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                <Text className="text-lg font-bold text-expense" numberOfLines={1}>
                  {formatCurrency(expense)}
                </Text>
                <DeltaBadge current={expense} prev={prev?.totalExpense ?? 0} positiveWhenUp={false} />
              </View>
            </View>
          </View>
          <View className="mt-4 border-t border-glass-border pt-3">
            <Text className="text-xs text-muted">{t("reports.net")}</Text>
            <Text
              className="mt-0.5 text-2xl font-bold"
              style={{ color: net >= 0 ? colors.primary : colors.expense }}
              numberOfLines={1}
            >
              {formatCurrency(net)}
            </Text>
          </View>
          <Text className="mt-1 text-[11px] text-muted">{t("reports.vsPrev")}</Text>
        </GlassCard>

        {/* Top categories */}
        <Text className="mb-2 ml-1 mt-5 text-base font-bold text-ink">
          {t("reports.topCategories")}
        </Text>
        <GlassSurface radius={20} className="px-4 py-2">
          {topCats.length === 0 ? (
            <Text className="py-6 text-center text-muted">{t("reports.noData")}</Text>
          ) : (
            topCats.map((c, i) => (
              <View key={c.name + i} className="py-2.5">
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 text-[15px] text-ink" numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text className="text-[15px] font-semibold text-ink">
                    {formatCurrency(c.amount)}
                  </Text>
                </View>
                <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-glass-light">
                  <View
                    style={{
                      width: `${(c.amount / topMax) * 100}%`,
                      height: "100%",
                      backgroundColor: c.color,
                    }}
                  />
                </View>
              </View>
            ))
          )}
        </GlassSurface>
      </ScrollView>
    </Screen>
  );
}
