import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, TextInput, View } from "react-native";
import {
    NestableDraggableFlatList,
    NestableScrollContainer,
    ScaleDecorator,
    type RenderItemParams,
} from "react-native-draggable-flatlist";
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

import { CategoryBadge } from "@/components/CategoryBadge";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Screen } from "@/components/ui/Screen";
import { TransactionType } from "@/models/enums";
import { CategoryFacade, reorderCategories } from "@/store/category";
import type { CategoryViewModel } from "@/store/category/model";
import { colors } from "@/theme/colors";

interface Group {
  parent: CategoryViewModel;
  children: CategoryViewModel[];
}

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

/** Small "Default" pill shown on shared/preset categories. */
function DefaultTag() {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center gap-1 self-start rounded-full bg-primary/15 px-2 py-0.5">
      <Ionicons name="star" size={10} color={colors.primary} />
      <Text className="text-[10px] font-semibold text-primary">{t("categories.default")}</Text>
    </View>
  );
}

function ChildRow({
  category,
  editing,
  isActive,
  onPress,
  drag,
}: {
  category: CategoryViewModel;
  editing?: boolean;
  isActive?: boolean;
  onPress: () => void;
  drag?: () => void;
}) {
  return (
    <Pressable
      onPress={editing ? undefined : onPress}
      onLongPress={editing ? drag : undefined}
      disabled={isActive}
      className="flex-row items-center gap-3 py-3 pl-2 active:opacity-60"
      style={{ opacity: isActive ? 0.9 : 1 }}
    >
      <CategoryBadge icon={category.icon} color={category.color || colors.primary} size={38} />
      <Text className="flex-1 text-[15px] text-ink" numberOfLines={1}>
        {category.name}
      </Text>
      {category.isDefault ? <DefaultTag /> : null}
      {editing ? (
        <Pressable onPressIn={drag} hitSlop={8} className="pl-1">
          <Ionicons name="reorder-three" size={22} color={colors.muted} />
        </Pressable>
      ) : (
        <Ionicons name="create-outline" size={18} color={colors.muted} />
      )}
    </Pressable>
  );
}

function ParentCard({
  parent,
  items,
  editing,
  expanded,
  isActive,
  drag,
  onToggle,
  onEditParent,
  onEditChild,
  onAddChild,
  onReorderChildren,
}: {
  parent: CategoryViewModel;
  items: CategoryViewModel[];
  editing: boolean;
  expanded: boolean;
  isActive?: boolean;
  drag?: () => void;
  onToggle: () => void;
  onEditParent: () => void;
  onEditChild: (c: CategoryViewModel) => void;
  onAddChild: () => void;
  onReorderChildren: (children: CategoryViewModel[]) => void;
}) {
  const { t } = useTranslation();
  const count = items.length;

  const renderChild = ({
    item,
    drag: childDrag,
    isActive: childActive,
  }: RenderItemParams<CategoryViewModel>) => (
    <ScaleDecorator>
      <View className="border-t border-glass-border">
        <ChildRow
          category={item}
          editing
          isActive={childActive}
          drag={childDrag}
          onPress={() => onEditChild(item)}
        />
      </View>
    </ScaleDecorator>
  );

  return (
    <GlassSurface
      radius={22}
      className="px-4 py-1"
      style={{ marginBottom: 14, opacity: isActive ? 0.92 : 1 }}
    >
      {/* parent header */}
      <View className="flex-row items-center gap-3 py-3">
        <Pressable onPress={editing ? onToggle : onEditParent} hitSlop={6} disabled={isActive}>
          <CategoryBadge icon={parent.icon} color={parent.color || colors.primary} size={46} />
        </Pressable>
        <Pressable
          onPress={onToggle}
          onLongPress={editing ? drag : undefined}
          disabled={isActive}
          className="flex-1 flex-row items-center active:opacity-70"
        >
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="shrink text-base font-bold text-ink" numberOfLines={1}>
                {parent.name}
              </Text>
              {parent.isDefault ? <DefaultTag /> : null}
            </View>
            <Text className="mt-0.5 text-xs text-muted">
              {count > 0 ? t("categories.childCount", { count }) : t("categories.noChildren")}
            </Text>
          </View>
          {editing ? (
            <Pressable onPressIn={drag} hitSlop={10} className="pl-1">
              <Ionicons name="reorder-three" size={24} color={colors.muted} />
            </Pressable>
          ) : (
            <Chevron open={expanded} />
          )}
        </Pressable>
      </View>

      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          className="border-t border-glass-border pb-2 pt-1"
        >
          {editing ? (
            count > 0 ? (
              <NestableDraggableFlatList
                data={items}
                keyExtractor={(c) => c.id!}
                renderItem={renderChild}
                onDragEnd={({ data }) => onReorderChildren(data)}
              />
            ) : (
              <Text className="py-2 pl-2 text-sm text-muted">{t("categories.noChildren")}</Text>
            )
          ) : (
            <>
              {items.map((c, i) => (
                <View key={c.id} className={i > 0 ? "border-t border-glass-border" : ""}>
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
            </>
          )}
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
  const [editing, setEditing] = useState(false);
  // Collapsed by default — parents no longer auto-expand their children.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      category.get({ page: 1, size: 200 });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // Read the raw list ref (stable across renders unless the store updates) so the
  // grouping memo below doesn't recompute every render.
  const content = category.pagination?.content;

  // Group the active type into parent blocks, preserving the server's SortOrder.
  const serverGroups = useMemo<Group[]>(() => {
    const ofType = (content ?? []).filter((c) => c.type === type);
    const parentIds = new Set(ofType.filter((c) => !c.parentId).map((c) => c.id));
    const parents = ofType.filter((c) => !c.parentId || !parentIds.has(c.parentId));
    return parents.map((parent) => ({
      parent,
      children: ofType.filter((c) => c.parentId && c.parentId === parent.id),
    }));
  }, [content, type]);

  // Local, mutable copy so drag-to-reorder can update optimistically.
  const [groups, setGroups] = useState<Group[]>(serverGroups);
  useEffect(() => {
    setGroups(serverGroups);
  }, [serverGroups]);

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const goForm = (params: Record<string, string> = {}) =>
    router.push({ pathname: "/category-form", params });

  const onReorderParents = async ({ data }: { data: Group[] }) => {
    setGroups(data); // optimistic
    await reorderCategories(data.map((g) => g.parent.id!));
    category.get({ page: 1, size: 200 }); // resync from server
  };

  const onReorderChildren = async (parentId: string, children: CategoryViewModel[]) => {
    setGroups((prev) =>
      prev.map((g) => (g.parent.id === parentId ? { ...g, children } : g)),
    );
    await reorderCategories(children.map((c) => c.id!));
    category.get({ page: 1, size: 200 });
  };

  // Search filtering (browse mode only — reordering always uses the full list).
  const visibleGroups = useMemo<Group[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => {
        const parentMatch = (g.parent.name ?? "").toLowerCase().includes(q);
        if (parentMatch) return g;
        const matched = g.children.filter((c) =>
          (c.name ?? "").toLowerCase().includes(q),
        );
        return matched.length > 0 ? { ...g, children: matched } : null;
      })
      .filter((g): g is Group => g !== null);
  }, [groups, query]);

  const hasAny = groups.length > 0;

  const renderParent = ({ item, drag, isActive }: RenderItemParams<Group>) => (
    <ScaleDecorator>
      <ParentCard
        parent={item.parent}
        items={item.children}
        editing
        expanded={expandedIds.has(item.parent.id!)}
        isActive={isActive}
        drag={drag}
        onToggle={() => toggleExpand(item.parent.id!)}
        onEditParent={() => goForm({ id: item.parent.id! })}
        onEditChild={(c) => goForm({ id: c.id! })}
        onAddChild={() =>
          goForm({ parentId: item.parent.id!, type: String(item.parent.type ?? type) })
        }
        onReorderChildren={(children) => onReorderChildren(item.parent.id!, children)}
      />
    </ScaleDecorator>
  );

  return (
    <Screen className="px-5">
      <NestableScrollContainer
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 112 }}
      >
        {/* header */}
        <View className="mb-4 mt-1 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="-ml-2 h-10 w-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </Pressable>
          <Text className="text-lg font-bold text-ink">{t("categories.title")}</Text>
          <View className="flex-row items-center">
            {hasAny ? (
              <Pressable
                onPress={() => setEditing((v) => !v)}
                hitSlop={6}
                className="mr-1 h-10 items-center justify-center rounded-full px-2.5 active:opacity-70"
              >
                <Text className="font-semibold text-primary">
                  {editing ? t("categories.reorderDone") : t("categories.reorder")}
                </Text>
              </Pressable>
            ) : null}
            {!editing ? (
              <Pressable
                onPress={() => goForm({ type: String(type) })}
                className="h-10 w-10 items-center justify-center rounded-full bg-primary/20 active:opacity-70"
              >
                <Ionicons name="add" size={22} color={colors.primary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* type toggle */}
        <View className="mb-5 flex-row rounded-2xl bg-glass-light p-1">
          {TYPES.map((opt) => {
            const active = type === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setType(opt.value)}
                className={`flex-1 items-center rounded-xl py-2.5 ${active ? "bg-primary" : ""}`}
              >
                <Text className={`font-semibold ${active ? "text-white" : "text-muted"}`}>
                  {t("common.enums.txType." + opt.key)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* search — hidden while reordering */}
        {!editing && hasAny ? (
          <View className="mb-4 flex-row items-center gap-2 rounded-2xl bg-glass-light px-3.5">
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

        {/* reorder hint */}
        {editing ? (
          <View className="mb-3 flex-row items-center gap-1.5 pl-1">
            <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
            <Text className="text-xs text-muted">{t("categories.reorderHint")}</Text>
          </View>
        ) : null}

        {/* body */}
        {!hasAny && !category.isLoading ? (
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
        ) : editing ? (
          <NestableDraggableFlatList
            data={groups}
            keyExtractor={(g) => g.parent.id!}
            renderItem={renderParent}
            onDragEnd={onReorderParents}
          />
        ) : visibleGroups.length === 0 ? (
          <GlassSurface radius={24} className="items-center p-10" style={{ marginTop: 8 }}>
            <Ionicons name="search-outline" size={40} color={colors.muted} />
            <Text className="mt-3 text-muted">{t("categories.pickNoResult")}</Text>
          </GlassSurface>
        ) : (
          visibleGroups.map((g) => (
            <ParentCard
              key={g.parent.id}
              parent={g.parent}
              items={g.children}
              editing={false}
              expanded={expandedIds.has(g.parent.id!)}
              onToggle={() => toggleExpand(g.parent.id!)}
              onEditParent={() => goForm({ id: g.parent.id! })}
              onEditChild={(c) => goForm({ id: c.id! })}
              onAddChild={() =>
                goForm({ parentId: g.parent.id!, type: String(g.parent.type ?? type) })
              }
              onReorderChildren={() => {}}
            />
          ))
        )}
      </NestableScrollContainer>
    </Screen>
  );
}
