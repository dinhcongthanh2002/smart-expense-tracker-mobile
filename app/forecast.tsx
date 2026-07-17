import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { StatisticFacade } from "@/store/statistic";
import { formatCurrency } from "@/lib/format";
import { colors } from "@/theme/colors";

function Row({
  label,
  value,
  sign,
  color,
  strong,
}: {
  label: string;
  value: number;
  sign?: "+" | "-";
  color?: string;
  strong?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className={`text-[15px] ${strong ? "font-bold text-ink" : "text-muted"}`}>
        {label}
      </Text>
      <Text
        className={`text-[15px] ${strong ? "font-bold" : "font-semibold"}`}
        style={{ color: color ?? colors.ink }}
      >
        {sign === "-" ? "−" : sign === "+" ? "+" : ""}
        {formatCurrency(Math.abs(value))}
      </Text>
    </View>
  );
}

export default function ForecastScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { forecast: f, getForecast } = StatisticFacade();

  useFocusEffect(
    useCallback(() => {
      getForecast();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const projected = f?.projectedEndBalance ?? 0;
  const positive = projected >= 0;

  return (
    <Screen className="px-5" orbs={false}>
      <View className="mb-3 mt-1 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t("forecast.title")}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        <GlassCard className="p-5">
          <Text className="text-sm text-muted">{t("forecast.projected")}</Text>
          <Text
            className="mt-1 text-4xl font-bold"
            style={{ color: positive ? colors.primary : colors.expense }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCurrency(projected)}
          </Text>
          <Text className="mt-1 text-xs text-muted">{t("forecast.subtitle")}</Text>
          {f ? (
            <Text className="mt-3 text-xs text-muted">
              {t("forecast.daysProgress", { elapsed: f.daysElapsed, total: f.daysInMonth })}
            </Text>
          ) : null}
        </GlassCard>

        <GlassSurface radius={20} className="mt-4 px-4">
          <Row label={t("forecast.currentBalance")} value={f?.currentBalance ?? 0} />
          <View className="h-px bg-glass-border" />
          <Row
            label={t("forecast.remainingSpend", { days: f?.daysRemaining ?? 0 })}
            value={f?.projectedRemainingExpense ?? 0}
            sign="-"
            color={colors.expense}
          />
          <View className="h-px bg-glass-border" />
          <Row
            label={t("forecast.recurringIncome")}
            value={f?.expectedRecurringIncome ?? 0}
            sign="+"
            color={colors.primary}
          />
          <View className="h-px bg-glass-border" />
          <Row
            label={t("forecast.projected")}
            value={projected}
            strong
            color={positive ? colors.primary : colors.expense}
          />
        </GlassSurface>

        <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-glass-light px-4 py-3">
          <Text className="text-sm text-muted">{t("forecast.avgDaily")}</Text>
          <Text className="text-sm font-semibold text-ink">
            {formatCurrency(f?.avgDailyExpense ?? 0)}
          </Text>
        </View>

        <Text className="mt-4 px-1 text-xs leading-5 text-muted">{t("forecast.note")}</Text>
      </ScrollView>
    </Screen>
  );
}
