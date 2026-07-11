import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemePalette } from "@/lib/theme";
import { useVoiceInput } from "@/lib/useVoiceInput";
import { formatDate, groupThousands, onlyDigits } from "@/lib/format";
import { notify } from "@/lib/notify";
import { TransactionType } from "@/models/enums";
import { CategoryFacade } from "@/store/category";
import { WalletFacade } from "@/store/wallet";
import { parseTransactionText, TransactionFacade } from "@/store/transaction";
import type { TransactionParseResult } from "@/store/transaction/model";
import { colors } from "@/theme/colors";
import { CategoryBadge } from "./CategoryBadge";
import { Button } from "./ui/Button";

export interface QuickAddSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface Props {
  /** Called after a transaction is created so the caller can refresh. */
  onSaved?: () => void;
}

type Phase = "listening" | "parsing" | "review";

// The sheet renders (in JS) beneath the native tab bar, which is drawn on top by
// the OS. Add clearance so the bottom row (text input / Save) isn't covered.
const TAB_BAR_CLEARANCE = 72;

const TYPE_OPTIONS = [
  { value: TransactionType.Expense, labelKey: "common.enums.txType.expense" },
  { value: TransactionType.Income, labelKey: "common.enums.txType.income" },
];

export const QuickAddSheet = forwardRef<QuickAddSheetRef, Props>(
  function QuickAddSheet({ onSaved }, ref) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const { scheme } = useThemePalette();
    const sheetRef = useRef<BottomSheetModal>(null);

    const category = CategoryFacade();
    const wallet = WalletFacade();
    const tx = TransactionFacade();

    const [phase, setPhase] = useState<Phase>("listening");
    const [rawText, setRawText] = useState("");
    const [manualText, setManualText] = useState("");
    const [saving, setSaving] = useState(false);

    // Draft fields (editable in the review step).
    const [type, setType] = useState<TransactionType>(TransactionType.Expense);
    const [amount, setAmount] = useState(""); // digits only (VND)
    const [categoryId, setCategoryId] = useState<string | undefined>();
    const [walletId, setWalletId] = useState<string | undefined>();
    const [note, setNote] = useState("");
    const [date, setDate] = useState<string>("");

    const runParse = useCallback(
      async (text: string) => {
        setRawText(text);
        setPhase("parsing");
        try {
          const result: TransactionParseResult | undefined =
            await parseTransactionText(text, walletId);
          if (!result?.draft) {
            setPhase("listening");
            return;
          }
          const d = result.draft;
          setType(d.type);
          setAmount(d.amount > 0 ? String(Math.round(d.amount)) : "");
          setCategoryId(d.categoryId);
          setWalletId(d.walletId ?? walletId);
          setNote(d.note ?? "");
          setDate(d.transactionDate);
          setPhase("review");
        } catch {
          // API layer already surfaced a toast; let the user retry.
          setPhase("listening");
        }
      },
      [walletId],
    );

    const voice = useVoiceInput({
      lang: "vi-VN",
      onFinalResult: (text) => runParse(text),
    });

    // Pulsing mic ring while listening.
    const pulse = useSharedValue(1);
    useEffect(() => {
      if (voice.recording) {
        pulse.value = withRepeat(withTiming(1.25, { duration: 700 }), -1, true);
      } else {
        pulse.value = withTiming(1, { duration: 200 });
      }
    }, [voice.recording, pulse]);
    const pulseStyle = useAnimatedStyle(() => ({
      transform: [{ scale: pulse.value }],
    }));

    const reset = useCallback(() => {
      setPhase("listening");
      setRawText("");
      setManualText("");
      setType(TransactionType.Expense);
      setAmount("");
      setCategoryId(undefined);
      setNote("");
      setDate("");
    }, []);

    useImperativeHandle(ref, () => ({
      present: () => {
        reset();
        // Load pickers (cached in redux) and preselect the first wallet.
        category.get({ page: 1, size: 200 });
        wallet.get({ page: 1, size: 100 });
        sheetRef.current?.present();
        // Kick off listening on the next tick so the sheet is mounted first.
        // In Expo Go / builds without the native module, stay in type-to-add mode.
        if (voice.supported) setTimeout(() => voice.start(), 350);
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const categories = category.pagination?.content ?? [];
    const wallets = wallet.pagination?.content ?? [];

    // Default wallet once loaded.
    useEffect(() => {
      if (!walletId && wallets.length > 0) setWalletId(wallets[0].id);
    }, [wallets, walletId]);

    const categoriesOfType = useMemo(
      () => categories.filter((c) => c.type === type),
      [categories, type],
    );

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.6}
          pressBehavior="close"
        />
      ),
      [],
    );

    const changeType = (next: TransactionType) => {
      setType(next);
      // Drop the category if it no longer matches the new type.
      const stillValid = categories.some(
        (c) => c.id === categoryId && c.type === next,
      );
      if (!stillValid) setCategoryId(undefined);
    };

    const save = async () => {
      const amountNum = Number(amount || "0");
      if (amountNum <= 0) {
        notify.error(t("quickAdd.errAmount"));
        return;
      }
      if (!categoryId) {
        notify.error(t("quickAdd.errCategory"));
        return;
      }
      setSaving(true);
      try {
        await tx.post({
          type,
          amount: amountNum,
          categoryId,
          walletId,
          note: note.trim() || undefined,
          transactionDate: date || new Date().toISOString(),
        });
        sheetRef.current?.dismiss();
        onSaved?.();
      } finally {
        setSaving(false);
      }
    };

    return (
      <BottomSheetModal
        key={scheme}
        ref={sheetRef}
        enableDynamicSizing
        maxDynamicContentSize={height * 0.9}
        onDismiss={() => voice.abort()}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.glassBorder }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-2 pt-1">
            <Text className="text-lg font-bold text-ink">
              {t("quickAdd.title")}
            </Text>
            <Pressable onPress={() => sheetRef.current?.dismiss()} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>

          {phase !== "review" ? (
            <View className="items-center py-4">
              {/* Mic */}
              <Animated.View style={pulseStyle}>
                <Pressable
                  onPress={() =>
                    voice.recording ? voice.stop() : voice.start()
                  }
                  disabled={phase === "parsing" || !voice.supported}
                  className={`h-24 w-24 items-center justify-center rounded-full active:opacity-70 ${
                    voice.supported ? "bg-primary/20" : "bg-glass-light"
                  }`}
                >
                  {phase === "parsing" ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Ionicons
                      name={
                        !voice.supported
                          ? "mic-off-outline"
                          : voice.recording
                            ? "mic"
                            : "mic-outline"
                      }
                      size={40}
                      color={voice.supported ? colors.primary : colors.muted}
                    />
                  )}
                </Pressable>
              </Animated.View>

              <Text className="mt-4 text-center text-base text-ink">
                {phase === "parsing"
                  ? t("quickAdd.parsing")
                  : !voice.supported
                    ? t("quickAdd.voiceNeedsBuild")
                    : voice.recording
                      ? t("quickAdd.listening")
                      : t("quickAdd.tapToSpeak")}
              </Text>

              {voice.supported && voice.transcript ? (
                <Text className="mt-2 text-center text-sm text-muted">
                  “{voice.transcript}”
                </Text>
              ) : (
                <Text className="mt-2 text-center text-xs text-muted">
                  {t("quickAdd.hint")}
                </Text>
              )}

              {voice.supported && voice.error ? (
                <Text className="mt-2 text-center text-xs text-expense">
                  {t("quickAdd.voiceUnavailable")}
                </Text>
              ) : null}

              {/* Type-instead fallback */}
              <View className="mt-6 w-full flex-row items-center gap-2 rounded-2xl bg-glass-light px-3.5">
                <Ionicons name="create-outline" size={18} color={colors.muted} />
                <BottomSheetTextInput
                  value={manualText}
                  onChangeText={setManualText}
                  placeholder={t("quickAdd.typePlaceholder")}
                  placeholderTextColor={colors.muted}
                  className="flex-1 py-3 text-base text-ink"
                  returnKeyType="done"
                  onSubmitEditing={() =>
                    manualText.trim() && runParse(manualText.trim())
                  }
                />
                {manualText.trim() ? (
                  <Pressable
                    onPress={() => runParse(manualText.trim())}
                    hitSlop={8}
                  >
                    <Ionicons name="arrow-forward-circle" size={26} color={colors.primary} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : (
            <View className="pt-1">
              {rawText ? (
                <Text className="mb-3 text-sm text-muted">
                  {t("quickAdd.heard")}: “{rawText}”
                </Text>
              ) : null}

              {/* Type toggle */}
              <View className="mb-4 flex-row rounded-2xl bg-glass-light p-1">
                {TYPE_OPTIONS.map((opt) => {
                  const active = type === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => changeType(opt.value)}
                      className={`flex-1 items-center rounded-xl py-2.5 ${active ? "bg-primary" : ""}`}
                    >
                      <Text
                        className={`text-sm font-semibold ${active ? "text-white" : "text-muted"}`}
                      >
                        {t(opt.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Amount */}
              <Text className="mb-1 text-xs font-medium text-muted">
                {t("quickAdd.amount")}
              </Text>
              <View className="mb-4 flex-row items-center rounded-2xl bg-glass-light px-4">
                <BottomSheetTextInput
                  value={groupThousands(amount)}
                  onChangeText={(v) => setAmount(onlyDigits(v))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  className="flex-1 py-3.5 text-2xl font-bold text-ink"
                />
                <Text className="text-base font-semibold text-muted">đ</Text>
              </View>

              {/* Category */}
              <Text className="mb-2 text-xs font-medium text-muted">
                {t("quickAdd.category")}
              </Text>
              {categoriesOfType.length === 0 ? (
                <Text className="mb-4 text-sm text-muted">
                  {t("quickAdd.noCategory")}
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-4"
                  contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
                >
                  {categoriesOfType.map((c) => {
                    const active = c.id === categoryId;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setCategoryId(c.id)}
                        className={`flex-row items-center gap-2 rounded-full border px-3 py-2 ${
                          active
                            ? "border-primary bg-primary/15"
                            : "border-glass-border"
                        }`}
                      >
                        <CategoryBadge
                          icon={c.icon}
                          color={c.color || colors.primary}
                          size={24}
                        />
                        <Text
                          className={`text-sm ${active ? "font-semibold text-primary" : "text-ink"}`}
                          numberOfLines={1}
                        >
                          {c.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {/* Wallet */}
              {wallets.length > 0 ? (
                <>
                  <Text className="mb-2 text-xs font-medium text-muted">
                    {t("quickAdd.wallet")}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-4"
                    contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
                  >
                    {wallets.map((w) => {
                      const active = w.id === walletId;
                      return (
                        <Pressable
                          key={w.id}
                          onPress={() => setWalletId(w.id)}
                          className={`rounded-full border px-3.5 py-2 ${
                            active
                              ? "border-primary bg-primary/15"
                              : "border-glass-border"
                          }`}
                        >
                          <Text
                            className={`text-sm ${active ? "font-semibold text-primary" : "text-ink"}`}
                            numberOfLines={1}
                          >
                            {w.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              ) : null}

              {/* Note */}
              <Text className="mb-1 text-xs font-medium text-muted">
                {t("quickAdd.note")}
              </Text>
              <View className="mb-4 rounded-2xl bg-glass-light px-4">
                <BottomSheetTextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={t("quickAdd.notePlaceholder")}
                  placeholderTextColor={colors.muted}
                  className="py-3.5 text-base text-ink"
                />
              </View>

              {date ? (
                <Text className="mb-4 text-xs text-muted">
                  {t("quickAdd.date")}: {formatDate(date, "DD/MM/YYYY")}
                </Text>
              ) : null}

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    title={t("quickAdd.again")}
                    variant="ghost"
                    onPress={reset}
                  />
                </View>
                <View className="flex-[2]">
                  <Button
                    title={t("quickAdd.save")}
                    onPress={save}
                    loading={saving}
                  />
                </View>
              </View>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
