import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";

import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { DateField } from "@/components/ui/DateField";
import { DebtFacade } from "@/store/debt";
import { formatCurrency, groupThousands, onlyDigits } from "@/lib/format";
import { colors } from "@/theme/colors";

export default function DebtPayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const debt = DebtFacade();
  const remaining =
    debt.data && debt.data.id === params.id ? debt.data.remainingAmount : 0;

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState("");

  const onSave = async () => {
    const value = Number(onlyDigits(amount)) || 0;
    if (value <= 0 || !params.id) return;
    try {
      await debt
        .pay(params.id, {
          amount: value,
          paymentDate: dayjs(date).format("YYYY-MM-DDTHH:mm:ss"),
          note: note.trim() || undefined,
        })
        .unwrap();
      router.back();
    } catch {
      // toast surfaced by API layer
    }
  };

  return (
    <Screen orbs={false} className="px-5" edges={["top"]}>
      <View className="mb-3 mt-1 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text className="text-base text-muted">Huỷ</Text>
        </Pressable>
        <Text className="text-lg font-bold text-ink">Ghi nhận thanh toán</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10" keyboardShouldPersistTaps="handled">
        <GlassSurface radius={20} className="items-center py-6" style={{ marginVertical: 12 }}>
          <Text className="text-sm text-muted">Số tiền thanh toán</Text>
          <TextInput
            value={groupThousands(amount)}
            onChangeText={(t) => setAmount(onlyDigits(t))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            className="mt-1 text-center text-4xl font-bold text-ink"
            style={{ minWidth: 160 }}
          />
          <Text className="text-sm text-muted">VND</Text>
          <Pressable
            onPress={() => setAmount(String(Math.round(remaining)))}
            className="mt-3 rounded-full bg-white/[0.08] px-4 py-2 active:opacity-70"
          >
            <Text className="text-sm font-medium text-primarySoft">
              Trả hết ({formatCurrency(remaining)})
            </Text>
          </Pressable>
        </GlassSurface>

        <Text className="mb-2 ml-1 mt-2 text-sm font-medium text-muted">Ngày thanh toán</Text>
        <DateField value={date} onChange={setDate} maximumDate={new Date()} />

        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">Ghi chú</Text>
        <GlassSurface radius={16}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Tuỳ chọn"
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            multiline
            className="px-4 py-3 text-base text-ink"
            style={{ minHeight: 70, textAlignVertical: "top" }}
          />
        </GlassSurface>

        <View className="mt-8">
          <Button title="Xác nhận thanh toán" onPress={onSave} loading={debt.isSubmitting} />
        </View>
      </ScrollView>
    </Screen>
  );
}
