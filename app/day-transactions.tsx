import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { TransactionRow } from "@/components/TransactionRow";
import { TransactionFacade } from "@/store/transaction";
import type { TransactionViewModel } from "@/store/transaction/model";
import { TransactionType } from "@/models/enums";
import { formatCurrency } from "@/lib/format";
import { colors } from "@/theme/colors";

export default function DayTransactionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const date = params.date ?? "";
  const tx = TransactionFacade();

  const [items, setItems] = useState<TransactionViewModel[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    try {
      const res = await tx
        .get({
          page: 1,
          size: 100,
          sort: "-transactionDate",
          filter: { transactionDateRange: [date, date] },
        })
        .unwrap();
      setItems(res.data?.content ?? []);
    } catch {
      // toast surfaced by API layer
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    items.forEach((t) => {
      if (t.type === TransactionType.Income) income += t.amount ?? 0;
      else if (t.type === TransactionType.Expense) expense += t.amount ?? 0;
    });
    return { income, expense };
  }, [items]);

  const title = date
    ? (() => {
        const [y, m, d] = date.split("-");
        return `${d}/${m}/${y}`;
      })()
    : "Giao dịch";

  return (
    <Screen className="px-5">
      <View className="mb-4 mt-1 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="-ml-2 h-10 w-10 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">Ngày {title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* summary */}
      <View className="mb-4 flex-row gap-3">
        <GlassSurface radius={18} className="flex-1 p-4">
          <Text className="text-xs text-muted">Thu nhập</Text>
          <Text className="mt-1 text-base font-bold text-income" numberOfLines={1}>
            {formatCurrency(totals.income)}
          </Text>
        </GlassSurface>
        <GlassSurface radius={18} className="flex-1 p-4">
          <Text className="text-xs text-muted">Chi tiêu</Text>
          <Text className="mt-1 text-base font-bold text-expense" numberOfLines={1}>
            {formatCurrency(totals.expense)}
          </Text>
        </GlassSurface>
      </View>

      {loading ? (
        <View className="mt-10">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, i) => item.id ?? String(i)}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-28"
          renderItem={({ item }) => (
            <GlassSurface radius={18} className="px-4">
              <TransactionRow
                tx={item}
                onPress={() =>
                  router.push({ pathname: "/transaction-form", params: { id: item.id! } })
                }
              />
            </GlassSurface>
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
          ListEmptyComponent={
            <GlassSurface radius={24} className="mt-8 items-center p-10">
              <Ionicons name="receipt-outline" size={40} color={colors.muted} />
              <Text className="mt-3 text-muted">Chưa có giao dịch ngày này</Text>
            </GlassSurface>
          }
        />
      )}
    </Screen>
  );
}
