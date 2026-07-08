import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { FieldError } from "@/components/ui/FieldError";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Screen } from "@/components/ui/Screen";
import { SelectField } from "@/components/ui/SelectField";
import { formatCurrency, groupThousands, onlyDigits } from "@/lib/format";
import { DebtType, WalletType } from "@/models/enums";
import { DebtFacade } from "@/store/debt";
import { WalletFacade } from "@/store/wallet";
import { colors } from "@/theme/colors";

const WALLET_TYPE_KEY: Record<WalletType, string> = {
  [WalletType.Cash]: "cash",
  [WalletType.Bank]: "bank",
  [WalletType.EWallet]: "ewallet",
  [WalletType.Other]: "other",
};

export default function DebtPayScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const debt = DebtFacade();
  const wallet = WalletFacade();
  const activeDebt =
    debt.data && debt.data.id === params.id ? debt.data : undefined;
  const remaining = activeDebt?.remainingAmount ?? 0;
  // Trả nợ (mình đi vay) -> tiền ra ví; Thu nợ (mình cho vay) -> tiền vào ví.
  const isRepay = activeDebt?.type === DebtType.Borrow;

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState("");
  const [walletId, setWalletId] = useState<string | undefined>();
  const [amountError, setAmountError] = useState<string>();

  useEffect(() => {
    wallet.get({ page: 1, size: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wallets = wallet.pagination?.content ?? [];
  const walletOptions = useMemo(
    () =>
      wallets.map((w) => ({
        value: w.id!,
        label: w.name ?? "",
        sublabel: `${t("common.enums.walletType." + WALLET_TYPE_KEY[w.type])} · ${formatCurrency(w.currentBalance, w.currency)}`,
      })),
    [wallets, t],
  );

  const onSave = async () => {
    const value = Number(onlyDigits(amount)) || 0;
    if (value <= 0) {
      setAmountError(t("common.validation.amountRequired"));
      return;
    }
    setAmountError(undefined);
    if (!params.id) return;
    try {
      await debt
        .pay(params.id, {
          amount: value,
          paymentDate: dayjs(date).format("YYYY-MM-DDTHH:mm:ss"),
          note: note.trim() || undefined,
          walletId: walletId || undefined,
        })
        .unwrap();
      router.back();
    } catch {
      // toast surfaced by API layer
    }
  };

  return (
    <Screen orbs={false} className="px-5" edges={["top"]}>
      <View className="mb-3 mt-1 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text className="text-base text-muted">{t("common.cancel")}</Text>
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t("debts.recordPayment")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10" keyboardShouldPersistTaps="handled">
        <GlassSurface
          radius={20}
          className="items-center py-6"
          style={{
            marginVertical: 12,
            ...(amountError ? { borderColor: colors.expense, borderWidth: 1 } : {}),
          }}
        >
          <Text className="text-sm text-muted">{t("debts.payAmount")}</Text>
          <TextInput
            value={groupThousands(amount)}
            onChangeText={(t) => setAmount(onlyDigits(t))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            className="mt-1 text-center text-4xl font-bold text-ink"
            style={{ minWidth: 160 }}
          />
          <Text className="text-sm text-muted">VND</Text>
          <Pressable
            onPress={() => setAmount(String(Math.round(remaining)))}
            className="mt-3 rounded-full bg-glass-light px-4 py-2 active:opacity-70"
          >
            <Text className="text-sm font-medium text-primarySoft">
              {t("debts.payAll", { amount: formatCurrency(remaining) })}
            </Text>
          </Pressable>
        </GlassSurface>
        <FieldError error={amountError} />

        <Text className="mb-2 ml-1 mt-2 text-sm font-medium text-muted">{t("debts.payDate")}</Text>
        <DateField value={date} onChange={setDate} maximumDate={new Date()} />

        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">
          {isRepay ? t("debts.walletLabelRepay") : t("debts.walletLabelCollect")}
        </Text>
        <SelectField
          placeholder={t("debts.selectWallet")}
          title={t("debts.selectWallet")}
          value={walletId}
          options={walletOptions}
          onChange={setWalletId}
          emptyText={t("debts.noWallet")}
        />

        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("common.note")}</Text>
        <GlassSurface radius={16}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t("debts.notePlaceholder")}
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            multiline
            className="px-4 py-3 text-base text-ink"
            style={{ minHeight: 70, textAlignVertical: "top" }}
          />
        </GlassSurface>

        <View className="mt-8">
          <Button title={t("debts.confirmPayment")} onPress={onSave} loading={debt.isSubmitting} />
        </View>
      </ScrollView>
    </Screen>
  );
}
