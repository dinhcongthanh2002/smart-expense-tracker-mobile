import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { CategoryBadge } from "@/components/CategoryBadge";
import { RecurringFacade } from "@/store/recurring";
import { FREQUENCY_META, type RecurringViewModel } from "@/store/recurring/model";
import { TransactionType } from "@/models/enums";
import { transactionTypeMeta } from "@/lib/ui-helpers";
import { formatCurrency, formatDate } from "@/lib/format";
import { colors } from "@/theme/colors";

const FILTERS: { label: string; value?: TransactionType }[] = [
  { label: "Tất cả", value: undefined },
  { label: "Chi tiêu", value: TransactionType.Expense },
  { label: "Thu nhập", value: TransactionType.Income },
];

function RecurringCard({ item, onPress }: { item: RecurringViewModel; onPress: () => void }) {
  const meta = transactionTypeMeta(item.type);
  const freq = FREQUENCY_META[item.frequency];
  const title = item.category?.name || item.note || meta.label;

  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <GlassSurface radius={20} className="mb-3 flex-row items-center gap-3 p-4">
        <CategoryBadge
          icon={item.category?.icon}
          color={item.category?.color || meta.color}
        />
        <View className="flex-1">
          <Text className="text-base font-semibold text-ink" numberOfLines={1}>
            {title}
          </Text>
          <Text className="mt-0.5 text-xs text-muted">
            {freq.label}
            {item.nextRunDate ? ` · Kế tiếp ${formatDate(item.nextRunDate)}` : ""}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-base font-bold" style={{ color: meta.color }}>
            {meta.sign}
            {formatCurrency(item.amount)}
          </Text>
          <View
            className="mt-1 rounded-full px-2 py-0.5"
            style={{ backgroundColor: item.isActive ? `${colors.income}22` : "rgba(255,255,255,0.08)" }}
          >
            <Text
              className="text-[11px] font-medium"
              style={{ color: item.isActive ? colors.income : colors.muted }}
            >
              {item.isActive ? "Đang chạy" : "Tạm dừng"}
            </Text>
          </View>
        </View>
      </GlassSurface>
    </Pressable>
  );
}

export default function RecurringScreen() {
  const router = useRouter();
  const recurring = RecurringFacade();
  const [filter, setFilter] = useState<TransactionType | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      const params = filter !== undefined ? { filter: { type: filter } } : {};
      recurring.get({ page: 1, size: 100, ...params });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]),
  );

  const items = recurring.pagination?.content ?? [];

  return (
    <Screen className="px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-28">
        <View className="mb-4 mt-1 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="-ml-2 h-10 w-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </Pressable>
          <Text className="text-lg font-bold text-ink">Giao dịch định kỳ</Text>
          <Pressable
            onPress={() => router.push("/recurring-form")}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary/20 active:opacity-70"
          >
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <View className="mb-4 flex-row gap-2">
          {FILTERS.map((f) => {
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

        {items.length === 0 && !recurring.isLoading ? (
          <GlassSurface radius={24} className="mt-4 items-center p-10">
            <Ionicons name="repeat-outline" size={40} color={colors.muted} />
            <Text className="mt-3 text-muted">Chưa có giao dịch định kỳ</Text>
            <Pressable
              onPress={() => router.push("/recurring-form")}
              className="mt-4 rounded-full bg-primary px-5 py-2.5 active:opacity-80"
            >
              <Text className="font-semibold text-white">Tạo định kỳ</Text>
            </Pressable>
          </GlassSurface>
        ) : (
          items.map((item) => (
            <RecurringCard
              key={item.id}
              item={item}
              onPress={() => router.push({ pathname: "/recurring-form", params: { id: item.id! } })}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
