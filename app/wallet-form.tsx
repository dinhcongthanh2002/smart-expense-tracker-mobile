import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { WalletFacade } from "@/store/wallet";
import {
  CURRENCIES,
  WALLET_TYPE_META,
  type WalletUpsertModel,
} from "@/store/wallet/model";
import { WalletType } from "@/models/enums";
import { CATEGORY_FALLBACK_COLORS } from "@/lib/ui-helpers";
import {
  CATEGORY_ICON_NAMES,
  getCategoryIcon,
} from "@/lib/category-icons";
import { groupThousands, onlyDigits } from "@/lib/format";
import { colors } from "@/theme/colors";

const TYPES = [
  WalletType.Cash,
  WalletType.Bank,
  WalletType.EWallet,
  WalletType.Other,
];

export default function WalletFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;
  const facade = WalletFacade();

  const [name, setName] = useState("");
  const [type, setType] = useState<WalletType>(WalletType.Cash);
  const [currency, setCurrency] = useState("VND");
  const [initialBalance, setInitialBalance] = useState("");
  const [icon, setIcon] = useState(WALLET_TYPE_META[WalletType.Cash].icon);
  const [color, setColor] = useState(CATEGORY_FALLBACK_COLORS[0]);
  const [note, setNote] = useState("");
  const [iconTouched, setIconTouched] = useState(false);

  useEffect(() => {
    if (params.id) facade.getById(params.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    const w = facade.data;
    if (isEdit && w && w.id === params.id) {
      setName(w.name ?? "");
      setType(w.type ?? WalletType.Cash);
      setCurrency(w.currency ?? "VND");
      setInitialBalance(String(w.initialBalance ?? ""));
      if (w.icon) setIcon(w.icon);
      if (w.color) setColor(w.color);
      setNote(w.note ?? "");
      setIconTouched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facade.data]);

  // default icon follows the type until the user picks one
  const onType = (t: WalletType) => {
    setType(t);
    if (!iconTouched) setIcon(WALLET_TYPE_META[t].icon);
  };

  const PreviewIcon = getCategoryIcon(icon);

  const onSave = async () => {
    if (!name.trim()) return;
    const values: WalletUpsertModel = {
      name: name.trim(),
      type,
      currency,
      initialBalance: Number(onlyDigits(initialBalance)) || 0,
      icon,
      color,
      note: note.trim() || undefined,
    };
    try {
      if (isEdit && params.id) {
        await facade.put({ id: params.id, ...values }).unwrap();
      } else {
        await facade.post(values).unwrap();
      }
      router.back();
    } catch {
      // toast surfaced by API layer
    }
  };

  const onDelete = async () => {
    if (!params.id) return;
    try {
      await facade.delete(params.id).unwrap();
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
        <Text className="text-lg font-bold text-ink">
          {isEdit ? "Sửa ví" : "Ví mới"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* preview */}
        <View className="my-4 items-center">
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 26,
              backgroundColor: `${color}26`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PreviewIcon color={color} size={40} strokeWidth={2} />
          </View>
        </View>

        <Input
          label="Tên ví"
          placeholder="VD: Tiền mặt, Vietcombank"
          value={name}
          onChangeText={setName}
        />

        {/* type */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">Loại ví</Text>
        <View className="flex-row flex-wrap gap-2">
          {TYPES.map((t) => {
            const active = type === t;
            return (
              <Pressable
                key={t}
                onPress={() => onType(t)}
                className={`rounded-full px-4 py-2.5 ${active ? "bg-primary" : "bg-white/[0.06]"}`}
              >
                <Text className={active ? "font-semibold text-white" : "text-muted"}>
                  {WALLET_TYPE_META[t].label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* currency */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">Tiền tệ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">
          {CURRENCIES.map((c) => {
            const active = currency === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCurrency(c)}
                className={`rounded-full border px-4 py-2.5 ${active ? "border-primary bg-primary/20" : "border-white/15"}`}
              >
                <Text className={active ? "font-semibold text-primary" : "text-muted"}>{c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* initial balance */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">Số dư ban đầu</Text>
        <GlassSurface radius={16}>
          <TextInput
            value={groupThousands(initialBalance)}
            onChangeText={(t) => setInitialBalance(onlyDigits(t))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            className="h-14 px-4 text-lg font-semibold text-ink"
          />
        </GlassSurface>

        {/* color */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">Màu sắc</Text>
        <View className="flex-row flex-wrap gap-3">
          {CATEGORY_FALLBACK_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: c,
                borderWidth: color === c ? 3 : 0,
                borderColor: "#fff",
              }}
            />
          ))}
        </View>

        {/* icon */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">Biểu tượng</Text>
        <GlassSurface radius={20} className="p-3">
          <View className="flex-row flex-wrap gap-3">
            {CATEGORY_ICON_NAMES.map((ic) => {
              const active = icon === ic;
              const Ic = getCategoryIcon(ic);
              return (
                <Pressable
                  key={ic}
                  onPress={() => {
                    setIcon(ic);
                    setIconTouched(true);
                  }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? `${color}33` : "rgba(255,255,255,0.05)",
                    borderWidth: active ? 1 : 0,
                    borderColor: color,
                  }}
                >
                  <Ic color={active ? color : colors.muted} size={24} strokeWidth={2} />
                </Pressable>
              );
            })}
          </View>
        </GlassSurface>

        <View className="mt-4">
          <Input
            label="Ghi chú"
            placeholder="Tuỳ chọn"
            value={note}
            onChangeText={setNote}
          />
        </View>

        <View className="mt-8 gap-3">
          <Button
            title={isEdit ? "Cập nhật" : "Tạo ví"}
            onPress={onSave}
            loading={facade.isSubmitting}
          />
          {isEdit && <Button title="Xoá ví" variant="danger" onPress={onDelete} />}
        </View>
      </ScrollView>
    </Screen>
  );
}
