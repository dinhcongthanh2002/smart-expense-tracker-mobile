import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
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
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  const pick = (v?: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)}>
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

      <Modal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable className="flex-1 bg-black/60" onPress={() => setOpen(false)} />
        <View
          style={{ maxHeight: "70%", paddingBottom: insets.bottom + 8 }}
          className="rounded-t-3xl bg-surface"
        >
          <View className="items-center pt-3">
            <View className="h-1.5 w-10 rounded-full bg-white/20" />
          </View>
          <View className="flex-row items-center justify-between px-5 py-3">
            <Text className="text-lg font-bold text-ink">{title ?? placeholder}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>
          <ScrollView className="px-5" contentContainerClassName="pb-4">
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
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
