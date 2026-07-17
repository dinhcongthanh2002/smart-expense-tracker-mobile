import { useCallback } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-gifted-charts";

import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { StatisticFacade } from "@/store/statistic";
import { formatCurrency, formatCompact } from "@/lib/format";
import { colors } from "@/theme/colors";

function Row({
  label,
  value,
  strong,
  color,
}: {
  label: string;
  value: number;
  strong?: boolean;
  color?: string;
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
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

export default function NetWorthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { netWorth: nw, getNetWorth } = StatisticFacade();

  useFocusEffect(
    useCallback(() => {
      getNetWorth();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const trend = nw?.trend ?? [];
  const chartData = trend.map((p) => ({
    value: Math.round(p.value),
    label: p.label.slice(0, 2), // MM
  }));
  const maxV = Math.max(1, ...chartData.map((d) => d.value));
  const spacing = chartData.length > 1 ? (width - 96) / (chartData.length - 1) : 40;

  return (
    <Screen className="px-5" orbs={false}>
      <View className="mb-3 mt-1 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t("netWorth.title")}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        {/* Net worth number */}
        <GlassCard className="p-5">
          <Text className="text-sm text-muted">{t("netWorth.title")}</Text>
          <Text
            className="mt-1 text-4xl font-bold"
            style={{ color: (nw?.netWorth ?? 0) >= 0 ? colors.primary : colors.expense }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCurrency(nw?.netWorth ?? 0)}
          </Text>
          <Text className="mt-1 text-xs text-muted">{t("netWorth.subtitle")}</Text>
        </GlassCard>

        {/* Trend */}
        {chartData.length > 1 ? (
          <GlassCard className="mt-4 p-5">
            <Text className="mb-4 text-base font-bold text-ink">{t("netWorth.trend6m")}</Text>
            <LineChart
              data={chartData}
              color={colors.primary}
              thickness={3}
              curved
              hideDataPoints={false}
              dataPointsColor={colors.primary}
              maxValue={maxV * 1.15}
              noOfSections={4}
              spacing={spacing}
              initialSpacing={12}
              hideRules
              yAxisColor="transparent"
              xAxisColor={colors.glassBorder}
              yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}
              formatYLabel={(v: string) => formatCompact(Number(v))}
            />
          </GlassCard>
        ) : null}

        {/* Breakdown */}
        <GlassSurface radius={20} className="mt-4 px-4">
          <Row label={t("netWorth.wallet")} value={nw?.walletBalance ?? 0} />
          <View className="h-px bg-glass-border" />
          <Row label={t("netWorth.savings")} value={nw?.savingsBalance ?? 0} />
          <View className="h-px bg-glass-border" />
          <Row label={t("netWorth.lent")} value={nw?.debtLent ?? 0} />
          <View className="h-px bg-glass-border" />
          <Row label={t("netWorth.assets")} value={nw?.assets ?? 0} strong color={colors.primary} />
          <View className="h-px bg-glass-border" />
          <Row
            label={t("netWorth.borrowed")}
            value={nw?.debtBorrowed ?? 0}
            color={colors.expense}
          />
        </GlassSurface>

        <Text className="mt-4 px-1 text-xs leading-5 text-muted">{t("netWorth.note")}</Text>
      </ScrollView>
    </Screen>
  );
}
