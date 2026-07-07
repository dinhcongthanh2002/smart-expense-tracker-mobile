import { useCallback, useRef } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";

import { GlassSurface } from "./GlassSurface";
import { colors } from "@/theme/colors";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SelectFieldProps {
  placeholder: string;
  title?: string;
  value?: string;
  options: SelectOption[];
  onChange: (value?: string) => void;
  allowClear?: boolean;
  emptyText?: string;
}

/** Pressable field that opens a bottom-sheet list of options. */
export function SelectField({
  placeholder,
  title,
  value,
  options,
  onChange,
  allowClear = true,
  emptyText,
}: SelectFieldProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetRef = useRef<BottomSheetModal>(null);
  const selected = options.find((o) => o.value === value);

  const pick = (v?: string) => {
    onChange(v);
    sheetRef.current?.dismiss();
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

  return (
    <>
      <Pressable onPress={() => sheetRef.current?.present()}>
        <GlassSurface radius={16}>
          <View className="h-14 flex-row items-center justify-between px-4">
            <Text
              className={selected ? "text-base text-ink" : "text-base text-muted"}
              numberOfLines={1}
            >
              {selected ? selected.label : placeholder}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.muted} />
          </View>
        </GlassSurface>
      </Pressable>

      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        maxDynamicContentSize={height * 0.75}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.25)" }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between pb-2 pt-1">
            <Text className="text-lg font-bold text-ink">{title ?? placeholder}</Text>
            <Pressable onPress={() => sheetRef.current?.dismiss()} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>
          {allowClear ? (
            <Pressable
              onPress={() => pick(undefined)}
              className="flex-row items-center justify-between border-b border-white/[0.05] py-3.5 active:opacity-60"
            >
              <Text className="text-muted">{t("common.selectNone")}</Text>
              {!value ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              ) : null}
            </Pressable>
          ) : null}
          {options.length === 0 ? (
            <Text className="py-8 text-center text-muted">
              {emptyText ?? t("common.noOptions")}
            </Text>
          ) : (
            options.map((o) => (
              <Pressable
                key={o.value}
                onPress={() => pick(o.value)}
                className="flex-row items-center justify-between border-b border-white/[0.05] py-3.5 active:opacity-60"
              >
                <View className="flex-1">
                  <Text className="text-base text-ink" numberOfLines={1}>
                    {o.label}
                  </Text>
                  {o.sublabel ? (
                    <Text className="mt-0.5 text-xs text-muted">{o.sublabel}</Text>
                  ) : null}
                </View>
                {value === o.value ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                ) : null}
              </Pressable>
            ))
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
}
