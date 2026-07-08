import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";

import { CategoryBadge } from "@/components/CategoryBadge";
import {
    CategoryPickerSheet,
    type CategoryPickerSheetRef,
} from "@/components/CategoryPickerSheet";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { FieldError } from "@/components/ui/FieldError";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Screen } from "@/components/ui/Screen";
import { SelectField } from "@/components/ui/SelectField";
import { groupThousands, onlyDigits } from "@/lib/format";
import { RecurringFrequency, TransactionType, WalletType } from "@/models/enums";
import { CategoryFacade } from "@/store/category";
import { RecurringFacade } from "@/store/recurring";
import { FREQUENCIES, type RecurringUpsertModel } from "@/store/recurring/model";
import { WalletFacade } from "@/store/wallet";
import { colors } from "@/theme/colors";

const FREQUENCY_KEY: Record<RecurringFrequency, string> = {
  [RecurringFrequency.Daily]: "daily",
  [RecurringFrequency.Weekly]: "weekly",
  [RecurringFrequency.Monthly]: "monthly",
  [RecurringFrequency.Yearly]: "yearly",
};

const WALLET_TYPE_KEY: Record<WalletType, string> = {
  [WalletType.Cash]: "cash",
  [WalletType.Bank]: "bank",
  [WalletType.EWallet]: "ewallet",
  [WalletType.Other]: "other",
};

export default function RecurringFormScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;
  const category = CategoryFacade();
  const wallet = WalletFacade();
  const rec = RecurringFacade();

  const [type, setType] = useState<TransactionType>(TransactionType.Expense);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [walletId, setWalletId] = useState<string | undefined>();
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>(RecurringFrequency.Monthly);
  const [startDate, setStartDate] = useState(new Date());
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d;
  });
  const [note, setNote] = useState("");
  const [isActive, setIsActive] = useState(true);
  const pickerRef = useRef<CategoryPickerSheetRef>(null);
  const [errors, setErrors] = useState<{ amount?: string; category?: string }>({});

  const TYPE_TABS = [
    { label: t("common.enums.txType.expense"), value: TransactionType.Expense },
    { label: t("common.enums.txType.income"), value: TransactionType.Income },
  ];

  useEffect(() => {
    category.get({ page: 1, size: 200 });
    wallet.get({ page: 1, size: 100 });
    if (params.id) rec.getById(params.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    const r = rec.data;
    if (isEdit && r && r.id === params.id) {
      setType(r.type);
      setCategoryId(r.categoryId);
      setWalletId(r.walletId ?? undefined);
      setAmount(String(r.amount ?? ""));
      setFrequency(r.frequency);
      if (r.startDate) setStartDate(new Date(r.startDate));
      if (r.endDate) {
        setHasEndDate(true);
        setEndDate(new Date(r.endDate));
      }
      setNote(r.note ?? "");
      setIsActive(r.isActive);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.data]);

  const categories = category.pagination?.content ?? [];
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const walletOptions = useMemo(
    () =>
      (wallet.pagination?.content ?? []).map((w) => ({
        value: w.id!,
        label: w.name ?? "",
        sublabel: `${t("common.enums.walletType." + WALLET_TYPE_KEY[w.type])} · ${w.currency}`,
      })),
    [wallet.pagination, t],
  );

  const onSave = async () => {
    const value = Number(onlyDigits(amount)) || 0;
    const e: { amount?: string; category?: string } = {};
    if (value <= 0) e.amount = t("common.validation.amountRequired");
    if (!categoryId) e.category = t("common.validation.categoryRequired");
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const values: RecurringUpsertModel = {
      categoryId: categoryId!,
      walletId: walletId ?? null,
      amount: value,
      type,
      note: note.trim() || undefined,
      frequency,
      startDate: dayjs(startDate).format("YYYY-MM-DDTHH:mm:ss"),
      endDate: hasEndDate ? dayjs(endDate).format("YYYY-MM-DDTHH:mm:ss") : null,
      isActive,
    };
    try {
      if (isEdit && params.id) {
        await rec.put({ id: params.id, ...values }).unwrap();
      } else {
        await rec.post(values).unwrap();
      }
      router.back();
    } catch {
      // toast surfaced by API layer
    }
  };

  const onDelete = async () => {
    if (!params.id) return;
    try {
      await rec.delete(params.id).unwrap();
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
        <Text className="text-lg font-bold text-ink">
          {isEdit ? t("recurring.editTitle") : t("recurring.newTitle")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* type */}
        <GlassSurface radius={16} className="my-3 flex-row p-1">
          {TYPE_TABS.map((tab) => {
            const active = type === tab.value;
            return (
              <Pressable
                key={tab.value}
                onPress={() => {
                  setType(tab.value);
                  setCategoryId(undefined);
                }}
                className={`flex-1 items-center rounded-xl py-2.5 ${active ? "bg-primary" : ""}`}
              >
                <Text className={`font-semibold ${active ? "text-white" : "text-muted"}`}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </GlassSurface>

        {/* amount */}
        <GlassSurface
          radius={20}
          className="my-2 items-center py-6"
          style={errors.amount ? { borderColor: colors.expense, borderWidth: 1 } : undefined}
        >
          <Text className="text-sm text-muted">{t("common.amount")}</Text>
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
        </GlassSurface>
        <FieldError error={errors.amount} />

        {/* category */}
        <Text className="mb-2 ml-1 mt-2 text-sm font-medium text-muted">{t("common.category")}</Text>
        <Pressable onPress={() => pickerRef.current?.present()}>
          <GlassSurface
            radius={16}
            style={errors.category ? { borderColor: colors.expense, borderWidth: 1 } : undefined}
          >
            <View className="h-14 flex-row items-center gap-3 px-4">
              {selectedCategory ? (
                <>
                  <CategoryBadge
                    icon={selectedCategory.icon}
                    color={selectedCategory.color || colors.primary}
                    size={34}
                  />
                  <Text className="flex-1 text-base text-ink">{selectedCategory.name}</Text>
                </>
              ) : (
                <Text className="flex-1 text-base text-muted">{t("recurring.selectCategory")}</Text>
              )}
              <Ionicons name="chevron-down" size={18} color={colors.muted} />
            </View>
          </GlassSurface>
        </Pressable>
        <FieldError error={errors.category} />

        {/* wallet */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("recurring.walletOptional")}</Text>
        <SelectField
          placeholder={t("recurring.selectWallet")}
          title={t("recurring.selectWallet")}
          value={walletId}
          options={walletOptions}
          onChange={setWalletId}
          emptyText={t("recurring.noWallet")}
        />

        {/* frequency */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("recurring.frequency")}</Text>
        <View className="flex-row flex-wrap gap-2">
          {FREQUENCIES.map((f) => {
            const active = frequency === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFrequency(f)}
                className={`rounded-full px-4 py-2.5 ${active ? "bg-primary" : "bg-glass-light"}`}
              >
                <Text className={active ? "font-semibold text-white" : "text-muted"}>
                  {t("common.enums.frequency." + FREQUENCY_KEY[f])}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* start date */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("recurring.startDate")}</Text>
        <DateField value={startDate} onChange={setStartDate} />

        {/* end date */}
        <View className="mb-2 ml-1 mt-4 flex-row items-center justify-between">
          <Text className="text-sm font-medium text-muted">{t("recurring.hasEndDate")}</Text>
          <Switch
            value={hasEndDate}
            onValueChange={setHasEndDate}
            trackColor={{ true: colors.primary, false: "rgba(255,255,255,0.15)" }}
            thumbColor="#fff"
          />
        </View>
        {hasEndDate ? <DateField value={endDate} onChange={setEndDate} /> : null}

        {/* active */}
        <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-glass-light px-4 py-3">
          <View>
            <Text className="font-medium text-ink">{t("recurring.activeTitle")}</Text>
            <Text className="text-xs text-muted">{t("recurring.activeHint")}</Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ true: colors.income, false: "rgba(255,255,255,0.15)" }}
            thumbColor="#fff"
          />
        </View>

        {/* note */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("common.note")}</Text>
        <GlassSurface radius={16}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t("recurring.notePlaceholder")}
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            multiline
            className="px-4 py-3 text-base text-ink"
            style={{ minHeight: 70, textAlignVertical: "top" }}
          />
        </GlassSurface>

        <View className="mt-8 gap-3">
          <Button
            title={isEdit ? t("recurring.update") : t("recurring.create")}
            onPress={onSave}
            loading={rec.isSubmitting}
          />
          {isEdit && <Button title={t("recurring.deleteRecurring")} variant="danger" onPress={onDelete} />}
        </View>
      </ScrollView>

      <CategoryPickerSheet
        ref={pickerRef}
        categories={categories}
        type={type}
        value={categoryId}
        onSelect={(c) => {
          setCategoryId(c.id);
          pickerRef.current?.dismiss();
        }}
      />
    </Screen>
  );
}
