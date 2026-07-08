import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

import { cn } from "@/lib/cn";
import { colors, gradients } from "@/theme/colors";
import { GlassSurface } from "./GlassSurface";

export type ButtonVariant = "primary" | "glass" | "ghost" | "danger";

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  className,
  textClassName,
  fullWidth = true,
  leftIcon,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={[animatedStyle, fullWidth && { width: "100%" }]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => (scale.value = withSpring(0.96, { damping: 15 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 15 }))}
        className={cn(
          "h-14 items-center justify-center overflow-hidden rounded-2xl",
          fullWidth && "w-full",
          variant === "ghost" && "border border-glass-border",
          isDisabled && "opacity-50",
          className,
        )}
      >
        {variant === "primary" && (
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {variant === "danger" && (
        <LinearGradient
          colors={gradients.expense}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {variant === "glass" && (
        <GlassSurface
          interactive
          radius={16}
          bordered={false}
          style={StyleSheet.absoluteFill}
        />
      )}

        <View className="flex-row items-center justify-center gap-2 px-5">
          {loading ? (
            <ActivityIndicator color={variant === "ghost" ? colors.ink : "#fff"} />
          ) : (
            <>
              {leftIcon}
              <Text
                className={cn(
                  "text-base font-semibold text-white",
                  variant === "ghost" && "text-ink",
                  textClassName,
                )}
              >
                {title}
              </Text>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
