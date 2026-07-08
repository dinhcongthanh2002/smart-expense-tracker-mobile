import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { GlassSurface } from "./GlassSurface";
import { formatDate } from "@/lib/format";
import { colors } from "@/theme/colors";
import { useThemePalette } from "@/lib/theme";

interface DateFieldProps {
  value: Date;
  onChange: (d: Date) => void;
  maximumDate?: Date;
}

/**
 * Date field that pops up a picker. On iOS it shows Apple's native inline
 * calendar in a bottom sheet; on Android the native date dialog.
 */
export function DateField({ value, onChange, maximumDate }: DateFieldProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { scheme } = useThemePalette();
  const [show, setShow] = useState(false);

  const onAndroidChange = (e: DateTimePickerEvent, d?: Date) => {
    setShow(false);
    if (e.type !== "dismissed" && d) onChange(d);
  };

  return (
    <>
      <Pressable onPress={() => setShow(true)}>
        <GlassSurface radius={16}>
          <View className="h-14 flex-row items-center justify-between px-4">
            <Text className="text-base text-ink">{formatDate(value)}</Text>
            <Ionicons name="calendar-outline" size={20} color={colors.muted} />
          </View>
        </GlassSurface>
      </Pressable>

      {Platform.OS === "android" && show ? (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          maximumDate={maximumDate}
          onChange={onAndroidChange}
        />
      ) : null}

      {Platform.OS !== "android" ? (
        <Modal
          visible={show}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setShow(false)}
        >
          <Pressable className="flex-1" style={{ backgroundColor: colors.scrim }} onPress={() => setShow(false)} />
          <View
            style={{ paddingBottom: insets.bottom + 8 }}
            className="rounded-t-3xl bg-surface"
          >
            <View className="flex-row items-center justify-between px-5 py-3">
              <Text className="text-lg font-bold text-ink">{t("common.selectDate")}</Text>
              <Pressable onPress={() => setShow(false)} hitSlop={10}>
                <Text className="text-base font-semibold text-primary">{t("common.done")}</Text>
              </Pressable>
            </View>
            <View className="items-center pb-4">
              {/* `spinner` (Apple wheel) receives touches reliably inside a
                  Modal, unlike `inline` which can be unresponsive. */}
              <DateTimePicker
                value={value}
                mode="date"
                display="spinner"
                themeVariant={scheme}
                maximumDate={maximumDate}
                onChange={(_, d) => {
                  if (d) onChange(d);
                }}
                style={{ width: "100%" }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}
