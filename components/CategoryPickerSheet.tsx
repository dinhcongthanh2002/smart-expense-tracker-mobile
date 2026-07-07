import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";

import { CategoryBadge } from "./CategoryBadge";
import type { CategoryViewModel } from "@/store/category/model";
import type { TransactionType } from "@/models/enums";
import { colors } from "@/theme/colors";

export interface CategoryPickerSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface Props {
  categories: CategoryViewModel[];
  type: TransactionType;
  value?: string;
  onSelect: (category: CategoryViewModel) => void;
  onClose?: () => void;
  /** When provided, shows a "create new category" row at the top of the list. */
  onCreate?: () => void;
}

function Row({
  category,
  selected,
  child,
  onPress,
}: {
  category: CategoryViewModel;
  selected: boolean;
  child?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 py-2.5 active:opacity-60 ${child ? "pl-6" : ""}`}
    >
      <CategoryBadge
        icon={category.icon}
        color={category.color || colors.primary}
        size={child ? 36 : 42}
      />
      <Text
        className={`flex-1 text-ink ${child ? "text-[15px]" : "text-base font-semibold"}`}
        numberOfLines={1}
      >
        {category.name}
      </Text>
      {selected ? (
        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
      ) : null}
    </Pressable>
  );
}

/** Bottom-sheet category picker that respects the 2-level parent/child tree.
 *  Controlled imperatively via a ref: `ref.current?.present()` / `.dismiss()`. */
export const CategoryPickerSheet = forwardRef<CategoryPickerSheetRef, Props>(
  function CategoryPickerSheet({ categories, type, value, onSelect, onClose, onCreate }, ref) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const { height } = useWindowDimensions();
  const [query, setQuery] = useState("");

  useImperativeHandle(ref, () => ({
    present: () => {
      setQuery("");
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

  const { topLevel, childrenOf } = useMemo(() => {
    const ofType = categories.filter((c) => c.type === type);
    const parentIds = new Set(ofType.filter((c) => !c.parentId).map((c) => c.id));
    const topLevel = ofType.filter((c) => !c.parentId || !parentIds.has(c.parentId));
    const childrenOf = (pid?: string) =>
      ofType.filter((c) => c.parentId && c.parentId === pid);
    return { topLevel, childrenOf };
  }, [categories, type]);

  // Filter the tree by the search query while keeping parent/child grouping.
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return topLevel
      .map((parent) => {
        const children = childrenOf(parent.id);
        if (!q) return { parent, children };
        const parentMatch = (parent.name ?? "").toLowerCase().includes(q);
        const matchedChildren = children.filter((c) =>
          (c.name ?? "").toLowerCase().includes(q),
        );
        if (parentMatch) return { parent, children };
        if (matchedChildren.length > 0) return { parent, children: matchedChildren };
        return null;
      })
      .filter((g): g is { parent: CategoryViewModel; children: CategoryViewModel[] } => g !== null);
  }, [topLevel, childrenOf, query]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.85}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.25)" }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between pb-2 pt-1">
          <Text className="text-lg font-bold text-ink">{t("categories.pickTitle")}</Text>
          <Pressable onPress={() => sheetRef.current?.dismiss()} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.muted} />
          </Pressable>
        </View>
        {topLevel.length > 0 ? (
          <View className="mb-1 flex-row items-center gap-2 rounded-2xl bg-white/[0.06] px-3.5">
            <Ionicons name="search" size={18} color={colors.muted} />
            <BottomSheetTextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("categories.pickSearch")}
              placeholderTextColor={colors.muted}
              className="flex-1 py-3 text-base text-ink"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {onCreate ? (
            <Pressable
              onPress={onCreate}
              className="mb-1 flex-row items-center gap-3 border-b border-white/[0.05] py-3 active:opacity-60"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <Ionicons name="add" size={22} color={colors.primary} />
              </View>
              <Text className="flex-1 text-base font-semibold text-primary">
                {t("categories.createNew")}
              </Text>
            </Pressable>
          ) : null}
          {topLevel.length === 0 ? (
            <Text className="py-8 text-center text-muted">
              {t("categories.pickEmpty")}
            </Text>
          ) : groups.length === 0 ? (
            <Text className="py-8 text-center text-muted">
              {t("categories.pickNoResult")}
            </Text>
          ) : (
            groups.map(({ parent, children }) => (
              <View key={parent.id} className="border-b border-white/[0.05] py-1">
                <Row
                  category={parent}
                  selected={value === parent.id}
                  onPress={() => onSelect(parent)}
                />
                {children.map((child) => (
                  <Row
                    key={child.id}
                    category={child}
                    child
                    selected={value === child.id}
                    onPress={() => onSelect(child)}
                  />
                ))}
              </View>
            ))
          )}
        </BottomSheetScrollView>
    </BottomSheetModal>
  );
});
