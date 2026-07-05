import { useCallback } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { PieChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { TransactionRow, RowDivider } from "@/components/TransactionRow";
import { StatisticFacade } from "@/store/statistic";
import { TransactionFacade } from "@/store/transaction";
import { GlobalFacade } from "@/store/global";
import { formatCurrency, formatCompact, startOfMonthISO, endOfMonthISO } from "@/lib/format";
import { colorForIndex } from "@/lib/ui-helpers";
import { colors, gradients } from "@/theme/colors";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export default function DashboardScreen() {
  const router = useRouter();
  const { getStatistic, dashboard, isLoading } = StatisticFacade();
  const tx = TransactionFacade();
  const { user } = GlobalFacade();

  const refresh = useCallback(() => {
    getStatistic({ startDate: startOfMonthISO(), endDate: endOfMonthISO() });
    tx.get({ page: 1, size: 5, sort: "-transactionDate" });
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
            <Text className="text-sm text-muted">{greeting()}</Text>
            <Text className="text-xl font-bold text-ink">
              {user?.userModel?.name ?? "Bạn"}
            </Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
        </View>

        {/* Balance card */}
        <View className="overflow-hidden rounded-xl3">
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 20 }}
          >
            <Text className="text-sm text-white/80">Số dư tháng này</Text>
            <Text className="mt-1 text-4xl font-bold text-white">
              {formatCurrency(dashboard?.balance ?? 0)}
            </Text>

            <View className="mt-5 flex-row">
              <View className="flex-1 flex-row items-center gap-2">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <Ionicons name="arrow-down" size={18} color="#fff" />
                </View>
                <View>
                  <Text className="text-xs text-white/70">Thu nhập</Text>
                  <Text className="text-base font-semibold text-white">
                    {formatCurrency(dashboard?.totalIncome ?? 0)}
                  </Text>
                </View>
              </View>
              <View className="flex-1 flex-row items-center gap-2">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <Ionicons name="arrow-up" size={18} color="#fff" />
                </View>
                <View>
                  <Text className="text-xs text-white/70">Chi tiêu</Text>
                  <Text className="text-base font-semibold text-white">
                    {formatCurrency(dashboard?.totalExpense ?? 0)}
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
              Chi tiêu theo danh mục
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
                    <Text className="text-xs text-muted">Tổng chi</Text>
                    <Text className="text-sm font-bold text-ink">
                      {formatCompact(dashboard?.totalExpense ?? 0)}
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

        {/* Recent transactions */}
        <View className="mb-3 mt-6 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-ink">Giao dịch gần đây</Text>
        </View>
        <GlassSurface radius={24} className="px-4">
          {recent.length === 0 ? (
            <Text className="py-8 text-center text-muted">
              Chưa có giao dịch nào
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
