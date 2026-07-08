import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";

import { DateField } from "@/components/ui/DateField";
import { TransactionType } from "@/models/enums";
import type { CategoryViewModel } from "@/store/category/model";
import { colors } from "@/theme/colors";

const FMT = "YYYY-MM-DD";

export type DatePreset =
  | "all"
  | "today"
  | "7d"
  | "30d"
  | "thisMonth"
  | "lastMonth"
  | "custom";

export interface TxFilter {
  type?: TransactionType;
  categoryId?: string;
  datePreset: DatePreset;
  customFrom: string; // YYYY-MM-DD
  customTo: string; // YYYY-MM-DD
}

/** A fresh, empty filter (dates default to today). */
export const emptyTxFilter = (): TxFilter => ({
  type: undefined,
  categoryId: undefined,
  datePreset: "all",
  customFrom: dayjs().format(FMT),
  customTo: dayjs().format(FMT),
});

/** Resolve a filter's date preset into a concrete `from`/`to` range. */
export function resolveDateRange(f: TxFilter): { from?: string; to?: string } {
  const today = dayjs();
  switch (f.datePreset) {
    case "today":
      return { from: today.format(FMT), to: today.format(FMT) };
    case "7d":
      return { from: today.subtract(6, "day").format(FMT), to: today.format(FMT) };
    case "30d":
      return { from: today.subtract(29, "day").format(FMT), to: today.format(FMT) };
    case "thisMonth":
      return { from: today.startOf("month").format(FMT), to: today.format(FMT) };
    case "lastMonth": {
      const lm = today.subtract(1, "month");
      return { from: lm.startOf("month").format(FMT), to: lm.endOf("month").format(FMT) };
    }
    case "custom":
      return { from: f.customFrom, to: f.customTo };
    default:
      return {};
  }
}

/** How many filter facets are active (type / category / date). */
export function activeFilterCount(f: TxFilter): number {
  return (
    (f.type !== undefined ? 1 : 0) +
    (f.categoryId ? 1 : 0) +
    (f.datePreset !== "all" ? 1 : 0)
  );
}

function Chip({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1.5 rounded-full px-4 py-2.5 ${active ? "bg-primary" : "bg-glass-light"}`}
    >
      {color ? (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      ) : null}
      <Text className={`text-sm font-medium ${active ? "text-white" : "text-muted"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

interface Props {
  visible: boolean;
  value: TxFilter;
  categories: CategoryViewModel[];
  onClose: () => void;
  onApply: (v: TxFilter) => void;
}

export function TransactionFilterSheet({
  visible,
  value,
  categories,
  onClose,
  onApply,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<TxFilter>(value);

  // Re-seed the draft from the applied value each time the sheet opens.
  useEffect(() => {
    if (visible) setDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const typeOptions: { label: string; value?: TransactionType }[] = [
    { label: t("common.all"), value: undefined },
    { label: t("common.enums.txType.expense"), value: TransactionType.Expense },
    { label: t("common.enums.txType.income"), value: TransactionType.Income },
    { label: t("common.enums.txType.transfer"), value: TransactionType.Transfer },
  ];

  const dateOptions: { label: string; value: DatePreset }[] = [
    { label: t("transactions.dateAll"), value: "all" },
    { label: t("transactions.today"), value: "today" },
    { label: t("transactions.last7"), value: "7d" },
    { label: t("transactions.last30"), value: "30d" },
    { label: t("transactions.thisMonth"), value: "thisMonth" },
    { label: t("transactions.lastMonth"), value: "lastMonth" },
    { label: t("transactions.custom"), value: "custom" },
  ];

  // Only expense/income carry categories; transfer & "all" hide the section.
  const categoryPickable =
    draft.type === TransactionType.Expense || draft.type === TransactionType.Income;
  const parentCategories = useMemo(() => {
    if (!categoryPickable) return [];
    return categories.filter((c) => c.type === draft.type && !c.parentId);
  }, [categories, draft.type, categoryPickable]);

  const onPickType = (tp?: TransactionType) =>
    setDraft((d) => ({ ...d, type: tp, categoryId: undefined }));

  const count = activeFilterCount(draft);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable className="flex-1" style={{ backgroundColor: colors.scrim }} onPress={onClose} />
      <View
        style={{ maxHeight: "88%", paddingBottom: insets.bottom + 8 }}
        className="rounded-t-3xl bg-surface"
      >
        <View className="items-center pt-3">
          <View className="h-1.5 w-10 rounded-full bg-glass-light" />
        </View>
        <View className="flex-row items-center justify-between px-5 py-3">
          <Text className="text-lg font-bold text-ink">{t("transactions.filterTitle")}</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.muted} />
          </Pressable>
        </View>

        <ScrollView
          className="px-5"
          contentContainerClassName="pb-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* type */}
          <Text className="mb-2 mt-1 text-sm font-medium text-muted">
            {t("transactions.typeLabel")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {typeOptions.map((o) => (
              <Chip
                key={String(o.value)}
                label={o.label}
                active={draft.type === o.value}
                onPress={() => onPickType(o.value)}
              />
            ))}
          </View>

          {/* category */}
          <Text className="mb-2 mt-5 text-sm font-medium text-muted">
            {t("transactions.categoryLabel")}
          </Text>
          {categoryPickable ? (
            parentCategories.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                <Chip
                  label={t("transactions.allCategories")}
                  active={!draft.categoryId}
                  onPress={() => setDraft((d) => ({ ...d, categoryId: undefined }))}
                />
                {parentCategories.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.name ?? ""}
                    color={c.color || colors.primary}
                    active={draft.categoryId === c.id}
                    onPress={() =>
                      setDraft((d) => ({
                        ...d,
                        categoryId: d.categoryId === c.id ? undefined : c.id,
                      }))
                    }
                  />
                ))}
              </View>
            ) : (
              <Text className="text-sm text-muted">{t("transactions.noCategory")}</Text>
            )
          ) : (
            <Text className="text-sm text-muted">{t("transactions.categoryHint")}</Text>
          )}

          {/* date */}
          <Text className="mb-2 mt-5 text-sm font-medium text-muted">
            {t("transactions.dateLabel")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {dateOptions.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                active={draft.datePreset === o.value}
                onPress={() => setDraft((d) => ({ ...d, datePreset: o.value }))}
              />
            ))}
          </View>

          {draft.datePreset === "custom" ? (
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1">
                <Text className="mb-1 ml-1 text-[11px] text-muted">
                  {t("transactions.fromDate")}
                </Text>
                <DateField
                  value={dayjs(draft.customFrom).toDate()}
                  maximumDate={dayjs(draft.customTo).toDate()}
                  onChange={(d) =>
                    setDraft((s) => ({ ...s, customFrom: dayjs(d).format(FMT) }))
                  }
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1 ml-1 text-[11px] text-muted">
                  {t("transactions.toDate")}
                </Text>
                <DateField
                  value={dayjs(draft.customTo).toDate()}
                  onChange={(d) =>
                    setDraft((s) => ({ ...s, customTo: dayjs(d).format(FMT) }))
                  }
                />
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* footer */}
        <View className="flex-row gap-3 border-t border-glass-border px-5 pt-3">
          <Pressable
            onPress={() => setDraft(emptyTxFilter())}
            className="flex-1 items-center justify-center rounded-2xl border border-glass-border py-3.5 active:opacity-70"
          >
            <Text className="text-base font-semibold text-ink">{t("transactions.reset")}</Text>
          </Pressable>
          <Pressable
            onPress={() => onApply(draft)}
            className="flex-1 items-center justify-center rounded-2xl bg-primary py-3.5 active:opacity-80"
          >
            <Text className="text-base font-semibold text-white">
              {count > 0 ? t("transactions.applyCount", { count }) : t("transactions.apply")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
