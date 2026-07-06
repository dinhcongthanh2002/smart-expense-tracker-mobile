import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { FieldError } from "@/components/ui/FieldError";
import { DateField } from "@/components/ui/DateField";
import { SavingsGoalFacade } from "@/store/savingsGoal";
import type { SavingsGoalUpsertModel } from "@/store/savingsGoal/model";
import { CATEGORY_FALLBACK_COLORS } from "@/lib/ui-helpers";
import { CATEGORY_ICON_NAMES, getCategoryIcon } from "@/lib/category-icons";
import { groupThousands, onlyDigits } from "@/lib/format";
import { colors } from "@/theme/colors";

export default function GoalFormScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;
  const facade = SavingsGoalFacade();

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d;
  });
  const [icon, setIcon] = useState("piggy-bank");
  const [color, setColor] = useState(CATEGORY_FALLBACK_COLORS[0]);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ name?: string; target?: string }>({});

  useEffect(() => {
    if (params.id) facade.getById(params.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    const g = facade.data;
    if (isEdit && g && g.id === params.id) {
      setName(g.name ?? "");
      setTarget(String(g.targetAmount ?? ""));
      setCurrent(String(g.currentAmount ?? ""));
      if (g.deadline) {
        setHasDeadline(true);
        setDeadline(new Date(g.deadline));
      }
      if (g.icon) setIcon(g.icon);
      if (g.color) setColor(g.color);
      setNote(g.note ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facade.data]);

  const PreviewIcon = getCategoryIcon(icon);

  const onSave = async () => {
    const targetAmount = Number(onlyDigits(target)) || 0;
    const e: { name?: string; target?: string } = {};
    if (!name.trim()) e.name = t("common.validation.nameRequired");
    if (targetAmount <= 0) e.target = t("common.validation.amountRequired");
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const values: SavingsGoalUpsertModel = {
      name: name.trim(),
      targetAmount,
      currentAmount: Number(onlyDigits(current)) || 0,
      deadline: hasDeadline ? dayjs(deadline).format("YYYY-MM-DDTHH:mm:ss") : null,
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
          <Text className="text-base text-muted">{t("common.cancel")}</Text>
        </Pressable>
        <Text className="text-lg font-bold text-ink">
          {isEdit ? t("goals.editTitle") : t("goals.newTitle")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled"
      >
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
          label={t("goals.name")}
          placeholder={t("goals.namePlaceholder")}
          value={name}
          onChangeText={setName}
          error={errors.name}
        />

        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("goals.targetAmount")}</Text>
        <GlassSurface
          radius={16}
          style={errors.target ? { borderColor: colors.expense, borderWidth: 1 } : undefined}
        >
          <TextInput
            value={groupThousands(target)}
            onChangeText={(v) => setTarget(onlyDigits(v))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            className="h-14 px-4 text-lg font-semibold text-ink"
          />
        </GlassSurface>
        <FieldError error={errors.target} />

        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">
          {t("goals.initialAmount")}
        </Text>
        <GlassSurface radius={16}>
          <TextInput
            value={groupThousands(current)}
            onChangeText={(v) => setCurrent(onlyDigits(v))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            className="h-14 px-4 text-base text-ink"
          />
        </GlassSurface>

        <View className="mb-2 ml-1 mt-4 flex-row items-center justify-between">
          <Text className="text-sm font-medium text-muted">{t("goals.hasDeadline")}</Text>
          <Switch
            value={hasDeadline}
            onValueChange={setHasDeadline}
            trackColor={{ true: colors.primary, false: "rgba(255,255,255,0.15)" }}
            thumbColor="#fff"
          />
        </View>
        {hasDeadline ? <DateField value={deadline} onChange={setDeadline} /> : null}

        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("goals.color")}</Text>
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

        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("goals.icon")}</Text>
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
                  <Ic color={active ? color : colors.muted} size={24} strokeWidth={2} />
                </Pressable>
              );
            })}
          </View>
        </GlassSurface>

        <View className="mt-4">
          <Input label={t("common.note")} placeholder={t("goals.notePlaceholder")} value={note} onChangeText={setNote} />
        </View>

        <View className="mt-8 gap-3">
          <Button
            title={isEdit ? t("goals.update") : t("goals.create")}
            onPress={onSave}
            loading={facade.isSubmitting}
          />
          {isEdit && <Button title={t("goals.deleteGoal")} variant="danger" onPress={onDelete} />}
        </View>
      </ScrollView>
    </Screen>
  );
}
