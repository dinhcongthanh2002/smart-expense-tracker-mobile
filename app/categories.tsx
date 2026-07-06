import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { CategoryBadge } from "@/components/CategoryBadge";
import { CategoryFacade } from "@/store/category";
import { TransactionType } from "@/models/enums";
import type { CategoryViewModel } from "@/store/category/model";
import { colors } from "@/theme/colors";

function Chevron({ open }: { open: boolean }) {
  const rot = useSharedValue(open ? 1 : 0);
  rot.value = withTiming(open ? 1 : 0, { duration: 180 });
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 90}deg` }],
  }));
  return (
    <Animated.View style={style}>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Animated.View>
  );
}

function ChildRow({
  category,
  onPress,
}: {
  category: CategoryViewModel;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 py-3 pl-2 active:opacity-60"
    >
      <CategoryBadge icon={category.icon} color={category.color || colors.primary} size={38} />
      <Text className="flex-1 text-[15px] text-ink" numberOfLines={1}>
        {category.name}
      </Text>
      <Ionicons name="create-outline" size={18} color={colors.muted} />
    </Pressable>
  );
}

function ParentCard({
  parent,
  items,
  onEditParent,
  onEditChild,
  onAddChild,
}: {
  parent: CategoryViewModel;
  items: CategoryViewModel[];
  onEditParent: () => void;
  onEditChild: (c: CategoryViewModel) => void;
  onAddChild: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const count = items.length;

  return (
    <GlassSurface radius={22} className="px-4 py-1" style={{ marginBottom: 14 }}>
      {/* parent header */}
      <View className="flex-row items-center gap-3 py-3">
        <Pressable onPress={onEditParent} hitSlop={6}>
          <CategoryBadge icon={parent.icon} color={parent.color || colors.primary} size={46} />
        </Pressable>
        <Pressable
          onPress={() => setOpen((v) => !v)}
          className="flex-1 flex-row items-center active:opacity-70"
        >
          <View className="flex-1">
            <Text className="text-base font-bold text-ink" numberOfLines={1}>
              {parent.name}
            </Text>
            <Text className="mt-0.5 text-xs text-muted">
              {count > 0 ? t("categories.childCount", { count }) : t("categories.noChildren")}
            </Text>
          </View>
          <Chevron open={open} />
        </Pressable>
      </View>

      {open ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          className="border-t border-white/[0.06] pb-2 pt-1"
        >
          {items.map((c, i) => (
            <View key={c.id} className={i > 0 ? "border-t border-white/[0.05]" : ""}>
              <ChildRow category={c} onPress={() => onEditChild(c)} />
            </View>
          ))}
          <Pressable
            onPress={onAddChild}
            className="mt-1 flex-row items-center gap-2 py-2.5 pl-2 active:opacity-60"
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl border border-dashed border-white/25">
              <Ionicons name="add" size={18} color={colors.primarySoft} />
            </View>
            <Text className="text-[15px] font-medium text-primarySoft">
              {t("categories.addChild")}
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </GlassSurface>
  );
}

const TYPES = [
  { key: "expense", value: TransactionType.Expense },
  { key: "income", value: TransactionType.Income },
];

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const category = CategoryFacade();
  const [type, setType] = useState<TransactionType>(TransactionType.Expense);
  const [query, setQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      category.get({ page: 1, size: 200 });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const all = category.pagination?.content ?? [];

  // topLevel = all parent blocks of the active type (unfiltered — used for empty state).
  // groups = the same blocks filtered by the search query, keeping parent/child grouping:
  // a parent block appears if the parent matches or any child matches; matching parents
  // keep all children, otherwise only the matching children show.
  const { topLevel, groups } = useMemo(() => {
    const ofType = all.filter((c) => c.type === type);
    const parentIds = new Set(
      ofType.filter((c) => !c.parentId).map((c) => c.id),
    );
    const topLevel = ofType.filter((c) => !c.parentId || !parentIds.has(c.parentId));
    const childrenOf = (pid?: string) =>
      ofType.filter((c) => c.parentId && c.parentId === pid);

    const q = query.trim().toLowerCase();
    const groups = topLevel
      .map((parent) => {
        const children = childrenOf(parent.id);
        if (!q) return { parent, children };
        const parentMatch = (parent.name ?? "").toLowerCase().includes(q);
        const matched = children.filter((c) =>
          (c.name ?? "").toLowerCase().includes(q),
        );
        if (parentMatch) return { parent, children };
        if (matched.length > 0) return { parent, children: matched };
        return null;
      })
      .filter(
        (g): g is { parent: CategoryViewModel; children: CategoryViewModel[] } =>
          g !== null,
      );

    return { topLevel, groups };
  }, [all, type, query]);

  const goForm = (params: Record<string, string> = {}) =>
    router.push({ pathname: "/category-form", params });

  return (
    <Screen className="px-5">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-28"
      >
        <View className="mb-4 mt-1 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="-ml-2 h-10 w-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </Pressable>
          <Text className="text-lg font-bold text-ink">{t("categories.title")}</Text>
          <Pressable
            onPress={() => goForm({ type: String(type) })}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary/20 active:opacity-70"
          >
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {/* type toggle */}
        <View className="mb-5 flex-row rounded-2xl bg-white/[0.06] p-1">
          {TYPES.map((opt) => {
            const active = type === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setType(opt.value)}
                className={`flex-1 items-center rounded-xl py-2.5 ${active ? "bg-primary" : ""}`}
              >
                <Text
                  className={`font-semibold ${active ? "text-white" : "text-muted"}`}
                >
                  {t("common.enums.txType." + opt.key)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* search */}
        {topLevel.length > 0 ? (
          <View className="mb-4 flex-row items-center gap-2 rounded-2xl bg-white/[0.06] px-3.5">
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
        ) : null}

        {topLevel.length === 0 && !category.isLoading ? (
          <GlassSurface radius={24} className="items-center p-10" style={{ marginTop: 24 }}>
            <Ionicons name="albums-outline" size={40} color={colors.muted} />
            <Text className="mt-3 text-muted">{t("categories.empty")}</Text>
            <Pressable
              onPress={() => goForm({ type: String(type) })}
              className="mt-4 rounded-full bg-primary px-5 py-2.5 active:opacity-80"
            >
              <Text className="font-semibold text-white">{t("categories.create")}</Text>
            </Pressable>
          </GlassSurface>
        ) : groups.length === 0 ? (
          <GlassSurface radius={24} className="items-center p-10" style={{ marginTop: 8 }}>
            <Ionicons name="search-outline" size={40} color={colors.muted} />
            <Text className="mt-3 text-muted">{t("categories.pickNoResult")}</Text>
          </GlassSurface>
        ) : (
          groups.map(({ parent, children }) => (
            <ParentCard
              key={parent.id}
              parent={parent}
              items={children}
              onEditParent={() => goForm({ id: parent.id! })}
              onEditChild={(c) => goForm({ id: c.id! })}
              onAddChild={() =>
                goForm({ parentId: parent.id!, type: String(parent.type ?? type) })
              }
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
