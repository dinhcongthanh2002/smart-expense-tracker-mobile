import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { TransactionRow, RowDivider } from "@/components/TransactionRow";
import { TransactionFacade } from "@/store/transaction";
import { TransactionType } from "@/models/enums";
import type { QueryParams } from "@/models/api.model";
import { colors } from "@/theme/colors";

const FILTERS: { label: string; value?: TransactionType }[] = [
  { label: "Tất cả", value: undefined },
  { label: "Chi tiêu", value: TransactionType.Expense },
  { label: "Thu nhập", value: TransactionType.Income },
];

export default function TransactionsScreen() {
  const router = useRouter();
  const tx = TransactionFacade();
  const [filter, setFilter] = useState<TransactionType | undefined>(undefined);

  const load = useCallback(
    (type?: TransactionType) => {
      const params: QueryParams = { page: 1, size: 50, sort: "-transactionDate" };
      if (type !== undefined) params.filter = { type };
      tx.get(params);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFocusEffect(
    useCallback(() => {
      load(filter);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]),
  );

  const data = tx.pagination?.content ?? [];
  const total = tx.pagination?.totalElements ?? 0;

  const header = useMemo(
    () => (
      <View className="mb-2">
        <View className="mb-4 mt-2 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-ink">Giao dịch</Text>
            <Text className="text-sm text-muted">{total} giao dịch</Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => setFilter(f.value)}
                className={`rounded-full px-4 py-2 ${
                  active ? "bg-primary" : "bg-white/8"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    active ? "text-white" : "text-muted"
                  }`}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    ),
    [filter, total],
  );

  return (
    <Screen className="px-5">
      <FlatList
        data={data}
        keyExtractor={(item) => item.id ?? String(Math.random())}
        ListHeaderComponent={header}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-28"
        refreshing={tx.isLoading}
        onRefresh={() => load(filter)}
        ItemSeparatorComponent={RowDivider}
        renderItem={({ item }) => (
          <View className="px-1">
            <TransactionRow tx={item} />
          </View>
        )}
        ListEmptyComponent={
          !tx.isLoading ? (
            <GlassSurface radius={24} className="mt-8 items-center p-10">
              <Ionicons name="receipt-outline" size={40} color={colors.muted} />
              <Text className="mt-3 text-muted">Chưa có giao dịch nào</Text>
            </GlassSurface>
          ) : null
        }
      />

      {/* Floating add button */}
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
