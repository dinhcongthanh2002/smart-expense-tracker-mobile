import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { CategoryBadge } from "@/components/CategoryBadge";
import { CategoryFacade } from "@/store/category";
import { TransactionFacade } from "@/store/transaction";
import { TransactionType } from "@/models/enums";
import { formatDate } from "@/lib/format";
import { colors } from "@/theme/colors";

const TYPE_TABS = [
  { label: "Chi tiêu", value: TransactionType.Expense },
  { label: "Thu nhập", value: TransactionType.Income },
];

export default function TransactionFormScreen() {
  const router = useRouter();
  const category = CategoryFacade();
  const tx = TransactionFacade();

  const [type, setType] = useState<TransactionType>(TransactionType.Expense);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    category.get({ page: 1, size: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(
    () => (category.pagination?.content ?? []).filter((c) => c.type === type),
    [category.pagination, type],
  );

  const onSave = useCallback(async () => {
    const value = Number(amount.replace(/[^\d.]/g, ""));
    if (!value || value <= 0) return;
    try {
      await tx
        .post({
          type,
          amount: value,
          categoryId,
          note: note.trim() || undefined,
          transactionDate: dayjs(date).format("YYYY-MM-DDTHH:mm:ss"),
        })
        .unwrap();
      router.back();
    } catch {
      // toast surfaced by API layer
    }
  }, [amount, type, categoryId, note, date, tx, router]);

  return (
    <Screen orbs={false} className="px-5" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Modal header */}
        <View className="mb-2 mt-1 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text className="text-base text-muted">Huỷ</Text>
          </Pressable>
          <Text className="text-lg font-bold text-ink">Giao dịch mới</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-10"
          keyboardShouldPersistTaps="handled"
        >
          {/* Type switch */}
          <GlassSurface radius={16} className="my-3 flex-row p-1">
            {TYPE_TABS.map((t) => {
              const active = type === t.value;
              return (
                <Pressable
                  key={t.value}
                  onPress={() => {
                    setType(t.value);
                    setCategoryId(undefined);
                  }}
                  className={`flex-1 items-center rounded-xl py-2.5 ${
                    active ? "bg-primary" : ""
                  }`}
                >
                  <Text
                    className={`font-semibold ${active ? "text-white" : "text-muted"}`}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </GlassSurface>

          {/* Amount */}
          <GlassSurface radius={20} className="my-3 items-center py-6">
            <Text className="text-sm text-muted">Số tiền</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.muted}
              selectionColor={colors.primary}
              className="mt-1 text-center text-4xl font-bold text-ink"
              style={{ minWidth: 160 }}
            />
            <Text className="text-sm text-muted">VND</Text>
          </GlassSurface>

          {/* Category picker */}
          <Text className="mb-2 ml-1 mt-2 text-sm font-medium text-muted">
            Danh mục
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-4 py-1 pr-4"
          >
            {categories.map((c) => {
              const active = categoryId === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategoryId(c.id)}
                  className="items-center"
                  style={{ opacity: active ? 1 : 0.6 }}
                >
                  <View
                    style={
                      active
                        ? { borderWidth: 2, borderColor: colors.primary, borderRadius: 20 }
                        : undefined
                    }
                  >
                    <CategoryBadge icon={c.icon} color={c.color || colors.primary} size={52} />
                  </View>
                  <Text className="mt-1 w-16 text-center text-xs text-muted" numberOfLines={1}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
            {categories.length === 0 && (
              <Text className="py-4 text-muted">Chưa có danh mục</Text>
            )}
          </ScrollView>

          {/* Note */}
          <View className="mt-4">
            <Input
              label="Ghi chú"
              placeholder="Nhập ghi chú (tuỳ chọn)"
              value={note}
              onChangeText={setNote}
            />
          </View>

          {/* Date */}
          <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">Ngày</Text>
          <Pressable onPress={() => setShowPicker((v) => !v)}>
            <GlassSurface radius={16}>
              <View className="h-14 flex-row items-center justify-between px-4">
                <Text className="text-base text-ink">{formatDate(date)}</Text>
                <Ionicons name="calendar-outline" size={20} color={colors.muted} />
              </View>
            </GlassSurface>
          </Pressable>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              themeVariant="dark"
              maximumDate={new Date()}
              onChange={(_, d) => {
                if (Platform.OS !== "ios") setShowPicker(false);
                if (d) setDate(d);
              }}
            />
          )}

          <View className="mt-8">
            <Button title="Lưu giao dịch" onPress={onSave} loading={tx.isSubmitting} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
