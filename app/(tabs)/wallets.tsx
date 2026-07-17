import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { WalletFacade, setDefaultWallet, reorderWallets } from "@/store/wallet";
import { WALLET_TYPE_META, type WalletViewModel } from "@/store/wallet/model";
import { WalletType } from "@/models/enums";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatCurrency } from "@/lib/format";
import { colorForIndex } from "@/lib/ui-helpers";
import { colors, gradients } from "@/theme/colors";

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
  editing,
  isActive,
  drag,
  onPress,
  onSetDefault,
}: {
  wallet: WalletViewModel;
  index: number;
  hidden: boolean;
  editing: boolean;
  isActive: boolean;
  drag: () => void;
  onPress: () => void;
  onSetDefault: () => void;
}) {
  const { t } = useTranslation();
  const meta = WALLET_TYPE_META[wallet.type];
  const color = wallet.color || colorForIndex(index);
  const Icon = getCategoryIcon(wallet.icon || meta.icon);

  return (
    <Pressable
      onPress={editing ? undefined : onPress}
      onLongPress={editing ? drag : undefined}
      disabled={isActive}
      className="active:opacity-70"
    >
      <GlassSurface
        radius={20}
        className="flex-row items-center gap-3 p-4"
        style={{ marginBottom: 12, opacity: isActive ? 0.9 : 1 }}
      >
        {editing ? (
          <Pressable onPressIn={drag} hitSlop={8} className="pr-1">
            <Ionicons name="reorder-three" size={24} color={colors.muted} />
          </Pressable>
        ) : null}

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
          <View className="flex-row items-center gap-1.5">
            <Text className="text-base font-semibold text-ink" numberOfLines={1}>
              {wallet.name}
            </Text>
            {wallet.isDefault ? (
              <View className="rounded-full bg-primary/15 px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-primary">
                  {t("wallets.defaultBadge")}
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-0.5 text-xs text-muted">
            {t("common.enums.walletType." + WALLET_TYPE_KEY[wallet.type])} · {wallet.currency}
          </Text>
        </View>

        {/* Star: tap to set default */}
        <Pressable onPress={onSetDefault} hitSlop={8} className="px-1 active:opacity-60">
          <Ionicons
            name={wallet.isDefault ? "star" : "star-outline"}
            size={22}
            color={wallet.isDefault ? "#F5B301" : colors.muted}
          />
        </Pressable>

        {!editing ? (
          <Text className="text-base font-bold text-ink">
            {hidden ? "******" : formatCurrency(wallet.currentBalance, wallet.currency)}
          </Text>
        ) : null}
      </GlassSurface>
    </Pressable>
  );
}

export default function WalletsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const wallet = WalletFacade();
  const [hideBalance, setHideBalance] = useState(false);
  const [editing, setEditing] = useState(false);
  const [list, setList] = useState<WalletViewModel[]>([]);

  const load = useCallback(() => {
    wallet.get({ page: 1, size: 100 });
    AsyncStorage.getItem("hideBalance").then((v) => setHideBalance(v === "1"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(load);

  // Mirror the fetched (already SortOrder-sorted) list into local drag state.
  useEffect(() => {
    setList(wallet.pagination?.content ?? []);
  }, [wallet.pagination]);

  const toggleHide = () => {
    const next = !hideBalance;
    setHideBalance(next);
    AsyncStorage.setItem("hideBalance", next ? "1" : "0");
  };

  const baseCurrency = list[0]?.baseCurrency ?? "VND";
  const total = list.reduce((sum, w) => sum + (w.currentBalanceInBase ?? 0), 0);

  const onSetDefault = async (id: string) => {
    // Optimistic: flip the star locally, then persist + refetch.
    setList((prev) => prev.map((w) => ({ ...w, isDefault: w.id === id })));
    await setDefaultWallet(id);
    wallet.get({ page: 1, size: 100 });
  };

  const onDragEnd = async ({ data }: { data: WalletViewModel[] }) => {
    setList(data);
    await reorderWallets(data.map((w) => w.id!));
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<WalletViewModel>) => (
    <ScaleDecorator>
      <WalletRow
        wallet={item}
        index={getIndex() ?? 0}
        hidden={hideBalance}
        editing={editing}
        isActive={isActive}
        drag={drag}
        onPress={() => router.push({ pathname: "/wallet-form", params: { id: item.id! } })}
        onSetDefault={() => onSetDefault(item.id!)}
      />
    </ScaleDecorator>
  );

  const header = (
    <>
      <View className="mb-4 mt-2 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-ink">{t("wallets.title")}</Text>
        <View className="flex-row items-center gap-2">
          {list.length > 1 ? (
            <Pressable
              onPress={() => setEditing((e) => !e)}
              className="h-11 items-center justify-center rounded-full bg-glass-light px-4 active:opacity-70"
            >
              <Text className="text-sm font-semibold text-primary">
                {t(editing ? "wallets.reorderDone" : "wallets.reorder")}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => router.push("/wallet-form")}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary/20 active:opacity-70"
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View className="mb-5 overflow-hidden rounded-xl3">
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 20 }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-white/80">
              {t("wallets.totalBalance", { currency: baseCurrency })}
            </Text>
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
            {t("wallets.count", { count: list.length })}
          </Text>
        </LinearGradient>
      </View>

      {editing ? (
        <Text className="mb-2 ml-1 text-xs text-muted">{t("wallets.reorderHint")}</Text>
      ) : null}
    </>
  );

  const empty =
    !wallet.isLoading && list.length === 0 ? (
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
    ) : null;

  return (
    <Screen>
      <DraggableFlatList
        data={list}
        keyExtractor={(w) => w.id!}
        renderItem={renderItem}
        onDragEnd={onDragEnd}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 112 }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
