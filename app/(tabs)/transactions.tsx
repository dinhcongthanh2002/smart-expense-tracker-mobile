import { useCallback, useEffect, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { SwipeableTransactionRow } from "@/components/SwipeableTransactionRow";
import { TransactionFacade } from "@/store/transaction";
import type { TransactionViewModel } from "@/store/transaction/model";
import { TransactionType } from "@/models/enums";
import type { QueryParams } from "@/models/api.model";
import { colors } from "@/theme/colors";

const PAGE_SIZE = 20;

export default function TransactionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const tx = TransactionFacade();

  const filters: { label: string; value?: TransactionType }[] = [
    { label: t("common.all"), value: undefined },
    { label: t("common.enums.txType.expense"), value: TransactionType.Expense },
    { label: t("common.enums.txType.income"), value: TransactionType.Income },
    { label: t("common.enums.txType.transfer"), value: TransactionType.Transfer },
  ];

  const [filter, setFilter] = useState<TransactionType | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  const [items, setItems] = useState<TransactionViewModel[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPage = async (targetPage: number) => {
    const filterObj: Record<string, unknown> = {};
    if (filter !== undefined) filterObj.type = filter;
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
  }, [filter, debounced]);

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

  return (
    <Screen className="px-5">
      <View className="mb-3 mt-2">
        <Text className="text-2xl font-bold text-ink">{t("transactions.title")}</Text>
        <Text className="text-sm text-muted">{t("transactions.count", { count: total })}</Text>
      </View>

      {/* search */}
      <GlassSurface radius={16} className="mb-3">
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

      {/* filters */}
      <View className="mb-3 flex-row flex-wrap gap-2">
        {filters.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={f.label}
              onPress={() => setFilter(f.value)}
              className={`rounded-full px-4 py-2 ${active ? "bg-primary" : "bg-white/[0.06]"}`}
            >
              <Text className={`text-sm font-medium ${active ? "text-white" : "text-muted"}`}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, i) => item.id ?? String(i)}
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
        className="absolute bottom-24 right-6 h-16 w-16 items-center justify-center rounded-full"
        style={{
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
    </Screen>
  );
}
