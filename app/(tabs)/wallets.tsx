import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { WalletFacade } from "@/store/wallet";
import { WALLET_TYPE_META, type WalletViewModel } from "@/store/wallet/model";
import { WalletType } from "@/models/enums";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatCurrency } from "@/lib/format";
import { colorForIndex } from "@/lib/ui-helpers";
import { colors, gradients } from "@/theme/colors";

// Maps a wallet type to its shared enum-label key (common.enums.walletType.*).
const WALLET_TYPE_KEY: Record<WalletType, string> = {
  [WalletType.Cash]: "cash",
  [WalletType.Bank]: "bank",
  [WalletType.EWallet]: "ewallet",
  [WalletType.Other]: "other",
};

function WalletRow({
  wallet,
  index,
  hidden,
  onPress,
}: {
  wallet: WalletViewModel;
  index: number;
  hidden: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
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
            {t("common.enums.walletType." + WALLET_TYPE_KEY[wallet.type])} · {wallet.currency}
          </Text>
        </View>
        <Text className="text-base font-bold text-ink">
          {hidden ? "******" : formatCurrency(wallet.currentBalance, wallet.currency)}
        </Text>
      </GlassSurface>
    </Pressable>
  );
}

export default function WalletsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const wallet = WalletFacade();
  const [hideBalance, setHideBalance] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("hideBalance").then((v) => setHideBalance(v === "1"));
  }, []);

  const toggleHide = () => {
    const next = !hideBalance;
    setHideBalance(next);
    AsyncStorage.setItem("hideBalance", next ? "1" : "0");
  };

  useFocusEffect(
    useCallback(() => {
      wallet.get({ page: 1, size: 100 });
      AsyncStorage.getItem("hideBalance").then((v) => setHideBalance(v === "1"));
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
          <Text className="text-2xl font-bold text-ink">{t("wallets.title")}</Text>
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
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-white/80">{t("wallets.totalBalance", { currency: baseCurrency })}</Text>
              <Pressable
                onPress={toggleHide}
                hitSlop={10}
                className="h-8 w-8 items-center justify-center rounded-full bg-white/15 active:opacity-70"
              >
                <Ionicons
                  name={hideBalance ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#fff"
                />
              </Pressable>
            </View>
            <Text className="mt-1 text-4xl font-bold text-white">
              {hideBalance ? "******" : formatCurrency(total, baseCurrency)}
            </Text>
            <Text className="mt-1 text-xs text-white/70">
              {t("wallets.count", { count: wallets.length })}
            </Text>
          </LinearGradient>
        </View>

        {wallets.length === 0 && !wallet.isLoading ? (
          <GlassSurface radius={24} className="items-center p-10" style={{ marginTop: 8 }}>
            <Ionicons name="wallet-outline" size={40} color={colors.muted} />
            <Text className="mt-3 text-muted">{t("wallets.empty")}</Text>
            <Pressable
              onPress={() => router.push("/wallet-form")}
              className="mt-4 rounded-full bg-primary px-5 py-2.5 active:opacity-80"
            >
              <Text className="font-semibold text-white">{t("wallets.addWallet")}</Text>
            </Pressable>
          </GlassSurface>
        ) : (
          wallets.map((w, i) => (
            <WalletRow
              key={w.id}
              wallet={w}
              index={i}
              hidden={hideBalance}
              onPress={() => router.push({ pathname: "/wallet-form", params: { id: w.id! } })}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
