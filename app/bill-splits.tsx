import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { BillSplitFacade } from "@/store/billSplit";
import { formatCurrency, formatDate } from "@/lib/format";
import { colors } from "@/theme/colors";

export default function BillSplitsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const bill = BillSplitFacade();

  useFocusEffect(
    useCallback(() => {
      bill.get({ page: 1, size: 100 });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const items = bill.pagination?.content ?? [];

  return (
    <Screen className="px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-28">
        <View className="mb-4 mt-1 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} hitSlop={10} className="-ml-2 h-10 w-10 items-center justify-center">
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </Pressable>
          <Text className="text-lg font-bold text-ink">{t("billSplit.title")}</Text>
          <Pressable
            onPress={() => router.push("/bill-split-form")}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary/20 active:opacity-70"
          >
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {items.length === 0 && !bill.isLoading ? (
          <GlassSurface radius={24} className="items-center p-10" style={{ marginTop: 8 }}>
            <Ionicons name="people-outline" size={40} color={colors.muted} />
            <Text className="mt-3 text-center text-muted">{t("billSplit.empty")}</Text>
            <Pressable
              onPress={() => router.push("/bill-split-form")}
              className="mt-4 rounded-full bg-primary px-5 py-2.5 active:opacity-80"
            >
              <Text className="font-semibold text-white">{t("billSplit.add")}</Text>
            </Pressable>
          </GlassSurface>
        ) : (
          items.map((b) => {
            const others = (b.participants ?? []).filter((p) => !p.isOwner);
            const settled = others.filter((p) => p.isSettled).length;
            const allSettled = others.length > 0 && settled === others.length;
            return (
              <Pressable
                key={b.id}
                onPress={() => router.push({ pathname: "/bill-split-form", params: { id: b.id! } })}
                className="active:opacity-70"
              >
                <GlassSurface radius={20} className="p-4" style={{ marginBottom: 12 }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-base font-semibold text-ink" numberOfLines={1}>
                      {b.title}
                    </Text>
                    <Text className="text-base font-bold text-ink">
                      {formatCurrency(b.totalAmount)}
                    </Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-muted">{formatDate(b.date)}</Text>
                    {allSettled ? (
                      <Text className="text-xs font-semibold text-primary">
                        {t("billSplit.allSettled")}
                      </Text>
                    ) : (
                      <Text className="text-xs font-semibold text-expense">
                        {t("billSplit.owedToYou")}: {formatCurrency(b.owedToYou)}
                      </Text>
                    )}
                  </View>
                  {others.length > 0 ? (
                    <Text className="mt-1 text-[11px] text-muted">
                      {t("billSplit.settledCount", { settled, total: others.length })}
                    </Text>
                  ) : null}
                </GlassSurface>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
