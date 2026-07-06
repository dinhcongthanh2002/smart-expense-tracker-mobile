import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { PieChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { MonthCalendarReport } from "@/components/MonthCalendarReport";
import { TransactionRow, RowDivider } from "@/components/TransactionRow";
import { StatisticFacade } from "@/store/statistic";
import { TransactionFacade } from "@/store/transaction";
import { GlobalFacade } from "@/store/global";
import { NotificationFacade } from "@/store/notification";
import { formatCurrency, formatCompact, startOfMonthISO, endOfMonthISO } from "@/lib/format";
import { colorForIndex } from "@/lib/ui-helpers";
import { colors, gradients } from "@/theme/colors";

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 11) return "dashboard.greeting.morning";
  if (h < 14) return "dashboard.greeting.noon";
  if (h < 18) return "dashboard.greeting.afternoon";
  return "dashboard.greeting.evening";
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getStatistic, dashboard, isLoading } = StatisticFacade();
  const tx = TransactionFacade();
  const { user } = GlobalFacade();
  const noti = NotificationFacade();
  const [hideBalance, setHideBalance] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("hideBalance").then((v) => setHideBalance(v === "1"));
  }, []);

  const toggleHide = () => {
    const next = !hideBalance;
    setHideBalance(next);
    AsyncStorage.setItem("hideBalance", next ? "1" : "0");
  };

  const money = (v?: number) =>
    hideBalance ? "******" : formatCurrency(v ?? 0);
  const compact = (v?: number) => (hideBalance ? "***" : formatCompact(v ?? 0));

  const refresh = useCallback(() => {
    getStatistic({ startDate: startOfMonthISO(), endDate: endOfMonthISO() });
    tx.get({ page: 1, size: 5, sort: "-transactionDate" });
    noti.getUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(refresh);

  const donut = dashboard?.donutChartCategoryExpense;
  const pieData =
    donut?.amounts?.map((value, i) => ({
      value,
      color: donut.colors?.[i] || colorForIndex(i),
    })) ?? [];
  const recent = tx.pagination?.content ?? [];

  return (
    <Screen className="px-5">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-28"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View className="mb-5 mt-2 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-muted">{t(greetingKey())}</Text>
            <Text className="text-xl font-bold text-ink">
              {user?.userModel?.name ?? t("dashboard.guest")}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/notifications")}
            hitSlop={8}
            className="h-12 w-12 items-center justify-center rounded-full bg-primary/20 active:opacity-70"
          >
            <Ionicons name="notifications" size={22} color={colors.primary} />
            {noti.unreadCount > 0 ? (
              <View className="absolute right-1.5 top-1.5 h-4 min-w-4 items-center justify-center rounded-full bg-expense px-1">
                <Text className="text-[10px] font-bold text-white">
                  {noti.unreadCount > 9 ? "9+" : noti.unreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* Balance card */}
        <View className="overflow-hidden rounded-xl3">
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 20 }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-white/80">{t("dashboard.balanceThisMonth")}</Text>
              <Pressable
                onPress={toggleHide}
                hitSlop={10}
                className="h-8 w-8 items-center justify-center rounded-full bg-white/15 active:opacity-70"
              >
                <Ionicons
                  name={hideBalance ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#fff"
                />
              </Pressable>
            </View>
            <Text className="mt-1 text-4xl font-bold text-white">
              {money(dashboard?.balance)}
            </Text>

            <View className="mt-5 flex-row">
              <View className="flex-1 flex-row items-center gap-2">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <Ionicons name="arrow-down" size={18} color="#fff" />
                </View>
                <View>
                  <Text className="text-xs text-white/70">{t("common.income")}</Text>
                  <Text className="text-base font-semibold text-white">
                    {money(dashboard?.totalIncome)}
                  </Text>
                </View>
              </View>
              <View className="flex-1 flex-row items-center gap-2">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <Ionicons name="arrow-up" size={18} color="#fff" />
                </View>
                <View>
                  <Text className="text-xs text-white/70">{t("common.expense")}</Text>
                  <Text className="text-base font-semibold text-white">
                    {money(dashboard?.totalExpense)}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Spending by category */}
        {pieData.length > 0 && (
          <GlassCard className="p-5" style={{ marginTop: 20 }}>
            <Text className="mb-4 text-lg font-bold text-ink">
              {t("dashboard.spendingByCategory")}
            </Text>
            <View className="flex-row items-center">
              <PieChart
                data={pieData}
                donut
                radius={80}
                innerRadius={52}
                innerCircleColor={colors.surface}
                centerLabelComponent={() => (
                  <View className="items-center">
                    <Text className="text-xs text-muted">{t("dashboard.totalExpense")}</Text>
                    <Text className="text-sm font-bold text-ink">
                      {compact(dashboard?.totalExpense)}
                    </Text>
                  </View>
                )}
              />
              <View className="ml-4 flex-1 gap-2">
                {donut?.categoryNames?.slice(0, 5).map((name, i) => (
                  <View key={name + i} className="flex-row items-center gap-2">
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: donut.colors?.[i] || colorForIndex(i),
                      }}
                    />
                    <Text className="flex-1 text-sm text-muted" numberOfLines={1}>
                      {name}
                    </Text>
                    <Text className="text-sm font-medium text-ink">
                      {donut.percentages?.[i]?.toFixed(0) ?? 0}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </GlassCard>
        )}

        {/* Calendar report */}
        <MonthCalendarReport hidden={hideBalance} />

        {/* Recent transactions */}
        <View className="mb-3 mt-6 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-ink">{t("dashboard.recentTransactions")}</Text>
        </View>
        <GlassSurface radius={24} className="px-4">
          {recent.length === 0 ? (
            <Text className="py-8 text-center text-muted">
              {t("dashboard.noTransactions")}
            </Text>
          ) : (
            recent.map((item, i) => (
              <View key={item.id}>
                <TransactionRow
                  tx={item}
                  onPress={() =>
                    router.push({ pathname: "/transaction-form", params: { id: item.id! } })
                  }
                />
                {i < recent.length - 1 && <RowDivider />}
              </View>
            ))
          )}
        </GlassSurface>
      </ScrollView>
    </Screen>
  );
}
