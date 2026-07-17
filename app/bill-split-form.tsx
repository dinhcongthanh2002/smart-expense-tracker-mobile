import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { FieldError } from "@/components/ui/FieldError";
import { DateField } from "@/components/ui/DateField";
import { BillSplitFacade } from "@/store/billSplit";
import { formatCurrency, groupThousands, onlyDigits } from "@/lib/format";
import { notify } from "@/lib/notify";
import { colors } from "@/theme/colors";

interface PRow {
  name: string;
  share: string; // digits
  isOwner: boolean;
  isSettled: boolean;
}

export default function BillSplitFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;
  const bill = BillSplitFacade();

  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("");
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<PRow[]>([
    { name: "", share: "", isOwner: true, isSettled: true },
    { name: "", share: "", isOwner: false, isSettled: false },
  ]);
  const [titleError, setTitleError] = useState<string>();

  useEffect(() => {
    if (params.id) bill.getById(params.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    const b = bill.data;
    if (!isEdit || !b || b.id !== params.id) return;
    setTitle(b.title ?? "");
    setTotal(String(Math.round(b.totalAmount ?? 0)));
    if (b.date) setDate(new Date(b.date));
    setNote(b.note ?? "");
    setRows(
      (b.participants ?? []).map((p) => ({
        name: p.name,
        share: String(Math.round(p.shareAmount ?? 0)),
        isOwner: p.isOwner,
        isSettled: p.isSettled,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bill.data]);

  const updateRow = (i: number, patch: Partial<PRow>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const setOwner = (i: number) =>
    setRows((prev) =>
      prev.map((r, idx) => ({
        ...r,
        isOwner: idx === i,
        isSettled: idx === i ? true : r.isSettled,
      })),
    );

  const addRow = () =>
    setRows((prev) => [...prev, { name: "", share: "", isOwner: false, isSettled: false }]);

  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const splitEqually = () => {
    const totalNum = Number(onlyDigits(total)) || 0;
    if (totalNum <= 0 || rows.length === 0) return;
    const each = Math.round(totalNum / rows.length);
    setRows((prev) => prev.map((r) => ({ ...r, share: String(each) })));
  };

  const onSave = async () => {
    const named = rows.filter((r) => r.name.trim());
    if (!title.trim()) {
      setTitleError(t("billSplit.titleRequired"));
      return;
    }
    setTitleError(undefined);
    if (named.length === 0) {
      notify.error(t("billSplit.needParticipant"));
      return;
    }
    const values = {
      title: title.trim(),
      totalAmount: Number(onlyDigits(total)) || 0,
      date: dayjs(date).format("YYYY-MM-DDTHH:mm:ss"),
      note: note.trim() || undefined,
      participants: named.map((r) => ({
        name: r.name.trim(),
        shareAmount: Number(onlyDigits(r.share)) || 0,
        isOwner: r.isOwner,
        isSettled: r.isOwner || r.isSettled,
      })),
    };
    try {
      if (isEdit && params.id) await bill.put({ id: params.id, ...values }).unwrap();
      else await bill.post(values).unwrap();
      router.back();
    } catch {
      // toast surfaced by API layer
    }
  };

  const onDelete = () => {
    if (!params.id) return;
    Alert.alert(t("billSplit.delete"), "", [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("billSplit.delete"),
        style: "destructive",
        onPress: async () => {
          await bill.delete(params.id!);
          router.back();
        },
      },
    ]);
  };

  const owed = rows
    .filter((r) => !r.isOwner && !r.isSettled)
    .reduce((s, r) => s + (Number(onlyDigits(r.share)) || 0), 0);

  return (
    <Screen orbs={false} className="px-5" edges={["top"]}>
      <View className="mb-3 mt-1 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text className="text-base text-muted">{t("common.cancel")}</Text>
        </Pressable>
        <Text className="text-lg font-bold text-ink">
          {isEdit ? t("billSplit.editTitle") : t("billSplit.newTitle")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-2">
          <Input
            label={t("billSplit.titleLabel")}
            placeholder={t("billSplit.titlePlaceholder")}
            value={title}
            onChangeText={setTitle}
            error={titleError}
          />
        </View>

        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("billSplit.total")}</Text>
        <GlassSurface radius={16}>
          <TextInput
            value={groupThousands(total)}
            onChangeText={(v) => setTotal(onlyDigits(v))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            className="h-14 px-4 text-lg font-semibold text-ink"
          />
        </GlassSurface>

        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("billSplit.date")}</Text>
        <DateField value={date} onChange={setDate} maximumDate={new Date()} />

        {/* Participants */}
        <View className="mb-2 ml-1 mt-4 flex-row items-center justify-between">
          <Text className="text-sm font-medium text-muted">{t("billSplit.participants")}</Text>
          <Pressable onPress={splitEqually} hitSlop={8} className="active:opacity-60">
            <Text className="text-sm font-semibold text-primary">{t("billSplit.splitEqually")}</Text>
          </Pressable>
        </View>

        {rows.map((r, i) => (
          <GlassSurface key={i} radius={16} className="mb-2 p-3">
            <View className="flex-row items-center gap-2">
              <TextInput
                value={r.name}
                onChangeText={(v) => updateRow(i, { name: v })}
                placeholder={t("billSplit.personName")}
                placeholderTextColor={colors.muted}
                className="flex-1 text-base text-ink"
              />
              <Pressable onPress={() => removeRow(i)} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={colors.muted} />
              </Pressable>
            </View>
            <View className="mt-2 flex-row items-center gap-2">
              <TextInput
                value={groupThousands(r.share)}
                onChangeText={(v) => updateRow(i, { share: onlyDigits(v) })}
                keyboardType="number-pad"
                placeholder={t("billSplit.share")}
                placeholderTextColor={colors.muted}
                className="flex-1 rounded-xl bg-glass-light px-3 py-2 text-[15px] text-ink"
              />
              {/* Owner (me) toggle */}
              <Pressable
                onPress={() => setOwner(i)}
                className={`flex-row items-center gap-1 rounded-full border px-3 py-2 ${
                  r.isOwner ? "border-primary bg-primary/15" : "border-glass-border"
                }`}
              >
                <Ionicons
                  name={r.isOwner ? "person" : "person-outline"}
                  size={14}
                  color={r.isOwner ? colors.primary : colors.muted}
                />
                <Text className={`text-xs ${r.isOwner ? "font-semibold text-primary" : "text-muted"}`}>
                  {t("billSplit.markYou")}
                </Text>
              </Pressable>
            </View>
            {/* Settled checkbox — only for non-owner */}
            {!r.isOwner ? (
              <Pressable
                onPress={() => updateRow(i, { isSettled: !r.isSettled })}
                className="mt-2 flex-row items-center gap-2 active:opacity-60"
              >
                <Ionicons
                  name={r.isSettled ? "checkbox" : "square-outline"}
                  size={18}
                  color={r.isSettled ? colors.primary : colors.muted}
                />
                <Text className="text-sm text-muted">{t("billSplit.paid")}</Text>
              </Pressable>
            ) : null}
          </GlassSurface>
        ))}

        <Pressable
          onPress={addRow}
          className="mb-1 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-glass-border py-3 active:opacity-60"
        >
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text className="font-medium text-primary">{t("billSplit.addPerson")}</Text>
        </Pressable>

        <Text className="mt-2 px-1 text-[11px] leading-4 text-muted">{t("billSplit.note_hint")}</Text>

        {/* Summary */}
        <View className="mt-3 flex-row items-center justify-between rounded-2xl bg-glass-light px-4 py-3">
          <Text className="text-sm text-muted">{t("billSplit.owedToYou")}</Text>
          <Text className="text-base font-bold text-expense">{formatCurrency(owed)}</Text>
        </View>

        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{t("billSplit.note")}</Text>
        <GlassSurface radius={16}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t("billSplit.notePlaceholder")}
            placeholderTextColor={colors.muted}
            multiline
            className="px-4 py-3 text-base text-ink"
            style={{ minHeight: 70, textAlignVertical: "top" }}
          />
        </GlassSurface>

        <View className="mt-6">
          <Button title={t("billSplit.save")} onPress={onSave} loading={bill.isSubmitting} />
        </View>
        {isEdit ? (
          <Pressable onPress={onDelete} className="mt-3 items-center py-2 active:opacity-60">
            <Text className="font-semibold text-expense">{t("billSplit.delete")}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
