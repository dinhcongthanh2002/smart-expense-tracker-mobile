import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View, Pressable } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Button } from "@/components/ui/Button";
import { CategoryBadge } from "@/components/CategoryBadge";
import { BudgetFacade } from "@/store/budget";
import type { BudgetInviteViewModel } from "@/store/budget/model";
import { formatCurrency } from "@/lib/format";
import { colors } from "@/theme/colors";

export default function BudgetInvitesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const budget = BudgetFacade();
  // Which invite + action is in flight, so only that button shows a spinner.
  const [acting, setActing] = useState<{ id: string; type: "accept" | "decline" } | null>(null);

  const load = useCallback(() => {
    budget.getInvites();
    budget.getInviteCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  const respond = async (invite: BudgetInviteViewModel, type: "accept" | "decline") => {
    if (!invite.id || acting) return;
    setActing({ id: invite.id, type });
    try {
      if (type === "accept") await budget.acceptInvite(invite.id).unwrap();
      else await budget.declineInvite(invite.id).unwrap();
      load();
    } catch {
      // toast surfaced by API layer
    } finally {
      setActing(null);
    }
  };

  const invites = budget.invites?.content ?? [];

  return (
    <Screen className="px-5">
      <View className="mb-4 mt-1 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="-ml-2 h-10 w-10 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t("budgetInvites.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-28"
        refreshControl={
          <RefreshControl
            refreshing={budget.isInviteLoading}
            onRefresh={load}
            tintColor={colors.primary}
          />
        }
      >
        {invites.length === 0 && !budget.isInviteLoading ? (
          <GlassSurface radius={24} className="mt-8 items-center p-10">
            <Ionicons name="mail-open-outline" size={40} color={colors.muted} />
            <Text className="mt-3 text-muted">{t("budgetInvites.empty")}</Text>
          </GlassSurface>
        ) : (
          invites.map((invite) => {
            const b = invite.budget;
            const busy = acting?.id === invite.id;
            return (
              <GlassSurface key={invite.id} radius={20} className="mb-3 p-4">
                <View className="flex-row items-center gap-3">
                  <CategoryBadge
                    icon={b?.category?.icon}
                    color={b?.category?.color || colors.primary}
                    size={42}
                  />
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                      {b?.category?.name ?? t("budgetInvites.budgetLabel")}
                    </Text>
                    <Text className="mt-0.5 text-xs text-muted">
                      {formatCurrency(b?.limitAmount ?? 0)}
                      {b?.month && b?.year
                        ? ` · ${t("common.monthYear", { month: b.month, year: b.year })}`
                        : ""}
                    </Text>
                    <Text className="mt-1 text-xs text-primarySoft" numberOfLines={1}>
                      {t("budgetInvites.invitedBy", {
                        name: invite.invitedByUserName ?? "",
                      })}
                    </Text>
                  </View>
                </View>

                <View className="mt-3 flex-row gap-3">
                  <View className="flex-1">
                    <Button
                      title={t("budgetInvites.decline")}
                      variant="ghost"
                      onPress={() => respond(invite, "decline")}
                      loading={busy && acting?.type === "decline"}
                      disabled={busy}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      title={t("budgetInvites.accept")}
                      variant="primary"
                      onPress={() => respond(invite, "accept")}
                      loading={busy && acting?.type === "accept"}
                      disabled={busy}
                    />
                  </View>
                </View>
              </GlassSurface>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
