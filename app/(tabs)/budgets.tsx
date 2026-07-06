import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Button } from "@/components/ui/Button";
import { CategoryBadge } from "@/components/CategoryBadge";
import { BudgetFacade } from "@/store/budget";
import type { BudgetViewModel } from "@/store/budget/model";
import { formatCurrency } from "@/lib/format";
import { colors } from "@/theme/colors";

function progressColor(percent: number) {
  if (percent >= 100) return colors.expense;
  if (percent >= 80) return colors.warning;
  return colors.income;
}

export default function BudgetsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const budget = BudgetFacade();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [shareTarget, setShareTarget] = useState<BudgetViewModel | null>(null);
  const [shareUserName, setShareUserName] = useState("");
  const [unsharingId, setUnsharingId] = useState<string | null>(null);

  const openShare = (b: BudgetViewModel) => {
    setShareUserName("");
    setShareTarget(b);
  };
  const closeShare = () => {
    setShareTarget(null);
    setShareUserName("");
    setUnsharingId(null);
  };

  const doUnshare = async (userId: string) => {
    if (!shareTarget?.id) return;
    setUnsharingId(userId);
    try {
      await budget.unshare(shareTarget.id, userId).unwrap();
      load(month, year);
    } catch {
      // toast surfaced by API layer
    } finally {
      setUnsharingId(null);
    }
  };

  const doShare = async () => {
    if (!shareTarget?.id || !shareUserName.trim()) return;
    try {
      await budget.share(shareTarget.id, shareUserName.trim()).unwrap();
      closeShare();
      load(month, year);
    } catch {
      // toast surfaced by API layer
    }
  };

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
  const liveTarget = shareTarget
    ? budgets.find((b) => b.id === shareTarget.id) ?? shareTarget
    : null;
  const sharedIds = liveTarget?.sharedWithUserIds ?? [];
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
          <Text className="text-2xl font-bold text-ink">{t("budgets.title")}</Text>
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
            {t("common.monthYear", { month, year })}
          </Text>
          <Pressable onPress={() => shift(1)} hitSlop={8} className="h-9 w-9 items-center justify-center">
            <Ionicons name="chevron-forward" size={22} color={colors.ink} />
          </Pressable>
        </View>

        {/* summary */}
        <GlassSurface radius={22} className="flex-row p-5" style={{ marginBottom: 20 }}>
          <View className="flex-1">
            <Text className="text-xs text-muted">{t("budgets.spent")}</Text>
            <Text className="mt-1 text-lg font-bold text-expense">
              {formatCurrency(totalSpent)}
            </Text>
          </View>
          <View className="flex-1 items-end">
            <Text className="text-xs text-muted">{t("budgets.budgetLabel")}</Text>
            <Text className="mt-1 text-lg font-bold text-ink">
              {formatCurrency(totalLimit)}
            </Text>
          </View>
        </GlassSurface>

        {items.length === 0 && !budget.isLoading ? (
          <GlassSurface radius={24} className="items-center p-10">
            <Ionicons name="pie-chart-outline" size={40} color={colors.muted} />
            <Text className="mt-3 text-muted">{t("budgets.empty")}</Text>
            <Pressable
              onPress={() => router.push({ pathname: "/budget-form", params: { month: String(month), year: String(year) } })}
              className="mt-4 rounded-full bg-primary px-5 py-2.5 active:opacity-80"
            >
              <Text className="font-semibold text-white">{t("budgets.setBudget")}</Text>
            </Pressable>
          </GlassSurface>
        ) : (
          items.map(({ b, spent, limit, percent, remaining }) => {
            const barColor = progressColor(percent);
            const shared = b.sharedWithUserIds?.length ?? 0;
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
                        {b.category?.name ?? t("common.category")}
                      </Text>
                      <View className="mt-0.5 flex-row items-center gap-2">
                        <Text className="text-xs text-muted">
                          {formatCurrency(spent)} / {formatCurrency(limit)}
                        </Text>
                        {shared > 0 ? (
                          <View className="flex-row items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5">
                            <Ionicons name="people" size={11} color={colors.primarySoft} />
                            <Text className="text-[10px] font-medium text-primarySoft">
                              {shared}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <Text className="text-sm font-bold" style={{ color: barColor }}>
                      {percent}%
                    </Text>
                    <Pressable
                      onPress={() => openShare(b)}
                      hitSlop={8}
                      className="ml-2 h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] active:opacity-70"
                    >
                      <Ionicons
                        name="share-social-outline"
                        size={16}
                        color={colors.primarySoft}
                      />
                    </Pressable>
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
                      ? t("budgets.over", { amount: formatCurrency(-remaining) })
                      : t("budgets.remaining", { amount: formatCurrency(remaining) })}
                  </Text>
                </GlassSurface>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* share sheet */}
      <Modal
        visible={!!shareTarget}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeShare}
      >
        <View className="flex-1">
          <Pressable className="flex-1 bg-black/60" onPress={closeShare} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View
              style={{ paddingBottom: insets.bottom + 16 }}
              className="rounded-t-3xl bg-surface px-5 pb-4"
            >
              <View className="items-center pb-2 pt-3">
                <View className="h-1.5 w-10 rounded-full bg-white/20" />
              </View>
              <View className="flex-row items-center justify-between pt-1">
                <Text className="text-lg font-bold text-ink">{t("budgets.shareTitle")}</Text>
                <Pressable onPress={closeShare} hitSlop={10}>
                  <Ionicons name="close" size={24} color={colors.muted} />
                </Pressable>
              </View>
              <Text className="mt-2 text-sm text-muted">
                {t("budgets.shareDescBefore")}
                <Text className="font-semibold text-ink">
                  {shareTarget?.category?.name}
                </Text>
                {t("budgets.shareDescAfter")}
              </Text>
              <GlassSurface radius={16} className="mt-4">
                <View className="h-14 flex-row items-center px-4">
                  <Ionicons name="person-outline" size={18} color={colors.muted} />
                  <TextInput
                    value={shareUserName}
                    onChangeText={setShareUserName}
                    placeholder={t("budgets.usernamePlaceholder")}
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor={colors.primary}
                    className="ml-2 flex-1 text-base text-ink"
                    onSubmitEditing={doShare}
                    returnKeyType="done"
                  />
                </View>
              </GlassSurface>

              {sharedIds.length > 0 ? (
                <View className="mt-5">
                  <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    {t("budgets.sharedWith", { count: sharedIds.length })}
                  </Text>
                  <ScrollView
                    style={{ maxHeight: 180 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerClassName="gap-2"
                    keyboardShouldPersistTaps="handled"
                  >
                    {sharedIds.map((uid) => (
                      <View
                        key={uid}
                        className="flex-row items-center gap-3 rounded-2xl bg-white/[0.06] px-3 py-2.5"
                      >
                        <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                          <Ionicons name="person" size={16} color={colors.primary} />
                        </View>
                        <Text className="flex-1 text-sm text-ink" numberOfLines={1}>
                          {t("budgets.userLabel", { id: uid.slice(-6) })}
                        </Text>
                        {unsharingId === uid ? (
                          <ActivityIndicator size="small" color={colors.muted} />
                        ) : (
                          <Pressable
                            onPress={() => doUnshare(uid)}
                            hitSlop={8}
                            className="h-8 w-8 items-center justify-center rounded-full bg-expense/15 active:opacity-70"
                          >
                            <Ionicons name="close" size={16} color={colors.expense} />
                          </Pressable>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              <View className="mt-4">
                <Button title={t("budgets.shareButton")} onPress={doShare} loading={budget.isSubmitting} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </Screen>
  );
}
