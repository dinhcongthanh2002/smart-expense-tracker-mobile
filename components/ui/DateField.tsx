import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
    type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { createElement, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import dayjs from "dayjs";

import { formatDate, formatDateTime } from "@/lib/format";
import { useThemePalette } from "@/lib/theme";
import { colors } from "@/theme/colors";
import { GlassSurface } from "./GlassSurface";

// A stale/uninitialised date can arrive as the Unix epoch (which renders as
// 1/1/1970) or an Invalid Date. This app never has legitimate dates before 2000,
// so anything older is treated as "unset" (year check is timezone-proof, unlike
// comparing getTime() to 0 which flips sign across UTC offsets).
function isRealDate(d?: Date): d is Date {
  return d instanceof Date && !Number.isNaN(d.getTime()) && d.getFullYear() >= 2000;
}

// Fall back to "now" so the picker never opens on 1/1/1970.
function normalizeDate(d?: Date): Date {
  return isRealDate(d) ? d : new Date();
}

// Hard floor for the wheel — iOS clamps to this, so it can never land on 1970
// even if the native picker retained a stale internal value.
const MIN_DATE = new Date(2000, 0, 1);

interface DateFieldProps {
  value: Date;
  onChange: (d: Date) => void;
  maximumDate?: Date;
  /** "date" (default) or "datetime" to also pick the time. */
  mode?: "date" | "datetime";
}

/**
 * Date (and optionally time) field that pops up a picker. On iOS the native wheel
 * is shown in a @gorhom/bottom-sheet modal (same sheet chrome as the rest of the
 * app); on Android the native dialog(s) — date then time for "datetime". The wheel
 * is localized to the app language via the `locale` prop.
 */
export function DateField({ value, onChange, maximumDate, mode = "date" }: DateFieldProps) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { scheme } = useThemePalette();
  const sheetRef = useRef<BottomSheetModal>(null);
  // Guard against a stale/epoch value or bound that would open the picker on
  // 1/1/1970 (iOS clamps the wheel to maximumDate, so a bad max drags it there).
  const safeValue = normalizeDate(value);
  const safeMax = isRealDate(maximumDate) ? maximumDate : undefined;
  // Android runs date then time as separate dialogs; hold the in-progress value.
  const [androidStep, setAndroidStep] = useState<null | "date" | "time">(null);
  const pendingRef = useRef<Date>(safeValue);
  // iOS: local value while the wheel is spinning — committed on close. Feeding
  // onChange on every tick re-renders the parent mid-spin and makes the wheel
  // jump back to the old date, so we isolate it here.
  const [tempDate, setTempDate] = useState<Date>(safeValue);
  // Bumped on each open to force the native wheel to remount and re-read `value`
  // (the iOS spinner otherwise keeps its own internal date and can stick on 1970).
  const [openSeq, setOpenSeq] = useState(0);

  const isDateTime = mode === "datetime";
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";

  const openAndroid = () => {
    pendingRef.current = safeValue;
    setAndroidStep("date");
  };

  const openIOS = () => {
    setTempDate(safeValue);
    setOpenSeq((n) => n + 1);
    sheetRef.current?.present();
  };

  const onAndroidChange = (e: DateTimePickerEvent, d?: Date) => {
    if (e.type === "dismissed" || !d) {
      setAndroidStep(null);
      return;
    }
    if (androidStep === "date") {
      // Keep the picked date, carry the existing time.
      const merged = new Date(pendingRef.current);
      merged.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
      pendingRef.current = merged;
      if (isDateTime) {
        setAndroidStep("time");
      } else {
        setAndroidStep(null);
        onChange(merged);
      }
    } else {
      // Time step: apply hours/minutes to the date chosen above.
      const merged = new Date(pendingRef.current);
      merged.setHours(d.getHours(), d.getMinutes(), 0, 0);
      setAndroidStep(null);
      onChange(merged);
    }
  };

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

  // Web: the native RN datetimepicker doesn't render — use the browser's input.
  if (Platform.OS === "web") {
    const fmt = isDateTime ? "YYYY-MM-DDTHH:mm" : "YYYY-MM-DD";
    return (
      <GlassSurface radius={16}>
        <View className="h-14 flex-row items-center justify-between px-4">
          {createElement("input", {
            type: isDateTime ? "datetime-local" : "date",
            value: dayjs(safeValue).format(fmt),
            max: safeMax ? dayjs(safeMax).format(fmt) : undefined,
            onChange: (e: { target: { value: string } }) => {
              const v = e?.target?.value;
              if (v) onChange(dayjs(v).toDate());
            },
            style: {
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: colors.ink,
              fontSize: 16,
              // Make the browser's calendar popup follow the app theme.
              colorScheme: scheme,
            },
          })}
          <Ionicons name="calendar-outline" size={20} color={colors.muted} />
        </View>
      </GlassSurface>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => (Platform.OS === "android" ? openAndroid() : openIOS())}
      >
        <GlassSurface radius={16}>
          <View className="h-14 flex-row items-center justify-between px-4">
            <Text className="text-base text-ink">
              {isDateTime ? formatDateTime(safeValue) : formatDate(safeValue)}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={colors.muted} />
          </View>
        </GlassSurface>
      </Pressable>

      {Platform.OS === "android" && androidStep ? (
        <DateTimePicker
          value={androidStep === "time" ? pendingRef.current : safeValue}
          mode={androidStep}
          display="default"
          is24Hour
          maximumDate={androidStep === "date" ? safeMax : undefined}
          onChange={onAndroidChange}
        />
      ) : null}

      {Platform.OS !== "android" ? (
        <BottomSheetModal
          key={scheme}
          ref={sheetRef}
          enableDynamicSizing
          // Push onto the stack (don't dismiss/replace) so opening this from inside
          // another bottom sheet — e.g. the transaction filter — keeps that sheet open.
          stackBehavior="push"
          // Only pan from the handle so the wheel keeps its vertical gestures.
          enableContentPanningGesture={false}
          onDismiss={() => onChange(tempDate)}
          backdropComponent={renderBackdrop}
          backgroundStyle={{ backgroundColor: colors.surface }}
          handleIndicatorStyle={{ backgroundColor: colors.glassBorder }}
        >
          <BottomSheetView style={{ paddingBottom: insets.bottom + 8 }}>
            <View className="flex-row items-center justify-between px-5 py-3">
              <Text className="text-lg font-bold text-ink">
                {t(isDateTime ? "common.selectDateTime" : "common.selectDate")}
              </Text>
              <Pressable onPress={() => sheetRef.current?.dismiss()} hitSlop={10}>
                <Text className="text-base font-semibold text-primary">{t("common.done")}</Text>
              </Pressable>
            </View>
            <View className="items-center pb-4">
              <DateTimePicker
                key={openSeq}
                value={tempDate}
                mode={mode}
                display="spinner"
                themeVariant={scheme}
                locale={locale}
                minimumDate={MIN_DATE}
                maximumDate={safeMax}
                onChange={(_, d) => {
                  if (d) setTempDate(d);
                }}
                style={{ width: "100%" }}
              />
            </View>
          </BottomSheetView>
        </BottomSheetModal>
      ) : null}
    </>
  );
}
