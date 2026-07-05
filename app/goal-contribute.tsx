import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { SavingsGoalFacade } from "@/store/savingsGoal";
import { formatCurrency, groupThousands, onlyDigits } from "@/lib/format";
import { colors } from "@/theme/colors";

export default function GoalContributeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const facade = SavingsGoalFacade();
  const goal =
    facade.data && facade.data.id === params.id ? facade.data : undefined;
  const remaining = goal
    ? Math.max(goal.targetAmount - goal.currentAmount, 0)
    : 0;

  const [amount, setAmount] = useState("");

  const onSave = async () => {
    const value = Number(onlyDigits(amount)) || 0;
    if (value <= 0 || !params.id) return;
    try {
      await facade.contribute(params.id, value).unwrap();
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
        <Text className="text-lg font-bold text-ink">Góp tiền</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled"
      >
        {goal ? (
          <Text className="my-3 text-center text-sm text-muted">
            {goal.name} · còn thiếu {formatCurrency(remaining)}
          </Text>
        ) : null}

        <GlassSurface radius={20} className="my-2 items-center py-6">
          <Text className="text-sm text-muted">Số tiền góp</Text>
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
          {remaining > 0 ? (
            <Pressable
              onPress={() => setAmount(String(Math.round(remaining)))}
              className="mt-3 rounded-full bg-white/[0.08] px-4 py-2 active:opacity-70"
            >
              <Text className="text-sm font-medium text-primarySoft">
                Góp đủ ({formatCurrency(remaining)})
              </Text>
            </Pressable>
          ) : null}
        </GlassSurface>

        <View className="mt-6">
          <Button title="Xác nhận góp" onPress={onSave} loading={facade.isSubmitting} />
        </View>
      </ScrollView>
    </Screen>
  );
}
