import { Ionicons } from "@expo/vector-icons";
import {
    BottomSheetBackdrop,
    BottomSheetFooter,
    BottomSheetModal,
    BottomSheetScrollView,
    type BottomSheetBackdropProps,
    type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import dayjs from "dayjs";
import {
    forwardRef,
    useCallback,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DateField } from "@/components/ui/DateField";
import { useThemePalette } from "@/lib/theme";
import { TransactionType } from "@/models/enums";
import type { CategoryViewModel } from "@/store/category/model";
import { colors } from "@/theme/colors";

const FMT = "YYYY-MM-DD";

// The native tab bar (expo-router NativeTabs) is drawn on top of everything,
// including this sheet's portal — float the sheet above it so the pinned footer
// isn't hidden. iOS UITabBar ≈ 49pt, Android bottom nav ≈ 56pt (+ safe area).
const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 47 : 56;

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

/** Replace a stale/pre-2000 day string (e.g. a "1970-01-01" left over from an
 *  earlier picker bug) with today, so custom ranges never resolve to the epoch. */
const sanitizeDay = (s: string): string => {
  const d = dayjs(s);
  return d.isValid() && d.year() >= 2000 ? s : dayjs().format(FMT);
};

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

export interface TransactionFilterSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface Props {
  value: TxFilter;
  categories: CategoryViewModel[];
  onApply: (v: TxFilter) => void;
  onClose?: () => void;
}

/** Bottom-sheet transaction filter. Controlled imperatively via a ref:
 *  `ref.current?.present()` / `.dismiss()`. */
export const TransactionFilterSheet = forwardRef<TransactionFilterSheetRef, Props>(
  function TransactionFilterSheet({ value, categories, onApply, onClose }, ref) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { scheme } = useThemePalette();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [draft, setDraft] = useState<TxFilter>(value);

  // Keep the latest applied value so present() can re-seed the draft from it.
  const valueRef = useRef(value);
  valueRef.current = value;

  useImperativeHandle(ref, () => ({
    present: () => {
      const v = valueRef.current;
      // Heal any stale custom dates so the range never resolves to 1/1/1970.
      setDraft({
        ...v,
        customFrom: sanitizeDay(v.customFrom),
        customTo: sanitizeDay(v.customTo),
      });
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    [],
  );

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

  const apply = () => {
    sheetRef.current?.dismiss();
    onApply(draft);
  };

  // Pinned footer (reset / apply) that floats above the safe area.
  const renderFooter = (props: BottomSheetFooterProps) => (
    <BottomSheetFooter {...props} bottomInset={0}>
      <View
        className="flex-row gap-3 px-5 pt-3 pb-3 border-t border-glass-border bg-surface"
      >
        <Pressable
          onPress={() => setDraft(emptyTxFilter())}
          className="flex-1 items-center justify-center rounded-2xl border border-glass-border py-3.5 active:opacity-70"
        >
          <Text className="text-base font-semibold text-ink">{t("transactions.reset")}</Text>
        </Pressable>
        <Pressable
          onPress={apply}
          className="flex-1 items-center justify-center rounded-2xl bg-primary py-3.5 active:opacity-80"
        >
          <Text className="text-base font-semibold text-white">
            {count > 0 ? t("transactions.applyCount", { count }) : t("transactions.apply")}
          </Text>
        </Pressable>
      </View>
    </BottomSheetFooter>
  );

  return (
    <BottomSheetModal
      key={scheme}
      ref={sheetRef}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.88}
      // Float the whole sheet above the native tab bar so the pinned footer shows.
      bottomInset={insets.bottom + TAB_BAR_HEIGHT}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.glassBorder }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center justify-between pt-1 pb-2">
          <Text className="text-lg font-bold text-ink">{t("transactions.filterTitle")}</Text>
          <Pressable onPress={() => sheetRef.current?.dismiss()} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.muted} />
          </Pressable>
        </View>

        {/* type */}
        <Text className="mt-1 mb-2 text-sm font-medium text-muted">
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
        <Text className="mt-5 mb-2 text-sm font-medium text-muted">
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
        <Text className="mt-5 mb-2 text-sm font-medium text-muted">
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
          <View className="flex-row gap-2 mt-3">
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
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});
