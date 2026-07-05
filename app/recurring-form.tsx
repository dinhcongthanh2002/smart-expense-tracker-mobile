import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { DateField } from "@/components/ui/DateField";
import { SelectField } from "@/components/ui/SelectField";
import { CategoryBadge } from "@/components/CategoryBadge";
import { CategoryPickerSheet } from "@/components/CategoryPickerSheet";
import { CategoryFacade } from "@/store/category";
import { WalletFacade } from "@/store/wallet";
import { WALLET_TYPE_META } from "@/store/wallet/model";
import { RecurringFacade } from "@/store/recurring";
import {
  FREQUENCIES,
  FREQUENCY_META,
  type RecurringUpsertModel,
} from "@/store/recurring/model";
import { RecurringFrequency, TransactionType } from "@/models/enums";
import { groupThousands, onlyDigits } from "@/lib/format";
import { colors } from "@/theme/colors";

const TYPE_TABS = [
  { label: "Chi tiêu", value: TransactionType.Expense },
  { label: "Thu nhập", value: TransactionType.Income },
];

export default function RecurringFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;
  const category = CategoryFacade();
  const wallet = WalletFacade();
  const rec = RecurringFacade();

  const [type, setType] = useState<TransactionType>(TransactionType.Expense);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [walletId, setWalletId] = useState<string | undefined>();
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>(RecurringFrequency.Monthly);
  const [startDate, setStartDate] = useState(new Date());
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d;
  });
  const [note, setNote] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    category.get({ page: 1, size: 200 });
    wallet.get({ page: 1, size: 100 });
    if (params.id) rec.getById(params.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    const r = rec.data;
    if (isEdit && r && r.id === params.id) {
      setType(r.type);
      setCategoryId(r.categoryId);
      setWalletId(r.walletId ?? undefined);
      setAmount(String(r.amount ?? ""));
      setFrequency(r.frequency);
      if (r.startDate) setStartDate(new Date(r.startDate));
      if (r.endDate) {
        setHasEndDate(true);
        setEndDate(new Date(r.endDate));
      }
      setNote(r.note ?? "");
      setIsActive(r.isActive);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.data]);

  const categories = category.pagination?.content ?? [];
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const walletOptions = useMemo(
    () =>
      (wallet.pagination?.content ?? []).map((w) => ({
        value: w.id!,
        label: w.name ?? "",
        sublabel: `${WALLET_TYPE_META[w.type].label} · ${w.currency}`,
      })),
    [wallet.pagination],
  );

  const onSave = async () => {
    const value = Number(onlyDigits(amount)) || 0;
    if (!categoryId || value <= 0) return;
    const values: RecurringUpsertModel = {
      categoryId,
      walletId: walletId ?? null,
      amount: value,
      type,
      note: note.trim() || undefined,
      frequency,
      startDate: dayjs(startDate).format("YYYY-MM-DDTHH:mm:ss"),
      endDate: hasEndDate ? dayjs(endDate).format("YYYY-MM-DDTHH:mm:ss") : null,
      isActive,
    };
    try {
      if (isEdit && params.id) {
        await rec.put({ id: params.id, ...values }).unwrap();
      } else {
        await rec.post(values).unwrap();
      }
      router.back();
    } catch {
      // toast surfaced by API layer
    }
  };

  const onDelete = async () => {
    if (!params.id) return;
    try {
      await rec.delete(params.id).unwrap();
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
          {isEdit ? "Sửa định kỳ" : "Định kỳ mới"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* type */}
        <GlassSurface radius={16} className="my-3 flex-row p-1">
          {TYPE_TABS.map((t) => {
            const active = type === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => {
                  setType(t.value);
                  setCategoryId(undefined);
                }}
                className={`flex-1 items-center rounded-xl py-2.5 ${active ? "bg-primary" : ""}`}
              >
                <Text className={`font-semibold ${active ? "text-white" : "text-muted"}`}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </GlassSurface>

        {/* amount */}
        <GlassSurface radius={20} className="my-2 items-center py-6">
          <Text className="text-sm text-muted">Số tiền</Text>
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
        </GlassSurface>

        {/* category */}
        <Text className="mb-2 ml-1 mt-2 text-sm font-medium text-muted">Danh mục</Text>
        <Pressable onPress={() => setPickerOpen(true)}>
          <GlassSurface radius={16}>
            <View className="h-14 flex-row items-center gap-3 px-4">
              {selectedCategory ? (
                <>
                  <CategoryBadge
                    icon={selectedCategory.icon}
                    color={selectedCategory.color || colors.primary}
                    size={34}
                  />
                  <Text className="flex-1 text-base text-ink">{selectedCategory.name}</Text>
                </>
              ) : (
                <Text className="flex-1 text-base text-muted">Chọn danh mục</Text>
              )}
              <Ionicons name="chevron-down" size={18} color={colors.muted} />
            </View>
          </GlassSurface>
        </Pressable>

        {/* wallet */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">Ví (tuỳ chọn)</Text>
        <SelectField
          placeholder="Chọn ví"
          title="Chọn ví"
          value={walletId}
          options={walletOptions}
          onChange={setWalletId}
          emptyText="Chưa có ví."
        />

        {/* frequency */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">Tần suất</Text>
        <View className="flex-row flex-wrap gap-2">
          {FREQUENCIES.map((f) => {
            const active = frequency === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFrequency(f)}
                className={`rounded-full px-4 py-2.5 ${active ? "bg-primary" : "bg-white/[0.06]"}`}
              >
                <Text className={active ? "font-semibold text-white" : "text-muted"}>
                  {FREQUENCY_META[f].label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* start date */}
        <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">Ngày bắt đầu</Text>
        <DateField value={startDate} onChange={setStartDate} />

        {/* end date */}
        <View className="mb-2 ml-1 mt-4 flex-row items-center justify-between">
          <Text className="text-sm font-medium text-muted">Có ngày kết thúc</Text>
          <Switch
            value={hasEndDate}
            onValueChange={setHasEndDate}
            trackColor={{ true: colors.primary, false: "rgba(255,255,255,0.15)" }}
            thumbColor="#fff"
          />
        </View>
        {hasEndDate ? <DateField value={endDate} onChange={setEndDate} /> : null}

        {/* active */}
        <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-white/[0.06] px-4 py-3">
          <View>
            <Text className="font-medium text-ink">Đang hoạt động</Text>
            <Text className="text-xs text-muted">Tự động tạo giao dịch theo lịch</Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ true: colors.income, false: "rgba(255,255,255,0.15)" }}
            thumbColor="#fff"
          />
        </View>

        {/* note */}
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

        <View className="mt-8 gap-3">
          <Button
            title={isEdit ? "Cập nhật" : "Tạo định kỳ"}
            onPress={onSave}
            loading={rec.isSubmitting}
          />
          {isEdit && <Button title="Xoá định kỳ" variant="danger" onPress={onDelete} />}
        </View>
      </ScrollView>

      <CategoryPickerSheet
        visible={pickerOpen}
        categories={categories}
        type={type}
        value={categoryId}
        onSelect={(c) => {
          setCategoryId(c.id);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </Screen>
  );
}
