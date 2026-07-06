import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { FieldError } from "@/components/ui/FieldError";
import { CategoryBadge } from "@/components/CategoryBadge";
import { CategoryPickerSheet } from "@/components/CategoryPickerSheet";
import { BudgetFacade } from "@/store/budget";
import { CategoryFacade } from "@/store/category";
import { TransactionType } from "@/models/enums";
import { groupThousands, onlyDigits } from "@/lib/format";
import { colors } from "@/theme/colors";

export default function BudgetFormScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string; month?: string; year?: string }>();
  const isEdit = !!params.id;
  const budget = BudgetFacade();
  const category = CategoryFacade();

  const existing = useMemo(
    () => budget.pagination?.content.find((b) => b.id === params.id),
    [budget.pagination, params.id],
  );

  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [limit, setLimit] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [errors, setErrors] = useState<{ limit?: string; category?: string }>({});

  const month = existing?.month ?? (Number(params.month) || new Date().getMonth() + 1);
  const year = existing?.year ?? (Number(params.year) || new Date().getFullYear());

  useEffect(() => {
    if (!isEdit) category.get({ page: 1, size: 200, filter: { type: TransactionType.Expense } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEdit && existing) {
      setCategoryId(existing.categoryId);
      setLimit(String(existing.limitAmount ?? ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  const allCategories = category.pagination?.content ?? [];
  const selectedCategory = allCategories.find((c) => c.id === categoryId);

  const onSave = async () => {
    const amount = Number(onlyDigits(limit)) || 0;
    const e: { limit?: string; category?: string } = {};
    if (amount <= 0) e.limit = t("common.validation.amountRequired");
    if (!isEdit && !categoryId) e.category = t("common.validation.categoryRequired");
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    try {
      if (isEdit && params.id) {
        await budget.put(params.id, amount).unwrap();
      } else {
        await budget.post({ categoryId: categoryId!, limitAmount: amount, month, year }).unwrap();
      }
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
          {isEdit ? t("budgets.editTitle") : t("budgets.newTitle")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="my-3 text-center text-sm text-muted">
          {t("common.monthYear", { month, year })}
        </Text>

        {/* limit amount */}
        <GlassSurface
          radius={20}
          className="items-center py-6"
          style={{
            marginBottom: 12,
            ...(errors.limit ? { borderColor: colors.expense, borderWidth: 1 } : {}),
          }}
        >
          <Text className="text-sm text-muted">{t("budgets.limitLabel")}</Text>
          <TextInput
            value={groupThousands(limit)}
            onChangeText={(t) => setLimit(onlyDigits(t))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            className="mt-1 text-center text-4xl font-bold text-ink"
            style={{ minWidth: 160 }}
          />
          <Text className="text-sm text-muted">VND</Text>
        </GlassSurface>
        <FieldError error={errors.limit} />

        {/* category */}
        {isEdit ? (
          <View className="mt-2 flex-row items-center gap-3 rounded-2xl bg-white/[0.06] p-4">
            <CategoryBadge
              icon={existing?.category?.icon}
              color={existing?.category?.color || colors.primary}
              size={42}
            />
            <View className="flex-1">
              <Text className="text-base font-semibold text-ink">
                {existing?.category?.name ?? t("common.category")}
              </Text>
              <Text className="text-xs text-muted">{t("budgets.categoryLocked")}</Text>
            </View>
          </View>
        ) : (
          <>
            <Text className="mb-2 ml-1 mt-2 text-sm font-medium text-muted">
              {t("budgets.expenseCategory")}
            </Text>
            <Pressable onPress={() => setPickerOpen(true)}>
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
                      <Text className="flex-1 text-base text-ink">
                        {selectedCategory.name}
                      </Text>
                    </>
                  ) : (
                    <Text className="flex-1 text-base text-muted">{t("budgets.selectCategory")}</Text>
                  )}
                  <Ionicons name="chevron-down" size={18} color={colors.muted} />
                </View>
              </GlassSurface>
            </Pressable>
            <FieldError error={errors.category} />
          </>
        )}

        <View className="mt-8 gap-3">
          <Button
            title={isEdit ? t("budgets.update") : t("budgets.setBudget")}
            onPress={onSave}
            loading={budget.isSubmitting}
          />
          {isEdit && params.id ? (
            <Button
              title={t("budgets.deleteBudget")}
              variant="danger"
              onPress={async () => {
                try {
                  await budget.delete(params.id!).unwrap();
                  router.back();
                } catch {
                  // toast surfaced by API layer
                }
              }}
            />
          ) : null}
        </View>
      </ScrollView>

      <CategoryPickerSheet
        visible={pickerOpen}
        categories={allCategories}
        type={TransactionType.Expense}
        value={categoryId}
        onSelect={(c) => {
          setCategoryId(c.id);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </Screen>
  );
}
