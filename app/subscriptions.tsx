import { useCallback, useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { RecurringFacade } from "@/store/recurring";
import { FREQUENCY_META } from "@/store/recurring/model";
import { RecurringFrequency, TransactionType } from "@/models/enums";
import { formatCurrency, formatDate } from "@/lib/format";
import { colorForIndex } from "@/lib/ui-helpers";
import { colors } from "@/theme/colors";

const DAYS_PER_MONTH = 365 / 12; // ≈ 30.44

// Normalize any recurring amount to its per-month equivalent.
function monthlyEquivalent(amount: number, freq: RecurringFrequency): number {
  switch (freq) {
    case RecurringFrequency.Daily:
      return amount * DAYS_PER_MONTH;
    case RecurringFrequency.Weekly:
      return amount * (DAYS_PER_MONTH / 7);
    case RecurringFrequency.Yearly:
      return amount / 12;
    default:
      return amount; // Monthly
  }
}

export default function SubscriptionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const recurring = RecurringFacade();

  useFocusEffect(
    useCallback(() => {
      recurring.get({ page: 1, size: 200 });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const items = useMemo(() => {
    const all = recurring.pagination?.content ?? [];
    return all
      .filter((r) => r.type === TransactionType.Expense && r.isActive)
      .map((r) => ({ ...r, monthly: monthlyEquivalent(r.amount ?? 0, r.frequency) }))
      .sort((a, b) => (a.nextRunDate ?? "").localeCompare(b.nextRunDate ?? ""));
  }, [recurring.pagination]);

  const monthlyTotal = items.reduce((s, r) => s + r.monthly, 0);

  return (
    <Screen className="px-5" orbs={false}>
      <View className="mb-3 mt-1 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t("subscriptions.title")}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        <GlassCard className="p-5">
          <Text className="text-sm text-muted">{t("subscriptions.monthlyTotal")}</Text>
          <Text
            className="mt-1 text-4xl font-bold text-expense"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCurrency(monthlyTotal)}
          </Text>
          <Text className="mt-1 text-xs text-muted">
            {t("subscriptions.perYear", { amount: formatCurrency(monthlyTotal * 12) })} ·{" "}
            {t("subscriptions.count", { count: items.length })}
          </Text>
        </GlassCard>

        {items.length === 0 ? (
          <GlassSurface radius={24} className="mt-4 items-center p-10">
            <Ionicons name="repeat" size={40} color={colors.muted} />
            <Text className="mt-3 text-center text-muted">{t("subscriptions.empty")}</Text>
          </GlassSurface>
        ) : (
          <View className="mt-4">
            {items.map((r, i) => {
              const name = r.category?.name || r.note || FREQUENCY_META[r.frequency].label;
              const color = r.category?.color || colorForIndex(i);
              return (
                <Pressable
                  key={r.id}
                  onPress={() =>
                    router.push({ pathname: "/recurring-form", params: { id: r.id! } })
                  }
                  className="active:opacity-70"
                >
                  <GlassSurface
                    radius={18}
                    className="flex-row items-center gap-3 p-4"
                    style={{ marginBottom: 10 }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: `${color}26`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="repeat" size={20} color={color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-semibold text-ink" numberOfLines={1}>
                        {name}
                      </Text>
                      <Text className="mt-0.5 text-xs text-muted">
                        {formatCurrency(r.amount)}/{FREQUENCY_META[r.frequency].short}
                        {r.nextRunDate
                          ? ` · ${t("subscriptions.nextCharge", { date: formatDate(r.nextRunDate) })}`
                          : ""}
                      </Text>
                    </View>
                    <Text className="text-[15px] font-bold text-ink">
                      {formatCurrency(Math.round(r.monthly))}
                      <Text className="text-xs font-normal text-muted">
                        {t("subscriptions.perMonth")}
                      </Text>
                    </Text>
                  </GlassSurface>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text className="mt-4 px-1 text-xs leading-5 text-muted">{t("subscriptions.note")}</Text>
      </ScrollView>
    </Screen>
  );
}
