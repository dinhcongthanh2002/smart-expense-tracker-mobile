import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Screen } from "@/components/ui/Screen";
import { SelectField } from "@/components/ui/SelectField";
import { formatCurrency, groupThousands, onlyDigits } from "@/lib/format";
import { SavingsGoalFacade } from "@/store/savingsGoal";
import { WalletFacade } from "@/store/wallet";
import { colors } from "@/theme/colors";

export default function GoalContributeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const facade = SavingsGoalFacade();
  const goal =
    facade.data && facade.data.id === params.id ? facade.data : undefined;
  const remaining = goal
    ? Math.max(goal.targetAmount - goal.currentAmount, 0)
    : 0;

  const wallet = WalletFacade();
  const wallets = wallet.pagination?.content ?? [];

  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string>();
  const [walletId, setWalletId] = useState<string | undefined>();
  const [walletError, setWalletError] = useState<string>();

  useEffect(() => {
    wallet.get({ page: 1, size: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-select the default wallet once loaded.
  useEffect(() => {
    if (!walletId && wallets.length > 0)
      setWalletId((wallets.find((w) => w.isDefault) ?? wallets[0]).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.pagination]);

  const walletOptions = useMemo(
    () =>
      wallets.map((w) => ({
        value: w.id!,
        label: w.name ?? "",
        sublabel: formatCurrency(w.currentBalance, w.currency),
      })),
    [wallets],
  );

  const onSave = async () => {
    const value = Number(onlyDigits(amount)) || 0;
    let ok = true;
    if (value <= 0) {
      setAmountError(t("common.validation.amountRequired"));
      ok = false;
    } else setAmountError(undefined);
    if (!walletId) {
      setWalletError(t("goals.walletRequired"));
      ok = false;
    } else setWalletError(undefined);
    if (!ok || !params.id) return;
    try {
      await facade.contribute(params.id, value, walletId).unwrap();
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
        <Text className="text-lg font-bold text-ink">{t("goals.contribute")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled"
      >
        {goal ? (
          <Text className="my-3 text-center text-sm text-muted">
            {goal.name} · {t("goals.remaining", { amount: formatCurrency(remaining) })}
          </Text>
        ) : null}

        <GlassSurface
          radius={20}
          className="my-2 items-center py-6"
          style={amountError ? { borderColor: colors.expense, borderWidth: 1 } : undefined}
        >
          <Text className="text-sm text-muted">{t("goals.contributeAmount")}</Text>
          <TextInput
            value={groupThousands(amount)}
            onChangeText={(v) => setAmount(onlyDigits(v))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            className="mt-1 text-center text-4xl font-bold text-ink"
            style={{ minWidth: 160 }}
          />
          <Text className="text-sm text-muted">VND</Text>
          {remaining > 0 ? (
            <Pressable
              onPress={() => setAmount(String(Math.round(remaining)))}
              className="mt-3 rounded-full bg-glass-light px-4 py-2 active:opacity-70"
            >
              <Text className="text-sm font-medium text-primarySoft">
                {t("goals.contributeFull", { amount: formatCurrency(remaining) })}
              </Text>
            </Pressable>
          ) : null}
        </GlassSurface>
        <FieldError error={amountError} />

        {/* Nguồn tiền: trừ từ ví này (tạo giao dịch Chuyển khoản) */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">
          {t("goals.fromWallet")}
        </Text>
        <SelectField
          placeholder={t("goals.selectWallet")}
          title={t("goals.selectWallet")}
          value={walletId}
          options={walletOptions}
          onChange={setWalletId}
          allowClear={false}
          emptyText={t("goals.noWallet")}
        />
        <FieldError error={walletError} />

        <View className="mt-6">
          <Button title={t("goals.confirmContribute")} onPress={onSave} loading={facade.isSubmitting} />
        </View>
      </ScrollView>
    </Screen>
  );
}
