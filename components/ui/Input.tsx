import { useState } from "react";
import {
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { cn } from "@/lib/cn";
import { colors } from "@/theme/colors";
import { GlassSurface } from "./GlassSurface";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  leftIcon,
  rightElement,
  containerClassName,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className={cn("w-full", containerClassName)}>
      {label ? (
        <Text className="mb-2 ml-1 text-sm font-medium text-muted">{label}</Text>
      ) : null}
      <GlassSurface
        radius={16}
        bordered
        style={
          focused
            ? { borderColor: colors.primary, borderWidth: 1 }
            : error
              ? { borderColor: colors.expense, borderWidth: 1 }
              : undefined
        }
      >
        <View className="h-14 flex-row items-center px-4">
          {leftIcon ? <View className="mr-3">{leftIcon}</View> : null}
          <TextInput
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            className="flex-1 text-base text-ink"
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
          {rightElement ? <View className="ml-2">{rightElement}</View> : null}
        </View>
      </GlassSurface>
      {error ? (
        <Text className="mt-1.5 ml-1 text-xs text-expense">{error}</Text>
      ) : null}
    </View>
  );
}
