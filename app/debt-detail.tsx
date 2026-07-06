import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { DebtFacade } from "@/store/debt";
import { DEBT_STATUS_META, DEBT_TYPE_META } from "@/store/debt/model";
import { DebtStatus, DebtType } from "@/models/enums";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatCurrency, formatDate } from "@/lib/format";
import { colors } from "@/theme/colors";

// Maps debt enum values to shared enum-label keys (common.enums.*).
const DEBT_TYPE_KEY: Record<DebtType, string> = {
  [DebtType.Borrow]: "borrow",
  [DebtType.Lend]: "lend",
};
const DEBT_STATUS_KEY: Record<DebtStatus, string> = {
  [DebtStatus.Active]: "active",
  [DebtStatus.Paid]: "paid",
  [DebtStatus.Overdue]: "overdue",
};

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <View className="flex-row items-center justify-between py-2.5">
      <Text className="text-muted">{label}</Text>
      <Text className="font-medium text-ink">{value || "—"}</Text>
    </View>
  );
}

export default function DebtDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const debt = DebtFacade();

  useFocusEffect(
    useCallback(() => {
      if (params.id) debt.getById(params.id);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]),
  );

  const d = debt.data;
  if (!d || d.id !== params.id) {
    return (
      <Screen className="items-center justify-center px-5">
        <Text className="text-muted">{t("common.loading")}</Text>
      </Screen>
    );
  }

  const meta = DEBT_TYPE_META[d.type];
  const status = DEBT_STATUS_META[d.status];
  const Icon = getCategoryIcon(meta.icon);
  const paid = Math.max(d.totalAmount - d.remainingAmount, 0);
  const payments = d.debtTransactions ?? [];

  const onDelete = () => {
    Alert.alert(t("debts.deleteTitle"), t("debts.deleteMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await debt.delete(params.id!).unwrap();
            router.back();
          } catch {
            // toast surfaced by API layer
          }
        },
      },
    ]);
  };

  return (
    <Screen className="px-5">
      <View className="mb-3 mt-1 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="-ml-2 h-10 w-10 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t("debts.detailTitle")}</Text>
        <Pressable onPress={onDelete} hitSlop={10} className="h-10 w-10 items-center justify-center">
          <Ionicons name="trash-outline" size={22} color={colors.expense} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-28">
        {/* summary */}
        <GlassSurface radius={24} className="items-center p-6">
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 20,
              backgroundColor: `${meta.color}26`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon color={meta.color} size={30} strokeWidth={2} />
          </View>
          <Text className="mt-3 text-xl font-bold text-ink">{d.personName}</Text>
          <Text className="text-sm text-muted">{t("common.enums.debtType." + DEBT_TYPE_KEY[d.type])}</Text>
          <Text className="mt-3 text-sm text-muted">{t("debts.remaining")}</Text>
          <Text className="text-3xl font-bold" style={{ color: meta.color }}>
            {formatCurrency(d.remainingAmount)}
          </Text>
          <View
            className="mt-2 rounded-full px-3 py-1"
            style={{ backgroundColor: `${status.color}22` }}
          >
            <Text className="text-xs font-semibold" style={{ color: status.color }}>
              {t("common.enums.debtStatus." + DEBT_STATUS_KEY[d.status])}
            </Text>
          </View>
        </GlassSurface>

        {/* info */}
        <GlassSurface radius={22} className="px-5 py-2" style={{ marginTop: 16 }}>
          <InfoRow label={t("debts.totalAmount")} value={formatCurrency(d.totalAmount)} />
          <InfoRow label={t("debts.paid")} value={formatCurrency(paid)} />
          {d.interestRate ? (
            <InfoRow label={t("debts.interestLabel")} value={t("debts.interestValue", { rate: d.interestRate })} />
          ) : null}
          <InfoRow label={t("debts.startDate")} value={formatDate(d.startDate)} />
          {d.dueDate ? <InfoRow label={t("debts.dueDate")} value={formatDate(d.dueDate)} /> : null}
          {d.note ? <InfoRow label={t("common.note")} value={d.note} /> : null}
        </GlassSurface>

        {/* pay button */}
        {d.status !== DebtStatus.Paid && d.remainingAmount > 0 ? (
          <View className="mt-5">
            <Button
              title={t("debts.recordPayment")}
              leftIcon={<Ionicons name="cash-outline" size={20} color="#fff" />}
              onPress={() =>
                router.push({ pathname: "/debt-pay", params: { id: d.id! } })
              }
            />
          </View>
        ) : null}

        {/* payment history */}
        <Text className="mb-2 ml-1 mt-6 text-base font-bold text-ink">
          {t("debts.paymentHistory")}
        </Text>
        {payments.length === 0 ? (
          <GlassSurface radius={20} className="items-center p-8">
            <Text className="text-muted">{t("debts.noPayments")}</Text>
          </GlassSurface>
        ) : (
          <GlassSurface radius={20} className="px-4">
            {payments.map((p, i) => (
              <View
                key={p.id ?? i}
                className={i > 0 ? "border-t border-white/[0.05]" : ""}
              >
                <View className="flex-row items-center justify-between py-3">
                  <View>
                    <Text className="font-semibold text-ink">
                      {formatCurrency(p.amount)}
                    </Text>
                    <Text className="mt-0.5 text-xs text-muted">
                      {formatDate(p.paymentDate)}
                      {p.note ? ` · ${p.note}` : ""}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted">
                    {formatCurrency(p.beforeAmount)} → {formatCurrency(p.afterAmount)}
                  </Text>
                </View>
              </View>
            ))}
          </GlassSurface>
        )}
      </ScrollView>
    </Screen>
  );
}
