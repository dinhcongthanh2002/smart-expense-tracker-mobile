import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { CategoryBadge } from "@/components/CategoryBadge";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import {
    CATEGORY_ICON_NAMES,
    DEFAULT_CATEGORY_ICON,
    getCategoryIcon,
} from "@/lib/category-icons";
import { CATEGORY_FALLBACK_COLORS } from "@/lib/ui-helpers";
import { TransactionType } from "@/models/enums";
import { CategoryFacade } from "@/store/category";
import { colors } from "@/theme/colors";

const TYPE_TABS = [
  { key: "expense", value: TransactionType.Expense },
  { key: "income", value: TransactionType.Income },
];

export default function CategoryFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    parentId?: string;
    type?: string;
  }>();
  const isEdit = !!params.id;
  const facade = CategoryFacade();

  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>(
    params.type !== undefined ? (Number(params.type) as TransactionType) : TransactionType.Expense,
  );
  const [parentId, setParentId] = useState<string | undefined>(params.parentId);
  const [icon, setIcon] = useState(DEFAULT_CATEGORY_ICON);
  const [color, setColor] = useState(CATEGORY_FALLBACK_COLORS[0]);
  const [nameError, setNameError] = useState<string>();

  useEffect(() => {
    facade.get({ page: 1, size: 200 });
    if (params.id) facade.getById(params.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Prefill once the edited category is loaded.
  useEffect(() => {
    const c = facade.data;
    if (isEdit && c && c.id === params.id) {
      setName(c.name ?? "");
      setType(c.type ?? TransactionType.Expense);
      setParentId(c.parentId);
      if (c.icon) setIcon(c.icon);
      if (c.color) setColor(c.color);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facade.data]);

  // Possible parents = top-level categories of this type (2-level only), not self.
  const parentOptions = useMemo(() => {
    const list = facade.pagination?.content ?? [];
    return list.filter(
      (c) => !c.parentId && c.type === type && c.id !== params.id,
    );
  }, [facade.pagination, type, params.id]);

  const isChild = !!parentId;
  const PreviewIcon = getCategoryIcon(icon);

  const onSave = async () => {
    if (!name.trim()) {
      setNameError(t("common.validation.nameRequired"));
      return;
    }
    setNameError(undefined);
    const values = {
      name: name.trim(),
      type,
      icon,
      color,
      parentId: parentId ?? null,
    } as Record<string, unknown>;
    try {
      if (isEdit && params.id) {
        await facade.put({ id: params.id, ...values } as never).unwrap();
      } else {
        await facade.post(values as never).unwrap();
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
          <Text className="text-base text-muted">{t("common.cancel")}</Text>
        </Pressable>
        <Text className="text-lg font-bold text-ink">
          {isEdit
            ? t("categories.editTitle")
            : isChild
              ? t("categories.childTitle")
              : t("categories.newTitle")}
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
            <PreviewIcon color={color} size={40} strokeWidth={2} />
          </View>
        </View>

        <Input
          label={t("categories.name")}
          placeholder={t("categories.namePlaceholder")}
          value={name}
          onChangeText={setName}
          error={nameError}
        />

        {/* Parent category */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">
          {t("categories.parentLabel")}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pr-4"
        >
          <Pressable
            onPress={() => setParentId(undefined)}
            className={`rounded-full border px-4 py-2.5 ${
              !parentId ? "border-primary bg-primary/20" : "border-glass-border"
            }`}
          >
            <Text className={!parentId ? "font-semibold text-primary" : "text-muted"}>
              {t("categories.topLevelOption")}
            </Text>
          </Pressable>
          {parentOptions.map((p) => {
            const active = parentId === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => {
                  setParentId(p.id);
                  if (p.type !== undefined) setType(p.type);
                }}
                className={`flex-row items-center gap-2 rounded-full border px-3 py-2 ${
                  active ? "border-primary bg-primary/20" : "border-glass-border"
                }`}
              >
                <CategoryBadge icon={p.icon} color={p.color || colors.primary} size={26} />
                <Text className={active ? "font-semibold text-ink" : "text-muted"}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Type — only when top-level (children inherit the parent's type) */}
        {isChild ? (
          <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-glass-light px-4 py-3">
            <Ionicons name="git-branch-outline" size={18} color={colors.muted} />
            <Text className="text-sm text-muted">
              {t("categories.childInheritType")}
            </Text>
          </View>
        ) : (
          <>
            <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("categories.typeLabel")}</Text>
            <GlassSurface radius={16} className="flex-row p-1">
              {TYPE_TABS.map((opt) => {
                const active = type === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setType(opt.value)}
                    className={`flex-1 items-center rounded-xl py-2.5 ${active ? "bg-primary" : ""}`}
                  >
                    <Text className={`font-semibold ${active ? "text-white" : "text-muted"}`}>
                      {t("common.enums.txType." + opt.key)}
                    </Text>
                  </Pressable>
                );
              })}
            </GlassSurface>
          </>
        )}

        {/* Color */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("categories.color")}</Text>
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
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("categories.icon")}</Text>
        <GlassSurface radius={20} className="p-3">
          <View className="flex-row flex-wrap gap-3">
            {CATEGORY_ICON_NAMES.map((ic) => {
              const active = icon === ic;
              const Ic = getCategoryIcon(ic);
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
                  <Ic
                    color={active ? color : colors.muted}
                    size={24}
                    strokeWidth={2}
                  />
                </Pressable>
              );
            })}
          </View>
        </GlassSurface>

        <View className="mt-8 gap-3">
          <Button
            title={isEdit ? t("categories.update") : t("categories.create")}
            onPress={onSave}
            loading={facade.isSubmitting}
          />
          {isEdit && (
            <Button title={t("categories.deleteCategory")} variant="danger" onPress={onDelete} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
