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
  // Android runs date then time as separate dialogs; hold the in-progress value.
  const [androidStep, setAndroidStep] = useState<null | "date" | "time">(null);
  const pendingRef = useRef<Date>(value);
  // iOS: local value while the wheel is spinning — committed on close. Feeding
  // onChange on every tick re-renders the parent mid-spin and makes the wheel
  // jump back to the old date, so we isolate it here.
  const [tempDate, setTempDate] = useState<Date>(value);

  const isDateTime = mode === "datetime";
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";

  const openAndroid = () => {
    pendingRef.current = value;
    setAndroidStep("date");
  };

  const openIOS = () => {
    setTempDate(value);
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
            value: dayjs(value).format(fmt),
            max: maximumDate ? dayjs(maximumDate).format(fmt) : undefined,
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
              {isDateTime ? formatDateTime(value) : formatDate(value)}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={colors.muted} />
          </View>
        </GlassSurface>
      </Pressable>

      {Platform.OS === "android" && androidStep ? (
        <DateTimePicker
          value={androidStep === "time" ? pendingRef.current : value}
          mode={androidStep}
          display="default"
          is24Hour
          maximumDate={androidStep === "date" ? maximumDate : undefined}
          onChange={onAndroidChange}
        />
      ) : null}

      {Platform.OS !== "android" ? (
        <BottomSheetModal
          key={scheme}
          ref={sheetRef}
          enableDynamicSizing
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
                value={tempDate}
                mode={mode}
                display="spinner"
                themeVariant={scheme}
                locale={locale}
                maximumDate={maximumDate}
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
