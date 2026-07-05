import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { WalletFacade } from "@/store/wallet";
import { WALLET_TYPE_META, type WalletViewModel } from "@/store/wallet/model";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatCurrency } from "@/lib/format";
import { colorForIndex } from "@/lib/ui-helpers";
import { colors, gradients } from "@/theme/colors";

function WalletRow({
  wallet,
  index,
  onPress,
}: {
  wallet: WalletViewModel;
  index: number;
  onPress: () => void;
}) {
  const meta = WALLET_TYPE_META[wallet.type];
  const color = wallet.color || colorForIndex(index);
  const Icon = getCategoryIcon(wallet.icon || meta.icon);
  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <GlassSurface radius={20} className="flex-row items-center gap-3 p-4" style={{ marginBottom: 12 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 15,
            backgroundColor: `${color}26`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon color={color} size={24} strokeWidth={2} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-ink" numberOfLines={1}>
            {wallet.name}
          </Text>
          <Text className="mt-0.5 text-xs text-muted">
            {meta.label} · {wallet.currency}
          </Text>
        </View>
        <Text className="text-base font-bold text-ink">
          {formatCurrency(wallet.currentBalance, wallet.currency)}
        </Text>
      </GlassSurface>
    </Pressable>
  );
}

export default function WalletsScreen() {
  const router = useRouter();
  const wallet = WalletFacade();

  useFocusEffect(
    useCallback(() => {
      wallet.get({ page: 1, size: 100 });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const wallets = wallet.pagination?.content ?? [];
  const baseCurrency = wallets[0]?.baseCurrency ?? "VND";
  const total = wallets.reduce((sum, w) => sum + (w.currentBalanceInBase ?? 0), 0);

  return (
    <Screen className="px-5">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-28"
        refreshControl={undefined}
      >
        <View className="mb-4 mt-2 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-ink">Ví của tôi</Text>
          <Pressable
            onPress={() => router.push("/wallet-form")}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary/20 active:opacity-70"
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </Pressable>
        </View>

        {/* total */}
        <View className="mb-5 overflow-hidden rounded-xl3">
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 20 }}
          >
            <Text className="text-sm text-white/80">Tổng số dư ({baseCurrency})</Text>
            <Text className="mt-1 text-4xl font-bold text-white">
              {formatCurrency(total, baseCurrency)}
            </Text>
            <Text className="mt-1 text-xs text-white/70">
              {wallets.length} ví
            </Text>
          </LinearGradient>
        </View>

        {wallets.length === 0 && !wallet.isLoading ? (
          <GlassSurface radius={24} className="items-center p-10" style={{ marginTop: 8 }}>
            <Ionicons name="wallet-outline" size={40} color={colors.muted} />
            <Text className="mt-3 text-muted">Chưa có ví nào</Text>
            <Pressable
              onPress={() => router.push("/wallet-form")}
              className="mt-4 rounded-full bg-primary px-5 py-2.5 active:opacity-80"
            >
              <Text className="font-semibold text-white">Thêm ví</Text>
            </Pressable>
          </GlassSurface>
        ) : (
          wallets.map((w, i) => (
            <WalletRow
              key={w.id}
              wallet={w}
              index={i}
              onPress={() => router.push({ pathname: "/wallet-form", params: { id: w.id! } })}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
