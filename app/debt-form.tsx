import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import dayjs from "dayjs";

import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { DateField } from "@/components/ui/DateField";
import { DebtFacade } from "@/store/debt";
import { DEBT_TYPE_META, type DebtCreateModel } from "@/store/debt/model";
import { DebtType } from "@/models/enums";
import { groupThousands, onlyDigits } from "@/lib/format";
import { colors } from "@/theme/colors";

const TYPES = [DebtType.Borrow, DebtType.Lend];

// Maps debt enum values to shared enum-label keys (common.enums.debtType.*).
const DEBT_TYPE_KEY: Record<DebtType, string> = {
  [DebtType.Borrow]: "borrow",
  [DebtType.Lend]: "lend",
};

export default function DebtFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const debt = DebtFacade();

  const [personName, setPersonName] = useState("");
  const [type, setType] = useState<DebtType>(DebtType.Borrow);
  const [totalAmount, setTotalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [hasDueDate, setHasDueDate] = useState(false);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
  });
  const [note, setNote] = useState("");

  const onSave = async () => {
    const total = Number(onlyDigits(totalAmount)) || 0;
    if (!personName.trim() || total <= 0) return;
    const values: DebtCreateModel = {
      personName: personName.trim(),
      type,
      totalAmount: total,
      interestRate: interestRate ? Number(interestRate.replace(",", ".")) : null,
      startDate: dayjs(startDate).format("YYYY-MM-DDTHH:mm:ss"),
      dueDate: hasDueDate ? dayjs(dueDate).format("YYYY-MM-DDTHH:mm:ss") : null,
      note: note.trim() || undefined,
    };
    try {
      await debt.post(values).unwrap();
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
        <Text className="text-lg font-bold text-ink">{t("debts.newTitle")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* type */}
        <Text className="mb-2 ml-1 mt-2 text-sm font-medium text-muted">{t("debts.typeLabel")}</Text>
        <View className="flex-row gap-2">
          {TYPES.map((opt) => {
            const active = type === opt;
            const meta = DEBT_TYPE_META[opt];
            return (
              <Pressable
                key={opt}
                onPress={() => setType(opt)}
                className="flex-1 items-center rounded-2xl py-3"
                style={{
                  backgroundColor: active ? `${meta.color}26` : "rgba(255,255,255,0.06)",
                  borderWidth: active ? 1 : 0,
                  borderColor: meta.color,
                }}
              >
                <Text
                  className="font-semibold"
                  style={{ color: active ? meta.color : colors.muted }}
                >
                  {t("common.enums.debtType." + DEBT_TYPE_KEY[opt])}
                </Text>
                <Text className="mt-0.5 text-[11px] text-muted">
                  {opt === DebtType.Borrow ? t("debts.borrowHint") : t("debts.lendHint")}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-4">
          <Input
            label={type === DebtType.Borrow ? t("debts.creditorLabel") : t("debts.debtorLabel")}
            placeholder={t("debts.personPlaceholder")}
            value={personName}
            onChangeText={setPersonName}
          />
        </View>

        {/* amount */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("common.amount")}</Text>
        <GlassSurface radius={16}>
          <TextInput
            value={groupThousands(totalAmount)}
            onChangeText={(t) => setTotalAmount(onlyDigits(t))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            className="h-14 px-4 text-lg font-semibold text-ink"
          />
        </GlassSurface>

        {/* interest */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">
          {t("debts.interestFieldLabel")}
        </Text>
        <GlassSurface radius={16}>
          <TextInput
            value={interestRate}
            onChangeText={setInterestRate}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            className="h-14 px-4 text-base text-ink"
          />
        </GlassSurface>

        {/* start date */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("debts.startDate")}</Text>
        <DateField value={startDate} onChange={setStartDate} />

        {/* due date */}
        <View className="mb-2 ml-1 mt-4 flex-row items-center justify-between">
          <Text className="text-sm font-medium text-muted">{t("debts.hasDueDate")}</Text>
          <Switch
            value={hasDueDate}
            onValueChange={setHasDueDate}
            trackColor={{ true: colors.primary, false: "rgba(255,255,255,0.15)" }}
            thumbColor="#fff"
          />
        </View>
        {hasDueDate ? (
          <DateField value={dueDate} onChange={setDueDate} />
        ) : null}

        {/* note */}
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
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
        </GlassSurface>

        <View className="mt-8">
          <Button title={t("debts.create")} onPress={onSave} loading={debt.isSubmitting} />
        </View>
      </ScrollView>
    </Screen>
  );
}
