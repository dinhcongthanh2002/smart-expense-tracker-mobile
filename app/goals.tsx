import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { SavingsGoalFacade } from "@/store/savingsGoal";
import type { SavingsGoalViewModel } from "@/store/savingsGoal/model";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatCurrency, formatDate } from "@/lib/format";
import { colors } from "@/theme/colors";

function GoalCard({
  goal,
  onEdit,
  onContribute,
}: {
  goal: SavingsGoalViewModel;
  onEdit: () => void;
  onContribute: () => void;
}) {
  const { t } = useTranslation();
  const color = goal.color || colors.primary;
  const Icon = getCategoryIcon(goal.icon || "piggy-bank");
  const percent = Math.min(goal.progressPercent ?? 0, 100);
  const barColor = goal.isCompleted ? colors.income : color;

  return (
    <Pressable onPress={onEdit} className="active:opacity-70">
      <GlassSurface radius={20} className="mb-3 p-4">
        <View className="flex-row items-center gap-3">
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 15,
              backgroundColor: `${color}26`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon color={color} size={24} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-ink" numberOfLines={1}>
              {goal.name}
            </Text>
            <Text className="mt-0.5 text-xs text-muted">
              {goal.deadline
                ? t("goals.deadline", { date: formatDate(goal.deadline) })
                : t("goals.noDeadline")}
            </Text>
          </View>
          {goal.isCompleted ? (
            <View className="rounded-full bg-income/20 px-2 py-0.5">
              <Text className="text-[11px] font-medium text-income">{t("goals.completed")}</Text>
            </View>
          ) : (
            <Text className="text-sm font-bold" style={{ color: barColor }}>
              {percent}%
            </Text>
          )}
        </View>

        <View className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
          <View style={{ width: `${percent}%`, height: "100%", backgroundColor: barColor }} />
        </View>

        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-xs text-muted">
            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
          </Text>
          {!goal.isCompleted ? (
            <Pressable
              onPress={onContribute}
              className="flex-row items-center gap-1 rounded-full bg-primary/20 px-3 py-1.5 active:opacity-70"
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text className="text-xs font-semibold text-primary">{t("goals.contribute")}</Text>
            </Pressable>
          ) : null}
        </View>
      </GlassSurface>
    </Pressable>
  );
}

export default function GoalsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const goal = SavingsGoalFacade();

  useFocusEffect(
    useCallback(() => {
      goal.get({ page: 1, size: 100 });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const goals = goal.pagination?.content ?? [];
  const totalSaved = goals.reduce((s, g) => s + (g.currentAmount ?? 0), 0);

  return (
    <Screen className="px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-28">
        <View className="mb-4 mt-1 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="-ml-2 h-10 w-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </Pressable>
          <Text className="text-lg font-bold text-ink">{t("goals.title")}</Text>
          <Pressable
            onPress={() => router.push("/goal-form")}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary/20 active:opacity-70"
          >
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <GlassSurface radius={22} className="mb-5 items-center p-5">
          <Text className="text-sm text-muted">{t("goals.totalSaved")}</Text>
          <Text className="mt-1 text-3xl font-bold text-income">
            {formatCurrency(totalSaved)}
          </Text>
          <Text className="mt-1 text-xs text-muted">{t("goals.count", { count: goals.length })}</Text>
        </GlassSurface>

        {goals.length === 0 && !goal.isLoading ? (
          <GlassSurface radius={24} className="items-center p-10">
            <Ionicons name="flag-outline" size={40} color={colors.muted} />
            <Text className="mt-3 text-muted">{t("goals.empty")}</Text>
            <Pressable
              onPress={() => router.push("/goal-form")}
              className="mt-4 rounded-full bg-primary px-5 py-2.5 active:opacity-80"
            >
              <Text className="font-semibold text-white">{t("goals.create")}</Text>
            </Pressable>
          </GlassSurface>
        ) : (
          goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={() => router.push({ pathname: "/goal-form", params: { id: g.id! } })}
              onContribute={() =>
                router.push({ pathname: "/goal-contribute", params: { id: g.id! } })
              }
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
