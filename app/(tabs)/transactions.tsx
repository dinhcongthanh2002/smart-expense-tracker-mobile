import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { SwipeableTransactionRow } from "@/components/SwipeableTransactionRow";
import {
  TransactionFilterSheet,
  type TxFilter,
  emptyTxFilter,
  resolveDateRange,
  activeFilterCount,
} from "@/components/TransactionFilterSheet";
import { TransactionFacade } from "@/store/transaction";
import { CategoryFacade } from "@/store/category";
import type { TransactionViewModel } from "@/store/transaction/model";
import { TransactionType } from "@/models/enums";
import type { QueryParams } from "@/models/api.model";
import { colors } from "@/theme/colors";

const DATE_LABEL_KEY: Record<string, string> = {
  today: "transactions.today",
  "7d": "transactions.last7",
  "30d": "transactions.last30",
  thisMonth: "transactions.thisMonth",
  lastMonth: "transactions.lastMonth",
  custom: "transactions.custom",
};

const TYPE_LABEL_KEY: Record<number, string> = {
  [TransactionType.Expense]: "common.enums.txType.expense",
  [TransactionType.Income]: "common.enums.txType.income",
  [TransactionType.Transfer]: "common.enums.txType.transfer",
};

const PAGE_SIZE = 20;

export default function TransactionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tx = TransactionFacade();
  const category = CategoryFacade();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [applied, setApplied] = useState<TxFilter>(emptyTxFilter());
  const [sheetOpen, setSheetOpen] = useState(false);

  const [items, setItems] = useState<TransactionViewModel[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const categories = category.pagination?.content ?? [];
  const activeCount = activeFilterCount(applied);

  // Categories power the filter sheet's category chips.
  useEffect(() => {
    category.get({ page: 1, size: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce the search box
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(id);
  }, [search]);

  const fetchPage = async (targetPage: number) => {
    const filterObj: Record<string, unknown> = {};
    if (applied.type !== undefined) filterObj.type = applied.type;
    if (applied.categoryId) filterObj.categoryId = applied.categoryId;
    // The list endpoint filters dates via TransactionDateRange ([from, to]).
    const { from, to } = resolveDateRange(applied);
    if (from && to) filterObj.transactionDateRange = [from, to];
    if (debounced) filterObj.fullTextSearch = debounced;
    const params: QueryParams = { page: targetPage, size: PAGE_SIZE, sort: "-transactionDate" };
    if (Object.keys(filterObj).length) params.filter = filterObj;
    const res = await tx.get(params).unwrap();
    return res.data;
  };

  const loadFirst = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchPage(1);
      setItems(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 1);
      setTotal(data?.totalElements ?? 0);
      setPage(1);
    } catch {
      // toast surfaced by API layer
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, debounced]);

  const loadMore = async () => {
    if (loadingMore || refreshing || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(page + 1);
      setItems((prev) => [...prev, ...(data?.content ?? [])]);
      setPage((p) => p + 1);
      setTotalPages(data?.totalPages ?? totalPages);
    } catch {
      // toast surfaced by API layer
    } finally {
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFirst();
    }, [loadFirst]),
  );

  const handleDelete = async (id: string) => {
    try {
      await tx.delete(id).unwrap();
      loadFirst();
    } catch {
      // toast surfaced by API layer
    }
  };

  // Removable chips summarising the applied filter (shown under the search row).
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (applied.type !== undefined) {
      chips.push({
        key: "type",
        label: t(TYPE_LABEL_KEY[applied.type]),
        onRemove: () =>
          setApplied((f) => ({ ...f, type: undefined, categoryId: undefined })),
      });
    }
    if (applied.categoryId) {
      const c = categories.find((x) => x.id === applied.categoryId);
      chips.push({
        key: "cat",
        label: c?.name ?? t("transactions.categoryLabel"),
        onRemove: () => setApplied((f) => ({ ...f, categoryId: undefined })),
      });
    }
    if (applied.datePreset !== "all") {
      const label =
        applied.datePreset === "custom"
          ? `${applied.customFrom} → ${applied.customTo}`
          : t(DATE_LABEL_KEY[applied.datePreset]);
      chips.push({
        key: "date",
        label,
        onRemove: () => setApplied((f) => ({ ...f, datePreset: "all" })),
      });
    }
    return chips;
  }, [applied, categories, t]);

  return (
    <Screen className="px-5">
      <View className="mb-3 mt-2">
        <Text className="text-2xl font-bold text-ink">{t("transactions.title")}</Text>
        <Text className="text-sm text-muted">{t("transactions.count", { count: total })}</Text>
      </View>

      {/* search + filter button */}
      <View className="mb-3 flex-row items-center gap-2">
        <GlassSurface radius={16} style={{ flex: 1 }}>
          <View className="h-12 flex-row items-center px-3">
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("transactions.searchPlaceholder")}
              placeholderTextColor={colors.muted}
              selectionColor={colors.primary}
              className="ml-2 flex-1 text-base text-ink"
            />
            {search ? (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        </GlassSurface>

        <Pressable onPress={() => setSheetOpen(true)}>
          <GlassSurface
            radius={16}
            style={
              activeCount > 0
                ? { borderColor: colors.primary, borderWidth: 1 }
                : undefined
            }
          >
            <View className="h-12 w-12 items-center justify-center">
              <Ionicons
                name="options-outline"
                size={22}
                color={activeCount > 0 ? colors.primary : colors.muted}
              />
            </View>
          </GlassSurface>
          {activeCount > 0 ? (
            <View
              className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full px-1"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-[11px] font-bold text-white">{activeCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {/* active filter chips */}
      {activeChips.length > 0 ? (
        <View className="mb-3 flex-row flex-wrap items-center gap-2">
          {activeChips.map((c) => (
            <Pressable
              key={c.key}
              onPress={c.onRemove}
              className="flex-row items-center gap-1.5 rounded-full border border-primary bg-primary/20 py-1.5 pl-3 pr-2.5"
            >
              <Text className="text-sm font-medium text-primary">{c.label}</Text>
              <Ionicons name="close" size={14} color={colors.primary} />
            </Pressable>
          ))}
          <Pressable
            onPress={() => setApplied(emptyTxFilter())}
            className="px-1.5 py-1.5"
          >
            <Text className="text-sm font-medium text-muted">{t("transactions.clearAll")}</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item, i) => item.id ?? String(i)}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-28"
        refreshing={refreshing}
        onRefresh={loadFirst}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        renderItem={({ item }) => (
          <SwipeableTransactionRow
            tx={item}
            onEdit={() =>
              router.push({ pathname: "/transaction-form", params: { id: item.id! } })
            }
            onDelete={() => handleDelete(item.id!)}
          />
        )}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-4">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !refreshing ? (
            <GlassSurface radius={24} className="mt-8 items-center p-10">
              <Ionicons name="receipt-outline" size={40} color={colors.muted} />
              <Text className="mt-3 text-muted">
                {debounced ? t("transactions.emptySearch") : t("transactions.empty")}
              </Text>
            </GlassSurface>
          ) : null
        }
      />

      <Pressable
        onPress={() => router.push("/transaction-form")}
        className="absolute right-6 h-16 w-16 items-center justify-center rounded-full"
        style={{
          bottom: insets.bottom + 84,
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOpacity: 0.5,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={34} color="#fff" />
      </Pressable>

      <TransactionFilterSheet
        visible={sheetOpen}
        value={applied}
        categories={categories}
        onClose={() => setSheetOpen(false)}
        onApply={(v) => {
          setApplied(v);
          setSheetOpen(false);
        }}
      />
    </Screen>
  );
}
