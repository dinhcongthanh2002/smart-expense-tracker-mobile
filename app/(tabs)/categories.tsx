import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { CategoryBadge } from "@/components/CategoryBadge";
import { CategoryFacade } from "@/store/category";
import { TransactionType } from "@/models/enums";
import type { CategoryViewModel } from "@/store/category/model";
import { colors } from "@/theme/colors";

function CategoryGrid({
  title,
  items,
  onPress,
}: {
  title: string;
  items: CategoryViewModel[];
  onPress: (c: CategoryViewModel) => void;
}) {
  if (items.length === 0) return null;
  return (
    <View className="mb-6">
      <Text className="mb-3 text-base font-bold text-ink">{title}</Text>
      <View className="flex-row flex-wrap">
        {items.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => onPress(c)}
            className="mb-4 w-1/4 items-center"
          >
            <CategoryBadge icon={c.icon} color={c.color || colors.primary} size={54} />
            <Text
              className="mt-1.5 px-1 text-center text-xs text-muted"
              numberOfLines={1}
            >
              {c.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function CategoriesScreen() {
  const router = useRouter();
  const category = CategoryFacade();

  useFocusEffect(
    useCallback(() => {
      category.get({ page: 1, size: 200 });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const all = category.pagination?.content ?? [];
  const expense = all.filter((c) => c.type === TransactionType.Expense);
  const income = all.filter((c) => c.type === TransactionType.Income);

  const openEdit = (c: CategoryViewModel) =>
    router.push({ pathname: "/category-form", params: { id: c.id } });

  return (
    <Screen className="px-5">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-28"
        refreshControl={undefined}
      >
        <View className="mb-4 mt-2 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-ink">Danh mục</Text>
          <Pressable
            onPress={() => router.push("/category-form")}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary/20"
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </Pressable>
        </View>

        {all.length === 0 && !category.isLoading ? (
          <GlassSurface radius={24} className="mt-8 items-center p-10">
            <Ionicons name="grid-outline" size={40} color={colors.muted} />
            <Text className="mt-3 text-muted">Chưa có danh mục nào</Text>
          </GlassSurface>
        ) : (
          <GlassSurface radius={24} className="p-5">
            <CategoryGrid title="Chi tiêu" items={expense} onPress={openEdit} />
            <CategoryGrid title="Thu nhập" items={income} onPress={openEdit} />
          </GlassSurface>
        )}
      </ScrollView>
    </Screen>
  );
}
