import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { FieldError } from "@/components/ui/FieldError";
import { DateField } from "@/components/ui/DateField";
import { SelectField } from "@/components/ui/SelectField";
import { CategoryBadge } from "@/components/CategoryBadge";
import { CategoryPickerSheet } from "@/components/CategoryPickerSheet";
import { CategoryFacade } from "@/store/category";
import { TransactionFacade } from "@/store/transaction";
import { WalletFacade } from "@/store/wallet";
import type { AttachmentViewModel } from "@/store/user/model";
import { TransactionType, WalletType } from "@/models/enums";

const WALLET_TYPE_KEY: Record<WalletType, string> = {
  [WalletType.Cash]: "cash",
  [WalletType.Bank]: "bank",
  [WalletType.EWallet]: "ewallet",
  [WalletType.Other]: "other",
};
import { formatCurrency, groupThousands, onlyDigits } from "@/lib/format";
import { uploadImageAsync, resolveFileUrl } from "@/lib/upload";
import { notify } from "@/lib/notify";
import { colors } from "@/theme/colors";

const TYPE_TABS = [
  { labelKey: "common.enums.txType.expense", value: TransactionType.Expense },
  { labelKey: "common.enums.txType.income", value: TransactionType.Income },
  { labelKey: "common.enums.txType.transfer", value: TransactionType.Transfer },
];

export default function TransactionFormScreen() {
  const router = useRouter();
  const { t: translate } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;
  const category = CategoryFacade();
  const wallet = WalletFacade();
  const tx = TransactionFacade();

  const [type, setType] = useState<TransactionType>(TransactionType.Expense);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [walletId, setWalletId] = useState<string | undefined>();
  const [toWalletId, setToWalletId] = useState<string | undefined>();
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [receipt, setReceipt] = useState<AttachmentViewModel | undefined>();
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{
    amount?: string;
    category?: string;
    wallet?: string;
    toWallet?: string;
  }>({});

  const isTransfer = type === TransactionType.Transfer;
  // Set when the user leaves to create a category, so we can reopen the picker
  // (with the refreshed list) when they come back.
  const reopenPickerRef = useRef(false);

  useEffect(() => {
    wallet.get({ page: 1, size: 100 });
    if (params.id) tx.getById(params.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Refetch categories on focus so a category created from the picker shows up,
  // and reopen the picker if the user just came back from creating one.
  useFocusEffect(
    useCallback(() => {
      category.get({ page: 1, size: 200 });
      if (reopenPickerRef.current) {
        reopenPickerRef.current = false;
        setPickerOpen(true);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  useEffect(() => {
    const t = tx.data;
    if (isEdit && t && t.id === params.id) {
      setType(t.type);
      setAmount(String(t.amount ?? ""));
      setCategoryId(t.categoryId);
      setWalletId(t.walletId);
      setToWalletId(t.toWalletId);
      setNote(t.note ?? "");
      setReceipt(t.receipt);
      if (t.transactionDate) setDate(new Date(t.transactionDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx.data]);

  const categories = category.pagination?.content ?? [];
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const wallets = wallet.pagination?.content ?? [];

  const walletOptions = useMemo(
    () =>
      wallets.map((w) => ({
        value: w.id!,
        label: w.name ?? "",
        sublabel: `${translate("common.enums.walletType." + WALLET_TYPE_KEY[w.type])} · ${formatCurrency(w.currentBalance, w.currency)}`,
      })),
    [wallets, translate],
  );

  const onType = (t: TransactionType) => {
    setType(t);
    setCategoryId(undefined);
  };

  const chooseReceiptSource = () => {
    Alert.alert(translate("transactionForm.receipt"), translate("transactionForm.receiptSource"), [
      { text: translate("transactionForm.takePhoto"), onPress: () => pickReceipt("camera") },
      { text: translate("transactionForm.chooseLibrary"), onPress: () => pickReceipt("library") },
      { text: translate("common.cancel"), style: "cancel" },
    ]);
  };

  const pickReceipt = async (source: "camera" | "library") => {
    let res: ImagePicker.ImagePickerResult;
    if (source === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        notify.error(translate("transactionForm.cameraPermission"));
        return;
      }
      res = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 });
    } else {
      // Photo library uses the system picker (no runtime permission needed).
      res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    }
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    setUploading(true);
    try {
      const att = await uploadImageAsync({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
      if (att) setReceipt(att);
    } catch {
      // toast surfaced by API layer
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async () => {
    if (!params.id) return;
    try {
      await tx.delete(params.id).unwrap();
      router.back();
    } catch {
      // toast surfaced by API layer
    }
  };

  const onSave = useCallback(async () => {
    const value = Number(amount) || 0;
    const e: typeof errors = {};
    if (value <= 0) e.amount = translate("common.validation.amountRequired");
    if (!isTransfer && !categoryId) e.category = translate("common.validation.categoryRequired");
    if (isTransfer) {
      if (!walletId) e.wallet = translate("common.validation.walletRequired");
      if (!toWalletId) e.toWallet = translate("common.validation.toWalletRequired");
      else if (walletId && walletId === toWalletId)
        e.toWallet = translate("common.validation.sameWallet");
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const values = {
      type,
      amount: value,
      categoryId: isTransfer ? undefined : categoryId,
      walletId: walletId || undefined,
      toWalletId: isTransfer ? toWalletId : undefined,
      note: note.trim() || undefined,
      transactionDate: dayjs(date).format("YYYY-MM-DDTHH:mm:ss"),
      receipt: receipt || undefined,
    };
    try {
      if (isEdit && params.id) {
        await tx.put({ id: params.id, ...values }).unwrap();
      } else {
        await tx.post(values).unwrap();
      }
      router.back();
    } catch {
      // toast surfaced by API layer
    }
  }, [amount, type, categoryId, walletId, toWalletId, note, date, receipt, isTransfer, isEdit, params.id, tx, router, translate]);

  return (
    <Screen orbs={false} className="px-5" edges={["top"]}>
      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1"
      >
        <View className="mb-2 mt-1 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text className="text-base text-muted">{translate("common.cancel")}</Text>
          </Pressable>
          <Text className="text-lg font-bold text-ink">
            {isEdit ? translate("transactionForm.editTitle") : translate("transactionForm.newTitle")}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-10"
          keyboardShouldPersistTaps="handled"
        >
          {/* type */}
          <GlassSurface radius={16} className="flex-row p-1" style={{ marginVertical: 12 }}>
            {TYPE_TABS.map((t) => {
              const active = type === t.value;
              return (
                <Pressable
                  key={t.value}
                  onPress={() => onType(t.value)}
                  className={`flex-1 items-center rounded-xl py-2.5 ${active ? "bg-primary" : ""}`}
                >
                  <Text className={`text-[13px] font-semibold ${active ? "text-white" : "text-muted"}`}>
                    {translate(t.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </GlassSurface>

          {/* amount */}
          <GlassSurface
            radius={20}
            className="items-center py-6"
            style={{
              marginVertical: 12,
              ...(errors.amount ? { borderColor: colors.expense, borderWidth: 1 } : {}),
            }}
          >
            <Text className="text-sm text-muted">{translate("common.amount")}</Text>
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
            <Text className="text-sm text-muted">{translate("transactionForm.currency")}</Text>
          </GlassSurface>
          <FieldError error={errors.amount} />

          {/* category (hidden for transfer) */}
          {!isTransfer ? (
            <>
              <Text className="mb-2 ml-1 mt-2 text-sm font-medium text-muted">{translate("common.category")}</Text>
              <Pressable onPress={() => setPickerOpen(true)}>
                <GlassSurface
                  radius={16}
                  style={errors.category ? { borderColor: colors.expense, borderWidth: 1 } : undefined}
                >
                  <View className="h-14 flex-row items-center gap-3 px-4">
                    {selectedCategory ? (
                      <>
                        <CategoryBadge
                          icon={selectedCategory.icon}
                          color={selectedCategory.color || colors.primary}
                          size={34}
                        />
                        <Text className="flex-1 text-base text-ink">
                          {selectedCategory.name}
                        </Text>
                      </>
                    ) : (
                      <Text className="flex-1 text-base text-muted">{translate("transactionForm.selectCategory")}</Text>
                    )}
                    <Ionicons name="chevron-down" size={18} color={colors.muted} />
                  </View>
                </GlassSurface>
              </Pressable>
              <FieldError error={errors.category} />
            </>
          ) : null}

          {/* source wallet */}
          <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">
            {isTransfer ? translate("transactionForm.sourceWallet") : translate("transactionForm.wallet")}
          </Text>
          <SelectField
            placeholder={translate("transactionForm.selectWallet")}
            title={translate("transactionForm.selectWallet")}
            value={walletId}
            options={walletOptions}
            onChange={setWalletId}
            allowClear={!isTransfer}
            emptyText={translate("transactionForm.noWallet")}
          />
          <FieldError error={errors.wallet} />

          {/* destination wallet (transfer) */}
          {isTransfer ? (
            <>
              <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{translate("transactionForm.destWallet")}</Text>
              <SelectField
                placeholder={translate("transactionForm.selectReceiveWallet")}
                title={translate("transactionForm.destWallet")}
                value={toWalletId}
                options={walletOptions.filter((o) => o.value !== walletId)}
                onChange={setToWalletId}
                allowClear={false}
                emptyText={translate("transactionForm.noOtherWallet")}
              />
              <FieldError error={errors.toWallet} />
            </>
          ) : null}

          {/* date */}
          <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{translate("transactionForm.transactionDate")}</Text>
          <DateField value={date} onChange={setDate} maximumDate={new Date()} />

          {/* note */}
          <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">{translate("common.note")}</Text>
          <GlassSurface radius={16}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={translate("transactionForm.notePlaceholder")}
              placeholderTextColor={colors.muted}
              selectionColor={colors.primary}
              multiline
              className="px-4 py-3 text-base text-ink"
              style={{ minHeight: 88, textAlignVertical: "top" }}
            />
          </GlassSurface>

          {/* receipt */}
          <Text className="mb-2 ml-1 mt-4 text-sm font-medium text-muted">
            {translate("transactionForm.receipt")}
          </Text>
          {receipt ? (
            <GlassSurface radius={16} className="flex-row items-center gap-3 p-3">
              <Image
                source={{ uri: resolveFileUrl(receipt) }}
                style={{ width: 56, height: 56, borderRadius: 10 }}
                contentFit="cover"
              />
              <Text className="flex-1 text-sm text-ink" numberOfLines={1}>
                {receipt.fileName ?? translate("transactionForm.receiptFallback")}
              </Text>
              <Pressable
                onPress={() => setReceipt(undefined)}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center"
              >
                <Ionicons name="trash-outline" size={20} color={colors.expense} />
              </Pressable>
            </GlassSurface>
          ) : (
            <Pressable onPress={chooseReceiptSource} disabled={uploading}>
              <GlassSurface radius={16}>
                <View className="h-14 flex-row items-center justify-center gap-2">
                  {uploading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Ionicons name="camera-outline" size={20} color={colors.primarySoft} />
                  )}
                  <Text className="font-medium text-primarySoft">
                    {uploading ? translate("common.loading") : translate("transactionForm.addReceipt")}
                  </Text>
                </View>
              </GlassSurface>
            </Pressable>
          )}

          <View className="mt-8 gap-3">
            <Button title={translate("transactionForm.save")} onPress={onSave} loading={tx.isSubmitting} />
            {isEdit ? (
              <Button title={translate("transactionForm.delete")} variant="danger" onPress={onDelete} />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {!isTransfer ? (
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
          onCreate={() => {
            setPickerOpen(false);
            reopenPickerRef.current = true;
            router.push({ pathname: "/category-form", params: { type: String(type) } });
          }}
        />
      ) : null}
    </Screen>
  );
}
