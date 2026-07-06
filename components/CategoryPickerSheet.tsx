import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { CategoryBadge } from "./CategoryBadge";
import type { CategoryViewModel } from "@/store/category/model";
import type { TransactionType } from "@/models/enums";
import { colors } from "@/theme/colors";

interface Props {
  visible: boolean;
  categories: CategoryViewModel[];
  type: TransactionType;
  value?: string;
  onSelect: (category: CategoryViewModel) => void;
  onClose: () => void;
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

/** Bottom-sheet category picker that respects the 2-level parent/child tree. */
export function CategoryPickerSheet({
  visible,
  categories,
  type,
  value,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  // Reset the search each time the sheet is opened.
  useEffect(() => {
    if (visible) setQuery("");
  }, [visible]);

  const { topLevel, childrenOf } = useMemo(() => {
    const ofType = categories.filter((c) => c.type === type);
    const parentIds = new Set(ofType.filter((c) => !c.parentId).map((c) => c.id));
    const topLevel = ofType.filter((c) => !c.parentId || !parentIds.has(c.parentId));
    const childrenOf = (pid?: string) =>
      ofType.filter((c) => c.parentId && c.parentId === pid);
    return { topLevel, childrenOf };
  }, [categories, type]);

  // Filter the tree by the search query while keeping parent/child grouping:
  // a parent block appears if the parent matches or any of its children match;
  // matching parents keep all their children, otherwise only matching children show.
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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable className="flex-1 bg-black/60" onPress={onClose} />
      <View
        style={{ maxHeight: "78%", paddingBottom: insets.bottom + 8 }}
        className="rounded-t-3xl bg-surface"
      >
        <View className="items-center pt-3">
          <View className="h-1.5 w-10 rounded-full bg-white/20" />
        </View>
        <View className="flex-row items-center justify-between px-5 py-3">
          <Text className="text-lg font-bold text-ink">{t("categories.pickTitle")}</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.muted} />
          </Pressable>
        </View>
        {topLevel.length > 0 ? (
          <View className="px-5 pb-2">
            <View className="flex-row items-center gap-2 rounded-2xl bg-white/[0.06] px-3.5">
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
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
          </View>
        ) : null}
        <ScrollView
          className="px-5"
          contentContainerClassName="pb-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>
      </View>
    </Modal>
  );
}
