import { useMemo } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
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
  const insets = useSafeAreaInsets();

  const { topLevel, childrenOf } = useMemo(() => {
    const ofType = categories.filter((c) => c.type === type);
    const parentIds = new Set(ofType.filter((c) => !c.parentId).map((c) => c.id));
    const topLevel = ofType.filter((c) => !c.parentId || !parentIds.has(c.parentId));
    const childrenOf = (pid?: string) =>
      ofType.filter((c) => c.parentId && c.parentId === pid);
    return { topLevel, childrenOf };
  }, [categories, type]);

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
          <Text className="text-lg font-bold text-ink">Chọn danh mục</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.muted} />
          </Pressable>
        </View>
        <ScrollView
          className="px-5"
          contentContainerClassName="pb-4"
          showsVerticalScrollIndicator={false}
        >
          {topLevel.length === 0 ? (
            <Text className="py-8 text-center text-muted">
              Chưa có danh mục. Tạo trong mục Quản lý danh mục.
            </Text>
          ) : (
            topLevel.map((parent) => (
              <View key={parent.id} className="border-b border-white/[0.05] py-1">
                <Row
                  category={parent}
                  selected={value === parent.id}
                  onPress={() => onSelect(parent)}
                />
                {childrenOf(parent.id).map((child) => (
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
