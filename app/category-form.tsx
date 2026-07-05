import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { CategoryFacade } from "@/store/category";
import { TransactionType } from "@/models/enums";
import { CATEGORY_FALLBACK_COLORS } from "@/lib/ui-helpers";
import { colors } from "@/theme/colors";

const ICONS = [
  "restaurant", "shopping_cart", "directions_car", "home", "local_hospital",
  "school", "sports_esports", "flight", "fitness_center", "pets", "checkroom",
  "local_cafe", "phone_iphone", "bolt", "card_giftcard", "savings",
  "attach_money", "work", "payments", "receipt_long",
];

const TYPE_TABS = [
  { label: "Chi tiêu", value: TransactionType.Expense },
  { label: "Thu nhập", value: TransactionType.Income },
];

export default function CategoryFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;
  const facade = CategoryFacade();

  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>(TransactionType.Expense);
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(CATEGORY_FALLBACK_COLORS[0]);

  useEffect(() => {
    if (params.id) facade.getById(params.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Prefill once the edited category is loaded.
  useEffect(() => {
    const c = facade.data;
    if (isEdit && c && c.id === params.id) {
      setName(c.name ?? "");
      setType(c.type ?? TransactionType.Expense);
      if (c.icon) setIcon(c.icon);
      if (c.color) setColor(c.color);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facade.data]);

  const onSave = async () => {
    if (!name.trim()) return;
    const values = { name: name.trim(), type, icon, color };
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
          {isEdit ? "Sửa danh mục" : "Danh mục mới"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* Preview */}
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
            <MaterialIcons
              name={icon as keyof typeof MaterialIcons.glyphMap}
              size={40}
              color={color}
            />
          </View>
        </View>

        <Input
          label="Tên danh mục"
          placeholder="VD: Ăn uống"
          value={name}
          onChangeText={setName}
        />

        {/* Type */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">Loại</Text>
        <GlassSurface radius={16} className="flex-row p-1">
          {TYPE_TABS.map((t) => {
            const active = type === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => setType(t.value)}
                className={`flex-1 items-center rounded-xl py-2.5 ${active ? "bg-primary" : ""}`}
              >
                <Text className={`font-semibold ${active ? "text-white" : "text-muted"}`}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </GlassSurface>

        {/* Color */}
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

        {/* Icon */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">Biểu tượng</Text>
        <GlassSurface radius={20} className="p-3">
          <View className="flex-row flex-wrap gap-3">
            {ICONS.map((ic) => {
              const active = icon === ic;
              return (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(ic)}
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
                  <MaterialIcons
                    name={ic as keyof typeof MaterialIcons.glyphMap}
                    size={24}
                    color={active ? color : colors.muted}
                  />
                </Pressable>
              );
            })}
          </View>
        </GlassSurface>

        <View className="mt-8 gap-3">
          <Button
            title={isEdit ? "Cập nhật" : "Tạo danh mục"}
            onPress={onSave}
            loading={facade.isSubmitting}
          />
          {isEdit && (
            <Button title="Xoá danh mục" variant="ghost" onPress={onDelete} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
